// La API del panel. Todo pasa por la clave del dueño (la valida index.js).

import { responder } from "./zernio.js";
import { negocio } from "../negocio.js";
import { viaDelReporte } from "./reporte.js";
import { separarDatos } from "./cerebro.js";
import { razonar } from "./agente.js";
import { composioListo } from "./composio.js";
import {
  listarConversaciones, hiloCompleto, cambiarPausa, guardarMensaje, cambiarCierre,
  ponerRecordatorio, guardarEtiquetas, etiquetasUsadas, obtenerConversacion,
  registrarEvento, PAUSA_INDEFINIDA, kpis, actividadPorDia, gasto, gastoPorDia,
  conteoEventos, leerAjustes, guardarAjuste, resumenDelDia,
  listarDocumentos, leerDocumento, guardarDocumento, marcarIndexado, borrarDocumento,
  capacidadOn,
} from "./datos.js";
import {
  ragDisponible, ragActivo, indexarDocumento, borrarDelIndice, infoEsGrande, buscarFragmentos,
  UMBRAL_BYTES, bytes,
} from "./conocimiento.js";

// Cuando el dueño contesta a mano, el agente se calla solo. Si nunca reactiva,
// vuelve al día siguiente en lugar de quedarse mudo para siempre.
// Ajustable desde el panel (Configuración → horas_pausa_al_contestar).
const HORAS_PAUSA_AL_CONTESTAR = 8;

