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
} from "./datos.js";

const MINUTOS_PAUSA = 60;   // el default; el panel puede cambiarlo sin redesplegar

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
  const nombreWa = conv.participantName || mensaje.sender?.name || null;
  const registro = await obtenerConversacion(env, conv.id, telefono, nombreWa);

  // 1. Oído y Vista: lo que sea que haya mandado, vuélvelo texto.
  const { texto, tipo } = await interpretarMensaje(env, mensaje, conv.id);
  if (tipo !== "texto") paso.transcripcion = texto;

  // 2. Guardar. Si ya estaba, es un reintento de Zernio: no contestar dos veces.
  const esNuevo = await guardarMensaje(env, {
    conversacionId: conv.id, rol: "cliente", texto, tipo,
    platformMessageId: mensaje.platformMessageId || mensaje.id,
  });
  if (!esNuevo) return { ...paso, omitido: "mensaje repetido (reintento)" };

  // 3. Si el dueño tomó el control, el agente se queda callado.
  if (estaPausada(registro)) {
    return { ...paso, omitido: "el dueño está atendiendo este chat" };
  }

  await marcarLeida(env, conv.id);

  // 4. Pensar con el historial. Si el agente tiene herramientas conectadas, aquí
  //    puede pedir una, ver el resultado y recién entonces contestar.
  const previos = await historial(env, conv.id);
  const { crudo, herramientas } = await razonar(env, previos, {
    conversacionId: conv.id, usuario: telefono,
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
export async function razonar(env, mensajes, { conversacionId, usuario } = {}) {
  let crudo = await pensar(env, mensajes, { conversacionId });
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
    crudo = await pensar(env, interna, { conversacionId });
  }

  // Si tras las vueltas permitidas sigue pidiendo herramientas, se corta: el
  // cliente lleva demasiado esperando y prefiere una respuesta honesta.
  if (pedidoDeHerramienta(crudo)) {
    await registrarEvento(env, "error", "El cerebro se quedó pidiendo herramientas en ciclo");
    crudo = "Déjame confirmarlo con el equipo y te digo en un momento. ¿Me pasas tu nombre?";
  }
  return { crudo, herramientas };
}
