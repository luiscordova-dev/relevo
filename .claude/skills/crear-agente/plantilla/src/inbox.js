// La API del inbox: lo que el panel consulta y ejecuta.
// Todo pasa por la clave del dueño (lo valida index.js antes de llegar aquí).

import { responder } from "./zernio.js";
import {
  listarConversaciones, hiloCompleto, cambiarPausa, guardarMensaje,
  obtenerConversacion, registrarEvento, PAUSA_INDEFINIDA,
} from "./datos.js";

// Cuando el dueño contesta a mano, el agente se calla solo. Si nunca reactiva,
// vuelve al día siguiente en lugar de quedarse mudo para siempre.
const HORAS_PAUSA_AL_CONTESTAR = 8;

export async function apiInbox(request, env, url) {
  const ruta = url.pathname.replace("/api/", "");

  if (ruta === "conversaciones") {
    const lista = await listarConversaciones(env);
    return Response.json({
      ahora: Date.now(),
      pausaIndefinida: PAUSA_INDEFINIDA,
      conversaciones: lista,
    });
  }

  if (ruta === "hilo") {
    const hilo = await hiloCompleto(env, url.searchParams.get("id"));
    if (!hilo) return Response.json({ error: "No encontré esa conversación" }, { status: 404 });
    return Response.json({ ahora: Date.now(), pausaIndefinida: PAUSA_INDEFINIDA, ...hilo });
  }

  if (ruta === "responder" && request.method === "POST") {
    const { id, texto } = await request.json();
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

  if (ruta === "pausa" && request.method === "POST") {
    const { id, pausar } = await request.json();
    await obtenerConversacion(env, id, "", null); // asegura que exista
    const hasta = await cambiarPausa(env, id, !!pausar);
    return Response.json({ ok: true, pausadoHasta: hasta });
  }

  return Response.json({ error: "Ruta desconocida" }, { status: 404 });
}
