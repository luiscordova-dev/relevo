// La API del panel. Todo pasa por la clave del dueño (la valida index.js).

import { responder } from "./zernio.js";
import {
  listarConversaciones, hiloCompleto, cambiarPausa, guardarMensaje, cambiarCierre,
  ponerRecordatorio, guardarEtiquetas, etiquetasUsadas, obtenerConversacion,
  registrarEvento, PAUSA_INDEFINIDA,
} from "./datos.js";

// Cuando el dueño contesta a mano, el agente se calla solo. Si nunca reactiva,
// vuelve al día siguiente en lugar de quedarse mudo para siempre.
const HORAS_PAUSA_AL_CONTESTAR = 8;

const leerJson = async (request) => request.json().catch(() => ({}));

export async function apiInbox(request, env, url) {
  const ruta = url.pathname.replace("/api/", "");

  if (ruta === "conversaciones") {
    const [conversaciones, etiquetas] = await Promise.all([
      listarConversaciones(env, { orden: url.searchParams.get("orden") || "reciente" }),
      etiquetasUsadas(env),
    ]);
    return Response.json({
      ahora: Date.now(), pausaIndefinida: PAUSA_INDEFINIDA, etiquetas, conversaciones,
    });
  }

  if (ruta === "hilo") {
    const hilo = await hiloCompleto(env, url.searchParams.get("id"));
    if (!hilo) return Response.json({ error: "No encontré esa conversación" }, { status: 404 });
    return Response.json({ ahora: Date.now(), pausaIndefinida: PAUSA_INDEFINIDA, ...hilo });
  }

  if (ruta === "responder" && request.method === "POST") {
    const { id, texto } = await leerJson(request);
    if (!id || !String(texto || "").trim()) {
      return Response.json({ error: "Falta el mensaje" }, { status: 400 });
    }

    let messageId;
    try {
      messageId = await responder(env, id, texto);
    } catch (e) {
      await registrarEvento(env, "error", `El dueño no pudo responder: ${e.message || e}`);
      return Response.json({
        error: "No se pudo enviar por WhatsApp. Puede ser que hayan pasado más de 24 horas " +
               "desde su último mensaje: WhatsApp no deja escribir fuera de esa ventana.",
      }, { status: 502 });
    }

    await guardarMensaje(env, {
      conversacionId: id, rol: "dueño", texto, tipo: "texto", platformMessageId: messageId,
    });
    // Contestar a mano = tomar el control. El agente no te pisa.
    const hasta = await cambiarPausa(env, id, true, HORAS_PAUSA_AL_CONTESTAR * 60);
    await registrarEvento(env, "respuesta_dueno", { conversacionId: id, messageId });

    return Response.json({ ok: true, messageId, pausadoHasta: hasta });
  }

  // Nota privada: se guarda en el hilo pero NUNCA sale por WhatsApp.
  if (ruta === "nota" && request.method === "POST") {
    const { id, texto } = await leerJson(request);
    if (!id || !String(texto || "").trim()) {
      return Response.json({ error: "Falta la nota" }, { status: 400 });
    }
    await guardarMensaje(env, { conversacionId: id, rol: "nota", texto, tipo: "texto" });
    return Response.json({ ok: true });
  }

  if (ruta === "pausa" && request.method === "POST") {
    const { id, pausar } = await leerJson(request);
    await obtenerConversacion(env, id, "", null);
    const hasta = await cambiarPausa(env, id, !!pausar);
    return Response.json({ ok: true, pausadoHasta: hasta });
  }

  if (ruta === "cerrar" && request.method === "POST") {
    const { id, cerrada } = await leerJson(request);
    await cambiarCierre(env, id, !!cerrada);
    return Response.json({ ok: true, cerrada: !!cerrada });
  }

  if (ruta === "recordatorio" && request.method === "POST") {
    const { id, minutos } = await leerJson(request);
    const cuando = minutos ? Date.now() + Number(minutos) * 60_000 : null;
    await ponerRecordatorio(env, id, cuando);
    return Response.json({ ok: true, recordatorio: cuando });
  }

  if (ruta === "etiquetas" && request.method === "POST") {
    const { id, etiquetas } = await leerJson(request);
    const guardadas = await guardarEtiquetas(env, id, etiquetas);
    return Response.json({ ok: true, etiquetas: guardadas });
  }

  return Response.json({ error: "Ruta desconocida" }, { status: 404 });
}