// Claves de ajustes que el panel puede escribir. Lista cerrada a propósito.
const AJUSTES_PERMITIDOS = new Set([
  "horas_pausa_al_contestar",   // cuánto se calla el agente al contestar tú
  "minutos_pausa_escalacion",   // cuánto se calla al escalar
  "tope_mensual_neurons",       // presupuesto: al llegar, baja al modelo suplente
  "segundos_buffer",            // cuánto espera antes de contestar (agrupa mensajes seguidos)
  "zona_horaria",
  "moneda",
  // Los switches de Capacidades. Sin valor = encendida; "0" = apagada.
  "cap_oido", "cap_vista", "cap_herramientas", "cap_conocimiento",
  "cap_recordatorios", "cap_reporte", "cap_avisos",
]);

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
    const ajustes = await leerAjustes(env);
    const horas = Number(ajustes.horas_pausa_al_contestar) || HORAS_PAUSA_AL_CONTESTAR;
    const hasta = await cambiarPausa(env, id, true, horas * 60);
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

  // ── Las secciones nuevas del panel ──

  if (ruta === "resumen") {
    const [k, actividad, recientes] = await Promise.all([
      kpis(env), actividadPorDia(env, 7), listarConversaciones(env, { limite: 6 }),
    ]);
    return Response.json({ ...k, actividad, recientes, agente: negocio.nombreAgente });
  }

  if (ruta === "costos") {
    const mes0 = new Date(); mes0.setDate(1); mes0.setHours(0, 0, 0, 0);
    const [delMes, porDia, ajustes] = await Promise.all([
      gasto(env, mes0.getTime()), gastoPorDia(env, 30), leerAjustes(env),
    ]);
    const diasCorridos = Math.max(1, Math.ceil((Date.now() - mes0.getTime()) / 86_400_000));
    const diasDelMes = new Date(mes0.getFullYear(), mes0.getMonth() + 1, 0).getDate();
    return Response.json({
      ...delMes, porDia,
      proyeccionNeurons: (delMes.neurons / diasCorridos) * diasDelMes,
      topeNeurons: Number(ajustes.tope_mensual_neurons) || null,
      freeTierDiario: 10000,
    });
  }

  if (ruta === "flujo") {
    const ajustes = await leerAjustes(env);
    env.AJUSTES = ajustes;
    const [conteos, rag, docs] = await Promise.all([
      conteoEventos(env, 30), ragActivo(env),
      env.DB.prepare("SELECT COUNT(*) n, COALESCE(SUM(trozos),0) t FROM documentos")
        .first().catch(() => ({ n: 0, t: 0 })),
    ]);
    return Response.json({
      conteos,
      modelo: env.MODELO_CEREBRO || "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      cerebroPropio: env.OPENAI_API_KEY ? "openai" : env.ANTHROPIC_API_KEY ? "anthropic" : null,
      modeloOido: env.MODELO_OIDO || "@cf/openai/whisper-large-v3-turbo",
      modeloVista: env.MODELO_VISTA || "@cf/meta/llama-3.2-11b-vision-instruct",
      herramientas: (negocio.herramientas || []).map((h) => ({ id: h.id, tool: h.tool, para: h.para })),
      canales: { whatsapp: !!env.ZERNIO_ACCOUNT_ID, telegramAvisos: !!env.TELEGRAM_CHAT_ID },
      composio: composioListo(env),
      caps: {
        oido: capacidadOn(ajustes, "cap_oido"),
        vista: capacidadOn(ajustes, "cap_vista"),
        herramientas: capacidadOn(ajustes, "cap_herramientas"),
        conocimiento: capacidadOn(ajustes, "cap_conocimiento"),
        recordatorios: capacidadOn(ajustes, "cap_recordatorios"),
        reporte: capacidadOn(ajustes, "cap_reporte"),
        avisos: capacidadOn(ajustes, "cap_avisos"),
      },
      conocimiento: { activo: rag, documentos: docs?.n || 0, trozos: docs?.t || 0 },
      reporteCorreo: !!viaDelReporte(env).via,
      reporteVia: viaDelReporte(env).via,
      reporteMotivo: viaDelReporte(env).motivo,
      minutosPausa: Number(ajustes.minutos_pausa_escalacion) || 60,
      segundosBuffer: ajustes.segundos_buffer ?? 20,
      horasPausaContestar: Number(ajustes.horas_pausa_al_contestar) || HORAS_PAUSA_AL_CONTESTAR,
    });
  }

  // ── Conocimiento ──────────────────────────────────────────────────────────
  if (ruta === "conocimiento") {
    const [docs, activo] = await Promise.all([listarDocumentos(env), ragActivo(env)]);
    return Response.json({
      documentos: docs,
      disponible: ragDisponible(env),
      activo,
      infoBytes: bytes(negocio.informacion),
      umbral: UMBRAL_BYTES,
      infoGrande: infoEsGrande(),
    });
  }

  // Diagnóstico: qué fragmentos recupera el agente para una pregunta, con su
  // puntaje. Sin esto, "el RAG funciona" es una creencia. Lo usa /autopsia.
  if (ruta === "buscar") {
    const q = url.searchParams.get("q") || "";
    const fragmentos = await buscarFragmentos(env, q, Number(url.searchParams.get("k")) || 4);
    return Response.json({ pregunta: q, fragmentos });
  }

  // Probador: le habla al agente sin gastar un mensaje de WhatsApp, y enseña QUÉ
  // fragmentos usó para contestar. Sirve para comprobar un documento recién subido
  // sin tener que escribirle desde el celular.
  if (ruta === "probar" && request.method === "POST") {
    const { texto } = await leerJson(request);
    if (!String(texto || "").trim()) {
      return Response.json({ ok: false, error: "Escribe algo que preguntarle." }, { status: 400 });
    }
    const t0 = Date.now();
    const fragmentos = await buscarFragmentos(env, texto, 4);
    // Mismo camino que una conversación de verdad: si el agente pide una
    // herramienta, aquí se ejecuta igual. Un probador que se salta el loop
    // enseñaría algo que no va a pasar.
    const { crudo, herramientas } = await razonar(
      env, [{ role: "user", content: String(texto).slice(0, 1000) }], { usuario: "prueba" });
    const { visible, datos } = separarDatos(crudo);
    return Response.json({
      ok: true, respuesta: visible, datos, herramientas, ms: Date.now() - t0,
      fragmentos: fragmentos.map((f) => ({ titulo: f.titulo, score: f.score, texto: f.texto.slice(0, 300) })),
    });
  }

  if (ruta === "documento-leer") {
    const doc = await leerDocumento(env, Number(url.searchParams.get("id")));
    return Response.json(doc || {});
  }

  if (ruta === "documento" && request.method === "POST") {
    const { id, titulo, contenido, borrar } = await leerJson(request);

    if (borrar && id) {
      const previo = await leerDocumento(env, id);
      const limpieza = await borrarDelIndice(env, id, previo?.trozos);
      // Si el índice no soltó los fragmentos, el documento NO se borra de la base:
      // mejor que siga visible en el panel a que desaparezca de la vista y siga
      // contestando por detrás.
      if (!limpieza.ok) {
        return Response.json({ ok: false, error: `No se pudo quitar del índice: ${limpieza.error}` }, { status: 500 });
      }
      await borrarDocumento(env, id);
      return Response.json({ ok: true, borrado: id });
    }
    if (!String(titulo || "").trim() || !String(contenido || "").trim()) {
      return Response.json({ ok: false, error: "Falta el título o el contenido." }, { status: 400 });
    }

    const docId = await guardarDocumento(env, { id, titulo, contenido });
    // Guardar e indexar son dos cosas: si el índice falla, el texto NO se pierde
    // y el panel lo muestra como "sin indexar" en vez de mentir.
    const previo = id ? await leerDocumento(env, id) : null;
    const r = await indexarDocumento(env, { id: docId, titulo, contenido, trozos: previo?.trozos });
    if (r.ok) await marcarIndexado(env, docId, r.trozos);
    return Response.json({ ok: true, id: docId, indexado: r.ok, trozos: r.trozos || 0, error: r.error });
  }

  if (ruta === "reindexar" && request.method === "POST") {
    const docs = await listarDocumentos(env);
    const resultados = [];
    for (const d of docs) {
      const doc = await leerDocumento(env, d.id);
      const r = await indexarDocumento(env, doc);
      if (r.ok) await marcarIndexado(env, d.id, r.trozos);
      resultados.push({ id: d.id, titulo: d.titulo, ok: r.ok, trozos: r.trozos || 0, error: r.error });
    }
    return Response.json({ ok: true, resultados });
  }

  if (ruta === "ajustes") {
    if (request.method === "POST") {
      const cuerpo = await leerJson(request);
      const aplicados = {};
      for (const [k, v] of Object.entries(cuerpo || {})) {
        if (!AJUSTES_PERMITIDOS.has(k)) continue;
        await guardarAjuste(env, k, v);
        aplicados[k] = v;
      }
      return Response.json({ ok: true, aplicados });
    }
    return Response.json({
      ajustes: await leerAjustes(env),
      permitidos: [...AJUSTES_PERMITIDOS],
      // Lo que hoy es fijo del deploy, para mostrarlo en la pantalla:
      zonaHoraria: env.ZONA_HORARIA || "America/Mexico_City",
      negocio: { nombre: negocio.nombreNegocio, agente: negocio.nombreAgente, tono: negocio.tono },
    });
  }

  return Response.json({ error: "Ruta desconocida" }, { status: 404 });
}
