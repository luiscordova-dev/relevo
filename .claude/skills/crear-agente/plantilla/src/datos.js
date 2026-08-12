// Todo lo que se guarda. En D1, nunca en memoria: cada petición del Worker puede
// caer en una máquina distinta, así que la memoria no se comparte.

const ahora = () => Date.now();

export async function registrarEvento(env, tipo, detalle) {
  await env.DB.prepare("INSERT INTO eventos (tipo, detalle, creado_en) VALUES (?, ?, ?)")
    .bind(tipo, typeof detalle === "string" ? detalle : JSON.stringify(detalle ?? null), ahora())
    .run();
}

export async function obtenerConversacion(env, id, telefono, nombreContacto) {
  const t = ahora();
  await env.DB.prepare(
    `INSERT INTO conversaciones (id, telefono, nombre_contacto, creado_en, actualizado_en)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       actualizado_en = excluded.actualizado_en,
       nombre_contacto = COALESCE(conversaciones.nombre_contacto, excluded.nombre_contacto)`
  ).bind(id, telefono, nombreContacto || null, t, t).run();

  return env.DB.prepare("SELECT * FROM conversaciones WHERE id = ?").bind(id).first();
}

export function estaPausada(conversacion) {
  return !!conversacion?.pausado_hasta && conversacion.pausado_hasta > ahora();
}

export async function pausar(env, conversacionId, minutos) {
  await env.DB.prepare("UPDATE conversaciones SET pausado_hasta = ? WHERE id = ?")
    .bind(ahora() + minutos * 60_000, conversacionId).run();
}

/**
 * Guarda un mensaje. Devuelve false si ya existía (reintento de Zernio):
 * así el agente nunca contesta dos veces lo mismo.
 */
