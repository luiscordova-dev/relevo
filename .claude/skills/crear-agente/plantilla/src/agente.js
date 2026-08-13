// El cerebro operativo: qué hace el agente cuando llega un mensaje.

import { negocio } from "../negocio.js";
import { pensar, separarDatos } from "./cerebro.js";
import { interpretarMensaje } from "./medios.js";
import {
  hayHerramientas, pedidoDeHerramienta, ejecutar, resultadoParaElCerebro, MAX_VUELTAS,
} from "./herramientas.js";
import { responder, marcarLeida } from "./zernio.js";
import { avisarLead, avisarEscalacion } from "./avisos.js";
import {
  obtenerConversacion, estaPausada, pausar, guardarMensaje, historial,
  guardarLead, leadDeConversacion, registrarEvento, nombreUtil, leerAjustes,
  cargarAjustes, capacidadOn, ultimoMensajeCliente,
} from "./datos.js";

const MINUTOS_PAUSA = 60;   // el default; el panel puede cambiarlo sin redesplegar

// Buffer: cuánto espera el agente antes de contestar, por si la persona sigue
// escribiendo. La gente en WhatsApp manda "hola" / "oye" / "cuánto cuesta X" en
// tres mensajes seguidos: sin esto, el agente contesta tres veces y descoordinado.
// Ajustable desde el panel (Configuración → segundos_buffer). 0 lo apaga.
const SEGUNDOS_BUFFER = 20;

async function minutosPausa(env) {
  const ajustes = await leerAjustes(env);
  return Number(ajustes.minutos_pausa_escalacion) || MINUTOS_PAUSA;
}

/**
 * Atiende un mensaje entrante de punta a punta.
 * Devuelve un reporte de lo que pasó — lo usa la autoprueba como evidencia.
 */
export async function atender(env, { mensaje, conversacion: conv }) {
  const paso = { respondido: null, transcripcion: null, lead: null, escalacion: null,
                 avisoId: null, herramientas: null };

  const telefono = conv.participantId || mensaje.sender?.phoneNumber || "";
  // El nombre del perfil de WhatsApp: llega en el webhook y se guarda desde el
  // primer mensaje. Sirve para saludar por su nombre sin preguntarlo — pero NO
  // basta para dar por capturado al interesado: mucha gente tiene ahí un apodo,
  // un emoji o el nombre de su negocio. Por eso el lead sigue exigiendo que la
  // persona diga su nombre; este solo se usa como respaldo en el aviso.
  const nombreWa = nombrePerfilUtil(conv.participantName || mensaje.sender?.name);
  const registro = await obtenerConversacion(env, conv.id, telefono, nombreWa);

  const ajustes = await cargarAjustes(env);

  // 1. Oído y Vista: lo que sea que haya mandado, vuélvelo texto.
  //    (Salvo que el dueño los haya apagado desde el panel: entonces el agente
  //    lo dice de frente en vez de ignorar el mensaje.)
  const { texto, tipo } = await interpretarMensaje(env, mensaje, conv.id, {
    oido: capacidadOn(ajustes, "cap_oido"),
    vista: capacidadOn(ajustes, "cap_vista"),
  });
  if (tipo !== "texto") paso.transcripcion = texto;

  // 2. Guardar. Si ya estaba, es un reintento de Zernio: no contestar dos veces.
  const miId = await guardarMensaje(env, {
    conversacionId: conv.id, rol: "cliente", texto, tipo,
    platformMessageId: mensaje.platformMessageId || mensaje.id,
  });
  if (!miId) return { ...paso, omitido: "mensaje repetido (reintento)" };

  // 3. Si el dueño tomó el control, el agente se queda callado.
  if (estaPausada(registro)) {
    return { ...paso, omitido: "el dueño está atendiendo este chat" };
  }

  // 3.5. BUFFER. Espera un poco por si la persona sigue escribiendo, y al
  //      despertar comprueba quién quedó de último: si llegó otro mensaje, este
  //      turno se retira y contesta el más reciente — que ya ve TODO el hilo en
  //      su historial. Sin locks ni Durable Objects: el último gana.
  const espera = Math.max(0, Math.min(90, Number(ajustes.segundos_buffer ?? SEGUNDOS_BUFFER)));
  if (espera > 0 && typeof miId === "number") {
    await new Promise((r) => setTimeout(r, espera * 1000));
    const ultimo = await ultimoMensajeCliente(env, conv.id);
    if (ultimo && ultimo !== miId) {
      return { ...paso, omitido: `llegó otro mensaje durante el buffer (${espera}s); contesta ese` };
    }
    // Alguien pudo tomar el control mientras esperábamos.
    const alDespertar = await obtenerConversacion(env, conv.id, telefono, nombreWa);
    if (estaPausada(alDespertar)) {
      return { ...paso, omitido: "el dueño tomó el chat durante el buffer" };
    }
  }

  await marcarLeida(env, conv.id);

  // 4. Pensar con el historial. Si el agente tiene herramientas conectadas, aquí
  //    puede pedir una, ver el resultado y recién entonces contestar.
  const previos = await historial(env, conv.id);
  const { crudo, herramientas } = await razonar(env, previos, {
    conversacionId: conv.id, usuario: telefono, nombrePerfil: nombreWa,
  });
  if (herramientas.length) paso.herramientas = herramientas;

  const { visible, datos } = separarDatos(crudo);

  const salida = visible || "Perdón, ¿me lo puedes repetir?";

  // 5. Contestarle al cliente ANTES de los avisos: la persona no espera por nosotros.
  const messageId = await responder(env, conv.id, salida);
  paso.respondido = salida;
  await guardarMensaje(env, {
    conversacionId: conv.id, rol: "agente", texto: salida,
    tipo: "texto", platformMessageId: messageId,
  });

  // 6. Captura y aviso. Si esto truena, el cliente ya quedó atendido igual.
  if (datos?.tipo === "lead") {
    paso.lead = await capturarLead(env, {
      conversacionId: conv.id, telefono,
      nombre: datos.nombre || nombreWa, interes: datos.interes, ultimoMensaje: texto,
    });
    paso.avisoId = paso.lead?.avisoId || null;
  } else if (datos?.tipo === "humano") {
    paso.escalacion = await escalar(env, {
      conversacionId: conv.id, telefono,
      nombre: datos.nombre || nombreWa, motivo: datos.motivo, ultimoMensaje: texto,
    });
    paso.avisoId = paso.escalacion?.avisoId || null;
  }

  return paso;
}

