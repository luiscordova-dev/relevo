// La autoprueba. Comprueba, con pruebas en la mano, que el agente sirve.
// Regla de la casa: nada se da por hecho. Si el aviso no trae message_id, NO llegó.

import { pensar, separarDatos } from "./cerebro.js";
import { avisarLead, avisarEscalacion } from "./avisos.js";
import { AUDIO_PRUEBA_B64, IMAGEN_PRUEBA_B64, b64ABytes } from "./archivos-prueba.js";
import { guardarLead, leadDeConversacion, pausar, obtenerConversacion, registrarEvento } from "./datos.js";
import { negocio } from "../negocio.js";
import { diagnosticar } from "./calidad.js";

/** Un fallo que ya sabe cuál es su propio arreglo. Evita mandar al usuario al lugar equivocado. */
function fallo(mensaje, arregla) {
  const e = new Error(mensaje);
  e.arregla = arregla;
  return e;
}

const ARREGLO_CEREBRO =
  "No son los avisos: es el cerebro, que no está siguiendo las instrucciones. " +
  "El control de calidad de abajo dice con cuál cambiarlo.";

export async function autoprueba(env) {
  const pruebas = [];
  const convPrueba = `prueba-${Date.now()}`;
  const telPrueba = "+520000000000";

  /**
   * Corre una prueba. `reintentos` existe por dos razones reales:
   * justo después de publicar, Cloudflare tarda unos segundos en usar la versión
   * nueva; y los modelos de IA no son deterministas. Un solo tropiezo no debe
   * asustar al dueño con un error falso.
   */
  const correr = async (nombre, fn, arregloSiFalla, reintentos = 0) => {
    const t0 = Date.now();
    let ultimo;
    for (let intento = 0; intento <= reintentos; intento++) {
      if (intento > 0) await new Promise((r) => setTimeout(r, 2500));
      try {
        const { evidencia, ok = true, nota } = await fn();
        if (ok || intento === reintentos) {
          pruebas.push({
            nombre, ok, evidencia, nota, ms: Date.now() - t0,
            ...(ok && intento > 0 ? { nota: "Pasó al segundo intento" } : {}),
          });
          return ok;
        }
      } catch (e) {
        ultimo = e;
      }
    }
    pruebas.push({
      nombre, ok: false, ms: Date.now() - t0,
      problema: String(ultimo?.message || ultimo || "falló"),
      arregla: ultimo?.arregla || arregloSiFalla,
    });
    return false;
  };

  // 1 · ¿Contesta con la información del negocio?
  await correr("🧠 Contesta con tu información", async () => {
    const r = await pensar(env, [{ role: "user", content: "hola, ¿qué horario manejan?" }]);
    const { visible } = separarDatos(r);
    if (!visible || visible.length < 5) throw new Error("El cerebro devolvió una respuesta vacía");
    return { evidencia: visible.slice(0, 180) };
  }, "Revisa que la cuenta de Cloudflare tenga Workers AI disponible, o conecta tu propia llave de IA.");

  // 2 · ¿No inventa?
  await correr("🛡️ No inventa cosas", async () => {
    const r = await pensar(env, [{
      role: "user",
      content: "¿tienen paquete de 10 sesiones con 40% de descuento y transporte gratis?",
    }]);
    const { visible } = separarDatos(r);
    const invento = /\b(sí|si|claro|por supuesto)[, ].{0,40}(40|descuento|transporte)/i.test(visible);
    return {
      ok: !invento,
      evidencia: visible.slice(0, 180),
      nota: invento ? "Parece que confirmó algo que no existe. Revisa la información del negocio." : undefined,
    };
  }, "Sé más específico en negocio.js sobre lo que NO ofreces.");

  // 3 · Oído
  await correr("🎙️ Entiende notas de voz", async () => {
    const r = await env.AI.run(env.MODELO_OIDO || "@cf/openai/whisper-large-v3-turbo", {
      audio: AUDIO_PRUEBA_B64,
    });
    const texto = (r?.text || "").trim();
    if (!texto) throw new Error("La transcripción salió vacía");
    return { evidencia: `Escuchó: "${texto}"` };
  }, "Es un modelo incluido en Cloudflare; si falla, vuelve a intentar en un minuto.");

  // 4 · Vista
  await correr("👁️ Entiende fotos", async () => {
    const r = await env.AI.run(env.MODELO_VISTA || "@cf/meta/llama-3.2-11b-vision-instruct", {
      prompt: "Describe en español qué se ve en esta imagen, incluyendo cualquier texto o precio.",
      image: [...b64ABytes(IMAGEN_PRUEBA_B64)],
      max_tokens: 200,
    });
    const texto = (r?.response || r?.description || "").trim();
    if (!texto) throw new Error("No describió la imagen");
    return { evidencia: `Vio: "${texto.slice(0, 160)}"` };
  }, "El modelo de fotos pide aceptar una vez la licencia de Meta. Pídele a Claude que la acepte por ti.");

  // 5 · Captura + AVISO REAL (el corazón del kit)
  let avisoId = null;
  await correr("🔔 Captura al interesado y TE AVISA", async () => {
    const r = await pensar(env, [
      { role: "user", content: "hola, me interesa lo que ofrecen, ¿me pasas precios?" },
      { role: "assistant", content: "¡Hola! Claro que sí, con gusto. ¿Cómo te llamas?" },
      { role: "user", content: "soy Ana y quiero saber del servicio más popular que tengan" },
    ]);
    const { datos } = separarDatos(r);
    if (datos?.tipo !== "lead") {
      throw fallo("El agente no marcó a la persona como interesada aunque dio su nombre", ARREGLO_CEREBRO);
    }

    avisoId = await avisarLead(env, {
      nombre: `${datos.nombre || "Ana"} (PRUEBA)`,
      telefono: telPrueba,
      interes: datos.interes || "prueba del sistema",
      ultimoMensaje: "Este es el mensaje de prueba del kit — así se ve un interesado real.",
    });
    if (!avisoId) throw new Error("Telegram no confirmó el envío");

    await obtenerConversacion(env, convPrueba, telPrueba, "Prueba del kit");
    await guardarLead(env, {
      conversacionId: convPrueba, nombre: `${datos.nombre || "Ana"} (PRUEBA)`,
      telefono: telPrueba, interes: datos.interes || "prueba", escalado: 0, avisoId,
    });
    const guardado = await leadDeConversacion(env, convPrueba);
    if (!guardado?.aviso_id) throw new Error("El interesado no quedó guardado en la base");

    return { evidencia: `Aviso entregado a Telegram (id ${avisoId}) y guardado en tu panel` };
  }, "Revisa el token del bot y que le hayas dado /start a tu bot en Telegram.", 1);

  // 6 · Escalación + pausa
  await correr("🔴 Te pasa el chat cuando piden un humano", async () => {
    const r = await pensar(env, [{
      role: "user",
      content: "no me están resolviendo nada, quiero hablar con una persona ya",
    }]);
    const { datos } = separarDatos(r);
    if (datos?.tipo !== "humano") throw fallo("No detectó que la persona pedía un humano", ARREGLO_CEREBRO);

    const id = await avisarEscalacion(env, {
      nombre: "Cliente de PRUEBA", telefono: telPrueba,
      motivo: datos.motivo || "pidió hablar con una persona",
      ultimoMensaje: "Mensaje de prueba del kit.", minutosPausa: 60,
    });
    if (!id) throw new Error("Telegram no confirmó el aviso urgente");

    await pausar(env, convPrueba, 60);
    return { evidencia: `Aviso urgente entregado (id ${id}) y el agente se pausó en ese chat` };
  }, "Mismo arreglo que el aviso de interesados: revisa el bot de Telegram.", 1);

  // 7 · WhatsApp conectado (solo lectura: no le escribe a nadie)
  await correr("📱 WhatsApp conectado", async () => {
    if (!env.ZERNIO_API_KEY) throw new Error("Falta la llave de Zernio");
    const res = await fetch("https://zernio.com/api/v1/inbox/conversations?platform=whatsapp&limit=1", {
      headers: { Authorization: `Bearer ${env.ZERNIO_API_KEY}` },
    });
    if (!res.ok) throw new Error(`Zernio respondió ${res.status}`);
    return { evidencia: `Llave válida y número ${env.ZERNIO_ACCOUNT_ID ? "asignado" : "sin filtrar"}` };
  }, "Vuelve a generar la llave de Zernio y guárdala de nuevo.");

  // Limpieza: el lead de prueba no se queda en el panel del dueño.
  await env.DB.prepare("DELETE FROM leads WHERE conversacion_id = ?").bind(convPrueba).run().catch(() => {});
  await env.DB.prepare("DELETE FROM conversaciones WHERE id = ?").bind(convPrueba).run().catch(() => {});

  // 8 · Control de calidad del cerebro. Va al final porque es el más caro.
  //     Corre aunque otras pruebas hayan fallado: si falló la captura, ESTE es
  //     el que dice por qué y cómo arreglarlo.
  let calidad = null;
  const cerebroResponde = pruebas[0]?.ok;
  if (cerebroResponde) {
    try {
      calidad = await diagnosticar(env);
      pruebas.push({
        nombre: "🎯 Calidad de las respuestas",
        ok: calidad.aprobado,
        evidencia: calidad.aprobado ? calidad.mensaje : undefined,
        problema: calidad.aprobado ? undefined : calidad.mensaje,
        arregla: calidad.accion === "cambiar-modelo"
          ? `Cambiar MODELO_CEREBRO a "${calidad.modeloRecomendado}" y volver a publicar.`
          : calidad.accion === "revisar-informacion"
          ? "Completar la información del negocio en negocio.js y volver a probar."
          : "Conectar una llave propia de OpenAI o Anthropic.",
      });
    } catch (e) {
      pruebas.push({
        nombre: "🎯 Calidad de las respuestas", ok: false,
        problema: `No se pudo correr el control de calidad: ${e.message || e}`,
        arregla: "Vuelve a intentarlo en un minuto.",
      });
    }
  }

  const listo = pruebas.every((p) => p.ok);
  await registrarEvento(env, "prueba", { listo, fallaron: pruebas.filter((p) => !p.ok).map((p) => p.nombre) });

  return {
    listo,
    agente: `${negocio.nombreAgente} · ${negocio.nombreNegocio}`,
    pruebas,
    calidad,
    siguiente: listo
      ? "Todo funciona. Ahora escríbele tú al número desde tu WhatsApp y haz de cliente interesado."
      : "Arregla lo que salió en rojo y vuelve a correr la prueba.",
  };
}