export async function guardarMensaje(env, { conversacionId, rol, texto, tipo, platformMessageId }) {
  try {
    const r = await env.DB.prepare(
      `INSERT INTO mensajes (conversacion_id, rol, texto, tipo, platform_message_id, creado_en)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(conversacionId, rol, texto, tipo || "texto", platformMessageId || null, ahora()).run();
    return r.success;
  } catch (e) {
    if (String(e).includes("UNIQUE")) return false; // ya lo habíamos procesado
    throw e;
  }
}

/** Historial reciente en el formato que espera el cerebro. */
export async function historial(env, conversacionId, limite = 12) {
  const { results } = await env.DB.prepare(
    `SELECT rol, texto FROM mensajes WHERE conversacion_id = ? ORDER BY id DESC LIMIT ?`
  ).bind(conversacionId, limite).all();
  return (results || []).reverse().map((m) => ({
    role: m.rol === "cliente" ? "user" : "assistant",
    content: m.texto,
  }));
}

export async function leadDeConversacion(env, conversacionId) {
  return env.DB.prepare("SELECT * FROM leads WHERE conversacion_id = ?").bind(conversacionId).first();
}

/**
 * Nombres que el modelo inventa cuando todavía no sabe cómo se llama la persona.
 * No sirven para avisar y no deben pisar un nombre real.
 */
const RELLENOS = ["desconocido", "sin nombre", "cliente", "n/a", "no especificado", "unknown"];

export const nombreUtil = (n) => {
  const limpio = String(n ?? "").trim();
  return limpio && !RELLENOS.includes(limpio.toLowerCase()) ? limpio : null;
};

/**
 * Crea o enriquece el lead. Regla: nunca pisar un dato bueno con uno peor.
 * Los aviso_id son la prueba de que se avisó — uno por tipo de aviso.
 */
export async function guardarLead(env, {
  conversacionId, nombre, telefono, interes, motivo, escalado, avisoId, avisoUrgenteId,
}) {
  const t = ahora();
  await env.DB.prepare(
    `INSERT INTO leads (conversacion_id, nombre, telefono, interes, motivo, escalado,
                        aviso_id, aviso_urgente_id, creado_en, actualizado_en)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(conversacion_id) DO UPDATE SET
       nombre           = COALESCE(excluded.nombre, leads.nombre),
       interes          = COALESCE(excluded.interes, leads.interes),
       motivo           = COALESCE(excluded.motivo, leads.motivo),
       escalado         = MAX(leads.escalado, excluded.escalado),
       aviso_id         = COALESCE(leads.aviso_id, excluded.aviso_id),
       aviso_urgente_id = COALESCE(excluded.aviso_urgente_id, leads.aviso_urgente_id),
       actualizado_en   = excluded.actualizado_en`
  ).bind(
    conversacionId, nombreUtil(nombre), telefono, interes || null, motivo || null,
    escalado ? 1 : 0, avisoId || null, avisoUrgenteId || null, t, t
  ).run();

  return leadDeConversacion(env, conversacionId);
}

/** Pausa "hasta que reactives" (año 2099). Distinta de la pausa por escalación. */
export const PAUSA_INDEFINIDA = 4070908800000;

/**
 * Lista para el inbox. El último mensaje ignora las notas privadas: son tuyas,
 * no parte de la conversación con el cliente.
 */
export async function listarConversaciones(env, { limite = 200, orden = "reciente" } = {}) {
  const dir = orden === "antiguo" ? "ASC" : "DESC";
  const { results } = await env.DB.prepare(`
    SELECT c.id, c.telefono, c.nombre_contacto, c.pausado_hasta, c.actualizado_en,
           c.cerrada, c.recordatorio, c.etiquetas,
           l.nombre AS lead_nombre, l.interes, l.escalado,
           (SELECT texto FROM mensajes m WHERE m.conversacion_id = c.id AND m.rol != 'nota'
             ORDER BY m.id DESC LIMIT 1) AS ultimo_texto,
           (SELECT rol FROM mensajes m WHERE m.conversacion_id = c.id AND m.rol != 'nota'
             ORDER BY m.id DESC LIMIT 1) AS ultimo_rol,
           (SELECT COUNT(*) FROM mensajes m WHERE m.conversacion_id = c.id) AS total_mensajes
      FROM conversaciones c
      LEFT JOIN leads l ON l.conversacion_id = c.id
     ORDER BY c.actualizado_en ${dir}
     LIMIT ?`).bind(limite).all();
  return results || [];
}

/** Cerrar o reabrir. Cerrar nunca borra: solo la saca de la bandeja del día. */
export async function cambiarCierre(env, conversacionId, cerrada) {
  await env.DB.prepare("UPDATE conversaciones SET cerrada = ? WHERE id = ?")
    .bind(cerrada ? 1 : 0, conversacionId).run();
}

/** Recordatorio: epoch ms, o null para quitarlo. */
export async function ponerRecordatorio(env, conversacionId, cuando) {
  await env.DB.prepare("UPDATE conversaciones SET recordatorio = ? WHERE id = ?")
    .bind(cuando || null, conversacionId).run();
}

export async function guardarEtiquetas(env, conversacionId, etiquetas) {
  const limpio = [...new Set((etiquetas || [])
    .map((e) => String(e).trim().slice(0, 24)).filter(Boolean))].slice(0, 8);
  await env.DB.prepare("UPDATE conversaciones SET etiquetas = ? WHERE id = ?")
    .bind(limpio.join(",") || null, conversacionId).run();
  return limpio;
}

/** Todas las etiquetas que el dueño ha usado, para sugerírselas. */
export async function etiquetasUsadas(env) {
  const { results } = await env.DB.prepare(
    "SELECT etiquetas FROM conversaciones WHERE etiquetas IS NOT NULL"
  ).all();
  const set = new Set();
  for (const r of results || []) String(r.etiquetas).split(",").forEach((e) => e && set.add(e));
  return [...set].sort();
}

/** Recordatorios que ya vencieron. Los usa el cron. */
export async function recordatoriosVencidos(env) {
  const { results } = await env.DB.prepare(`
    SELECT c.id, c.telefono, c.recordatorio, l.nombre AS lead_nombre, l.interes,
           c.nombre_contacto
      FROM conversaciones c LEFT JOIN leads l ON l.conversacion_id = c.id
     WHERE c.recordatorio IS NOT NULL AND c.recordatorio <= ?`).bind(ahora()).all();
  return results || [];
}

/** El hilo completo de una conversación. */
export async function hiloCompleto(env, conversacionId, limite = 300) {
  const cab = await env.DB.prepare(`
    SELECT c.*, l.nombre AS lead_nombre, l.interes, l.motivo, l.escalado, l.creado_en AS lead_desde
      FROM conversaciones c LEFT JOIN leads l ON l.conversacion_id = c.id
     WHERE c.id = ?`).bind(conversacionId).first();
  if (!cab) return null;
  const { results } = await env.DB.prepare(
    `SELECT rol, texto, tipo, creado_en FROM mensajes
      WHERE conversacion_id = ? ORDER BY id ASC LIMIT ?`
  ).bind(conversacionId, limite).all();
  return { ...cab, mensajes: results || [] };
}

/** Pausar hasta que reactiven, o reactivar ya. */
export async function cambiarPausa(env, conversacionId, pausar, minutos) {
  const hasta = pausar ? (minutos ? ahora() + minutos * 60_000 : PAUSA_INDEFINIDA) : null;
  await env.DB.prepare("UPDATE conversaciones SET pausado_hasta = ?, actualizado_en = ? WHERE id = ?")
    .bind(hasta, ahora(), conversacionId).run();
  return hasta;
}

export async function listarLeads(env, limite = 200) {
  const { results } = await env.DB.prepare(
    `SELECT * FROM leads ORDER BY actualizado_en DESC LIMIT ?`
  ).bind(limite).all();
  return results || [];
}

/** Números del día para el reporte nocturno. */
export async function resumenDelDia(env, desde) {
  const uno = async (sql, ...args) =>
    (await env.DB.prepare(sql).bind(...args).first())?.n ?? 0;

  return {
    conversaciones: await uno(
      "SELECT COUNT(DISTINCT conversacion_id) AS n FROM mensajes WHERE creado_en >= ? AND rol = 'cliente'", desde),
    mensajes: await uno("SELECT COUNT(*) AS n FROM mensajes WHERE creado_en >= ? AND rol = 'cliente'", desde),
    leads: await uno("SELECT COUNT(*) AS n FROM leads WHERE creado_en >= ?", desde),
    escalaciones: await uno("SELECT COUNT(*) AS n FROM eventos WHERE tipo = 'escalacion' AND creado_en >= ?", desde),
    errores: await uno("SELECT COUNT(*) AS n FROM eventos WHERE tipo = 'error' AND creado_en >= ?", desde),
    nuevos: (await env.DB.prepare(
      "SELECT nombre, telefono, interes FROM leads WHERE creado_en >= ? ORDER BY creado_en DESC LIMIT 10"
    ).bind(desde).all()).results || [],
  };
}