/** 🔔 Registra al interesado y avisa. Un aviso por conversación, no spam. */
async function capturarLead(env, { conversacionId, telefono, nombre, interes, ultimoMensaje }) {
  const previo = await leadDeConversacion(env, conversacionId);
  const nombreBueno = nombreUtil(nombre) || nombreUtil(previo?.nombre);

  // El modelo a veces manda el bloque antes de saber el nombre ("desconocido").
  // Guardamos el interés, pero no gastamos un aviso en un lead sin nombre:
  // en cuanto la persona lo diga, el siguiente turno dispara el aviso completo.
  if (!nombreBueno) {
    await guardarLead(env, { conversacionId, nombre: null, telefono, interes, escalado: 0 });
    return { telefono, interes, avisado: false, esperandoNombre: true };
  }

  let avisoId = previo?.aviso_id || null;
  let error = null;

  if (!avisoId) {
    try {
      avisoId = await avisarLead(env, { nombre: nombreBueno, telefono, interes, ultimoMensaje });
    } catch (e) {
      error = String(e.message || e);
      await registrarEvento(env, "error", `No se pudo avisar del lead: ${error}`);
    }
  }

  await guardarLead(env, {
    conversacionId, nombre: nombreBueno, telefono, interes, escalado: 0, avisoId,
  });
  await registrarEvento(env, "lead", { nombre: nombreBueno, telefono, interes, avisoId, error });

  return { nombre: nombreBueno, telefono, interes, avisoId, avisado: !!avisoId, error };
}

/** 🔴 Pide humano o está molesto: avisa y calla al agente en ese chat. */
async function escalar(env, { conversacionId, telefono, nombre, motivo, ultimoMensaje }) {
  const previo = await leadDeConversacion(env, conversacionId);
  // El nombre que ya dio la persona manda sobre el del perfil de WhatsApp.
  const nombreBueno = nombreUtil(previo?.nombre) || nombreUtil(nombre);

  const minutos = await minutosPausa(env);
  let avisoUrgenteId = null, error = null;
  try {
    avisoUrgenteId = await avisarEscalacion(env, {
      nombre: nombreBueno, telefono, motivo, ultimoMensaje,
      interes: previo?.interes, minutosPausa: minutos,
    });
  } catch (e) {
    error = String(e.message || e);
    await registrarEvento(env, "error", `No se pudo avisar de la escalación: ${error}`);
  }

  await pausar(env, conversacionId, minutos);
  // Ojo: NO se toca 'interes'. Que pida un humano no borra lo que quería comprar.
  await guardarLead(env, {
    conversacionId, nombre: nombreBueno, telefono, motivo, escalado: 1, avisoUrgenteId,
  });
  await registrarEvento(env, "escalacion", { nombre: nombreBueno, telefono, motivo, avisoUrgenteId, error });

  return {
    nombre: nombreBueno, telefono, motivo, avisoId: avisoUrgenteId,
    avisado: !!avisoUrgenteId, pausadoMinutos: minutos, error,
  };
}

export { MINUTOS_PAUSA, negocio };

/**
 * Pensar, y si el agente pide una herramienta: ejecutarla, devolverle el resultado
 * y dejarlo contestar con eso. Es el comportamiento del agente en un solo lugar —
 * lo usan tanto las conversaciones reales como el probador del panel, para que
 * probar signifique de verdad lo que va a pasar.
 */
