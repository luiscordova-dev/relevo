// 🔌 Composio — la puerta a 1,000+ apps (calendario, correo, CRM, Slack…).
//
// Todo lo que habla con Composio pasa por aquí: las herramientas del agente
// (herramientas.js) y el reporte diario por Gmail (reporte.js). Un solo lugar
// que arreglar cuando algo cambie.

import { leerAjustes, guardarAjuste } from "../datos.js";

const API = "https://backend.composio.dev/api/v3";

/** ¿Está conectado? Sin llave, el agente sigue funcionando: solo no HACE cosas. */
export const composioListo = (env) => !!env.COMPOSIO_API_KEY;

/**
 * El usuario dueño de las conexiones — y el detalle que cuesta horas.
 *
 * Composio usa `user_id` como FILTRO. Si mandas uno que no existe, la llamada no
 * falla con un error claro: simplemente NO encuentra ninguna cuenta conectada y
 * todas las herramientas se caen con "no connected account". Y el valor correcto
 * no es adivinable — en una cuenta real puede ser algo como
 * "pg-test-4f2a9c1e-…", no "default".
 *
 * Por eso se descubre solo: se pregunta a Composio bajo qué usuario viven las
 * conexiones activas y se guarda. Así conectar Composio es SOLO poner la llave.
 *
 * Las conexiones son del DUEÑO del negocio, nunca del cliente que escribe: aquí
 * jamás entra nada de la conversación.
 */
export async function usuarioComposio(env) {
  if (env.COMPOSIO_USER_ID) return env.COMPOSIO_USER_ID;

  const guardado = await leerAjustes(env).then((a) => a.composio_user_id).catch(() => null);
  if (guardado) return guardado;

  const descubierto = await descubrirUsuario(env);
  if (descubierto) await guardarAjuste(env, "composio_user_id", descubierto).catch(() => {});
  return descubierto || "default";
}

/** Pregunta a Composio bajo qué usuario están las cuentas conectadas. */
async function descubrirUsuario(env) {
  try {
    const r = await fetch(`${API}/connected_accounts`, {
      headers: { "x-api-key": env.COMPOSIO_API_KEY },
    });
    if (!r.ok) return null;
    const cuerpo = await r.json().catch(() => ({}));
    const lista = cuerpo?.items || cuerpo?.data || [];
    // La primera ACTIVE manda: una conexión caducada no sirve para trabajar.
    const activa = lista.find((c) => String(c.status).toUpperCase() === "ACTIVE");
    return activa?.user_id || lista[0]?.user_id || null;
  } catch {
    return null;
  }
}

/**
 * Ejecuta una herramienta de Composio. Nunca lanza: un fallo de una app externa
 * no puede tumbar la conversación.
 *
 * @returns {{ok: boolean, data?: any, error?: string}}
 */
export async function ejecutarComposio(env, slug, argumentos) {
  if (!composioListo(env)) {
    return { ok: false, error: "Composio no está conectado (falta COMPOSIO_API_KEY)." };
  }
  try {
    const r = await fetch(`${API}/tools/execute/${encodeURIComponent(slug)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": env.COMPOSIO_API_KEY },
      body: JSON.stringify({ arguments: argumentos || {}, user_id: await usuarioComposio(env) }),
    });
    const cuerpo = await r.json().catch(() => ({}));

    // Composio responde 200 con successful:false cuando la app externa falló.
    if (!r.ok || cuerpo?.error || cuerpo?.successful === false) {
      return { ok: false, error: mensajeDeError(cuerpo, r.status) };
    }
    // El payload útil viene en data, a veces anidado en response_data.
    return { ok: true, data: cuerpo?.data?.response_data ?? cuerpo?.data ?? cuerpo };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

/**
 * Las apps conectadas y su estado. Lo usa el panel para mostrar la verdad
 * (conectado / caducado) en vez de suponer que todo está bien.
 */
export async function conexionesComposio(env) {
  if (!composioListo(env)) return { ok: false, error: "Sin llave de Composio", cuentas: [] };
  try {
    const usuario = await usuarioComposio(env);
    const r = await fetch(`${API}/connected_accounts?user_ids=${encodeURIComponent(usuario)}`, {
      headers: { "x-api-key": env.COMPOSIO_API_KEY },
    });
    const cuerpo = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: mensajeDeError(cuerpo, r.status), cuentas: [] };

    const lista = cuerpo?.items || cuerpo?.data || [];
    return {
      ok: true,
      cuentas: lista.map((c) => ({
        app: c.toolkit?.slug || c.appName || c.toolkit_slug || "?",
        estado: c.status || "?",
        activa: String(c.status).toUpperCase() === "ACTIVE",
      })),
    };
  } catch (e) {
    return { ok: false, error: String(e.message || e), cuentas: [] };
  }
}

/** Traduce el error de Composio a algo que se pueda leer y arreglar. */
function mensajeDeError(cuerpo, status) {
  const crudo = cuerpo?.error?.message || cuerpo?.error || cuerpo?.message || `HTTP ${status}`;
  const texto = typeof crudo === "string" ? crudo : JSON.stringify(crudo).slice(0, 300);

  if (status === 401 || /api key|unauthor/i.test(texto)) {
    return `Llave de Composio inválida. Genera una en dashboard.composio.dev y guárdala con ` +
      `\`wrangler secret put COMPOSIO_API_KEY\`. (${texto})`;
  }
  if (/no connected account|not connected|connection not found/i.test(texto)) {
    return `No hay cuenta conectada para esa app con el usuario "${texto.includes("user") ? "configurado" : "default"}". ` +
      `Conéctala con \`composio link <app>\`, o revisa COMPOSIO_USER_ID. (${texto})`;
  }
  return texto;
}
