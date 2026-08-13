// Composio: lo que convierte al agente en algo que HACE cosas, no solo contesta.
//
// El cerebro pide una herramienta con un bloque estructurado, el Worker la ejecuta
// contra Composio, le devuelve el resultado, y el cerebro escribe la respuesta final.
// Es un loop de agente de verdad — no una plantilla con huecos.

import { negocio } from "../negocio.js";

const API = "https://backend.composio.dev/api/v3";
const MARCA_INICIO = "<<<HERRAMIENTA>>>";
const MARCA_FIN = "<<<FIN>>>";

// Dos vueltas bastan (ej. buscar hueco → agendar). Más que eso casi siempre es
// que el modelo se atoró en un ciclo, y el cliente lleva demasiado esperando.
export const MAX_VUELTAS = 2;

export const hayHerramientas = (env) =>
  !!env.COMPOSIO_API_KEY && (negocio.herramientas || []).length > 0;

/** Lo que el cerebro necesita saber para pedirlas. Se inyecta en el prompt. */
export function bloqueDeHerramientas(env) {
  if (!hayHerramientas(env)) return "";
  const lista = negocio.herramientas
    .map((h) => `- ${h.id}: ${h.para}${h.datos ? ` — necesita: ${h.datos}` : ""}`)
    .join("\n");

  return `

## HERRAMIENTAS QUE PUEDES USAR
Puedes hacer cosas de verdad, no solo contestar. Estas están conectadas:
${lista}

Cuando necesites una, responde SOLO con esta línea y nada más:
${MARCA_INICIO}{"id":"ID_DE_LA_HERRAMIENTA","datos":{ … }}${MARCA_FIN}

Reglas:
- No le anuncies al cliente que vas a usar una herramienta: úsala y ya.
- Te voy a devolver el resultado y con eso escribes tu respuesta normal.
- Si el resultado viene con error, dile al cliente que hubo un problema y toma sus datos.
- Nunca inventes el resultado de una herramienta. Si no la usaste, no digas que sí.`;
}

/** Separa la petición de herramienta, si la hay. */
export function pedidoDeHerramienta(respuestaCruda) {
  const texto = String(respuestaCruda || "");
  const i = texto.indexOf(MARCA_INICIO);
  if (i === -1) return null;
  const j = texto.indexOf(MARCA_FIN, i);
  const crudo = texto.slice(i + MARCA_INICIO.length, j === -1 ? undefined : j).trim();
  try {
    const p = JSON.parse(crudo);
    return p?.id ? { id: p.id, datos: p.datos || {} } : null;
  } catch {
    const id = /"id"\s*:\s*"([\w.]+)"/.exec(crudo)?.[1];
    return id ? { id, datos: {} } : null;
  }
}

/**
 * Ejecuta la herramienta. Nunca lanza: un fallo de Composio no puede tumbar
 * la conversación — el cliente merece una respuesta igual.
 */
export async function ejecutar(env, { id, datos }, usuario) {
  const config = (negocio.herramientas || []).find((h) => h.id === id);
  if (!config) {
    return { ok: false, error: `El agente pidió "${id}", que no está en su lista de herramientas.` };
  }

  // Capacidades locales: tool "local:<nombre>" enruta a src/capacidades.js
  // (funciones propias del negocio, sin Composio). Las agrega /agregar-capacidad.
  if (String(config.tool).startsWith("local:")) {
    try {
      const { capacidades } = await import("./capacidades.js");
      const fn = capacidades?.[config.tool.slice(6)];
      if (!fn) return { ok: false, error: `No existe la capacidad "${config.tool}".` };
      return await fn(env, { ...(config.fijos || {}), ...datos }, usuario);
    } catch (e) {
      return { ok: false, error: String(e.message || e) };
    }
  }

  try {
    const r = await fetch(`${API}/tools/execute/${encodeURIComponent(config.tool)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": env.COMPOSIO_API_KEY },
      body: JSON.stringify({
        arguments: { ...(config.fijos || {}), ...datos },
        user_id: env.COMPOSIO_USER_ID || usuario || "dueno",
      }),
    });
    const cuerpo = await r.json().catch(() => ({}));

    if (!r.ok || cuerpo?.error) {
      const msg = cuerpo?.error?.message || cuerpo?.message || `HTTP ${r.status}`;
      return { ok: false, error: msg };
    }
    // Composio devuelve el payload útil en data (a veces anidado en response_data).
    const data = cuerpo?.data?.response_data ?? cuerpo?.data ?? cuerpo;
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

/** El resultado, en el formato que el cerebro entiende para su segunda vuelta. */
export function resultadoParaElCerebro(id, resultado) {
  const cuerpo = resultado.ok
    ? JSON.stringify(resultado.data).slice(0, 1800)
    : `ERROR: ${resultado.error}`;
  return {
    role: "user",
    content: `[RESULTADO DE LA HERRAMIENTA ${id}]\n${cuerpo}\n\n` +
      `Con esto escribe tu respuesta al cliente. No menciones la herramienta ni pegues este texto.`,
  };
}