export async function razonar(env, mensajes, { conversacionId, usuario, nombrePerfil } = {}) {
  await cargarAjustes(env);
  let crudo = await pensar(env, mensajes, { conversacionId, nombrePerfil });
  const herramientas = [];
  if (!hayHerramientas(env)) return { crudo, herramientas };

  const interna = [...mensajes];
  for (let vuelta = 0; vuelta < MAX_VUELTAS; vuelta++) {
    const pedido = pedidoDeHerramienta(crudo);
    if (!pedido) break;

    const resultado = await ejecutar(env, pedido, usuario);
    await registrarEvento(env, "herramienta", {
      id: pedido.id, ok: resultado.ok, error: resultado.error,
    });
    herramientas.push({ id: pedido.id, ok: resultado.ok, error: resultado.error });

    interna.push({ role: "assistant", content: crudo });
    interna.push(resultadoParaElCerebro(pedido.id, resultado));
    crudo = await pensar(env, interna, { conversacionId, nombrePerfil });
  }

  // Si tras las vueltas permitidas sigue pidiendo herramientas, se corta: el
  // cliente lleva demasiado esperando y prefiere una respuesta honesta.
  if (pedidoDeHerramienta(crudo)) {
    await registrarEvento(env, "error", "El cerebro se quedó pidiendo herramientas en ciclo");
    crudo = "Déjame confirmarlo con el equipo y te digo en un momento. ¿Me pasas tu nombre?";
    return { crudo, herramientas };
  }

  // ── Guarda contra la promesa fantasma ────────────────────────────────────
  // Visto en vivo: el agente consultó los horarios libres y contestó "te dejo
  // agendada la cita" SIN haber llamado la herramienta que agenda. El cliente se
  // presenta y no hay nada. Pedirle en el prompt que no lo haga no alcanza —
  // esto se comprueba en código, contra lo que de verdad se ejecutó.
  if (prometeSinRespaldo(crudo, herramientas)) {
    await registrarEvento(env, "error", "Prometió una acción que no ejecutó; se le pidió corregir");
    const correccion = [
      ...interna,
      { role: "assistant", content: crudo },
      {
        role: "user",
        content: "[AVISO DEL SISTEMA] Escribiste que la acción quedó hecha, pero NO usaste " +
          "la herramienta que la hace. Solo consultar no es hacer. Si de verdad puedes " +
          "hacerla, pide AHORA la herramienta correcta. Si te falta algún dato, pídeselo " +
          "al cliente. Si no puedes, dile que el equipo se lo confirma — pero nunca " +
          "afirmes que ya quedó.",
      },
    ];
    crudo = await pensar(env, correccion, { conversacionId, nombrePerfil });

    const pedido = pedidoDeHerramienta(crudo);
    if (pedido) {
      const resultado = await ejecutar(env, pedido, usuario);
      await registrarEvento(env, "herramienta", {
        id: pedido.id, ok: resultado.ok, error: resultado.error,
      });
      herramientas.push({ id: pedido.id, ok: resultado.ok, error: resultado.error });
      correccion.push({ role: "assistant", content: crudo });
      correccion.push(resultadoParaElCerebro(pedido.id, resultado));
      crudo = await pensar(env, correccion, { conversacionId, nombrePerfil });
    }
    // Segunda red: si aun así insiste en prometer, se cambia por algo honesto.
    if (prometeSinRespaldo(crudo, herramientas)) {
      crudo = "Déjame confirmarlo con el equipo y en un momento te aviso. ¿Me dejas tu nombre?";
    }
  }
  return { crudo, herramientas };
}

// Verbos con los que el agente afirma que YA hizo algo. Consultar no cuenta:
// "revisé si hay lugar" es cierto; "te lo aparté" solo es cierto si lo apartó.
const PROMESAS = /\b(agendad[oa]|agend[ée]|apartad[oa]|apart[ée]|reservad[oa]|reserv[ée]|confirmad[oa]|confirm[ée]|registrad[oa]|registr[ée]|list[oa],? (?:tu|su) (?:cita|lugar|reservaci[óo]n)|qued[óo] (?:agendad|apartad|reservad))/i;

/** Dijo que lo hizo, pero ninguna herramienta lo respalda. */
function prometeSinRespaldo(texto, herramientas) {
  if (!PROMESAS.test(String(texto || ""))) return false;
  return !herramientas.some((h) => h.ok);
}

/**
 * El nombre del perfil de WhatsApp, si sirve de algo.
 * Descarta lo que claramente no es un nombre: números, emojis solos, cadenas
 * larguísimas, o el propio teléfono. Mejor no saludar por nombre que saludar mal.
 */
function nombrePerfilUtil(crudo) {
  const n = String(crudo || "").trim();
  if (!n || n.length > 40) return null;
  if (/^\+?[\d\s()-]+$/.test(n)) return null;         // es un teléfono
  if (!/\p{L}{2,}/u.test(n)) return null;              // sin letras: emojis o símbolos
  return n;
}
