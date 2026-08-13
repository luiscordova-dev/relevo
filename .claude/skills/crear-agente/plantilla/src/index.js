// ─────────────────────────────────────────────────────────────────────────────
//  Tu agente de WhatsApp. Vive en Cloudflare, atiende 24/7.
//
//  Rutas:
//    POST /webhook/zernio  → aquí llegan los mensajes de tus clientes
//    GET  /panel?clave=…   → tus interesados
//    POST /prueba?clave=…  → autoprueba de punta a punta (con evidencia)
//    GET  /salud           → qué está configurado y qué falta
//  Cron: el reporte diario por correo
// ─────────────────────────────────────────────────────────────────────────────

import { atender } from "./agente.js";
import { renderPanel } from "./panel/index.js";
import { paginaLogin } from "./panel/login.js";
import { apiInbox } from "./inbox.js";
import { enviarReporteDiario, dispararRecordatorios, viaDelReporte } from "./reporte.js";
import { registrarEvento } from "./datos.js";
import { autoprueba } from "./autoprueba.js";
import { diagnosticar } from "./calidad.js";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    try {
      if (url.pathname === "/webhook/zernio" && request.method === "POST") {
        return await recibirWebhook(request, env, ctx);
      }

      if (url.pathname === "/panel") {
        // Dos puertas: la clave en la URL (como la comparte la skill) o la
        // sesión iniciada. Si entró con clave, se le siembra la cookie para
        // que la clave no tenga que vivir en la barra del navegador.
        if (claveOk(url, env)) {
          return new Response(renderPanel(), {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              ...(env.CLAVE_PANEL ? { "Set-Cookie": await cookieDeSesion(env) } : {}),
            },
          });
        }
        if (await sesionOk(request, env)) {
          return new Response(renderPanel(), {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        }
        return new Response(paginaLogin(), {
          status: 401, headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // Iniciar sesión: la clave del panel a cambio de una cookie firmada.
      if (url.pathname === "/api/login" && request.method === "POST") {
        const { clave, recordar } = await request.json().catch(() => ({}));
        if (!env.CLAVE_PANEL || !igualesConstante(String(clave || ""), env.CLAVE_PANEL)) {
          return Response.json({ ok: false, error: "Esa clave no es." }, { status: 401 });
        }
        return Response.json({ ok: true }, {
          headers: { "Set-Cookie": await cookieDeSesion(env, recordar !== false) },
        });
      }

      if (url.pathname === "/api/logout" && request.method === "POST") {
        return Response.json({ ok: true }, {
          headers: { "Set-Cookie": "rv_sesion=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax" },
        });
      }

      // API del panel: listar conversaciones, abrir un hilo, responder, pausar.
      if (url.pathname.startsWith("/api/")) {
        if (!claveOk(url, env) && !(await sesionOk(request, env))) {
          return Response.json({ error: "clave" }, { status: 401 });
        }
        return await apiInbox(request, env, url);
      }

      if (url.pathname === "/prueba" && request.method === "POST") {
        if (!claveOk(url, env)) return respuestaClave();
        return Response.json(await autoprueba(env), { status: 200 });
      }

      if (url.pathname === "/calidad" && request.method === "POST") {
        if (!claveOk(url, env)) return respuestaClave();
        return Response.json(await diagnosticar(env));
      }

      if (url.pathname === "/reporte" && request.method === "POST") {
        if (!claveOk(url, env)) return respuestaClave();
        return Response.json(await enviarReporteDiario(env));
      }

      if (url.pathname === "/salud") return Response.json(salud(env));

      return new Response("Tu agente está vivo. El panel está en /panel", { status: 200 });
    } catch (e) {
      await registrarEvento(env, "error", `${url.pathname}: ${e.message || e}`).catch(() => {});
      return Response.json({ error: String(e.message || e) }, { status: 500 });
    }
  },

  async scheduled(evento, env, ctx) {
    ctx.waitUntil((async () => {
      // Los recordatorios corren siempre; el reporte solo si lo configuraron.
      await dispararRecordatorios(env).catch((e) =>
        registrarEvento(env, "error", `Recordatorios: ${e.message || e}`));
      const esDeMadrugada = new Date().getUTCHours() === 9;
      if (esDeMadrugada) {
        await enviarReporteDiario(env).catch((e) =>
          registrarEvento(env, "error", `Reporte diario: ${e.message || e}`));
      }
    })());
  },
};

// ── Webhook ──────────────────────────────────────────────────────────────────

async function recibirWebhook(request, env, ctx) {
  const cuerpo = await request.text();

  if (env.ZERNIO_WEBHOOK_SECRET) {
    const firma = request.headers.get("X-Zernio-Signature") || "";
    if (!(await firmaValida(cuerpo, firma, env.ZERNIO_WEBHOOK_SECRET))) {
      return new Response("firma inválida", { status: 401 });
    }
  }

  let evento;
  try {
    evento = JSON.parse(cuerpo);
  } catch {
    return new Response("ok"); // no es nuestro problema; no pedir reintentos
  }

  const { message: mensaje, conversation: conversacion, account: cuenta } = evento;

  // Los webhooks de Zernio son POR CUENTA, no por número: llegan eventos de TODOS
  // los números y plataformas conectados. Sin este filtro, dos agentes de la misma
  // cuenta se contestan los mensajes entre ellos.
  const nuestro =
    evento.event === "message.received" &&
    mensaje?.direction === "incoming" &&
    conversacion?.id &&
    (!env.ZERNIO_ACCOUNT_ID || cuenta?.id === env.ZERNIO_ACCOUNT_ID);

  if (!nuestro) return new Response("ok");

  // Zernio exige 2xx en menos de 5 segundos o reintenta. Contestamos ya y
  // seguimos trabajando en segundo plano.
  ctx.waitUntil(
    atender(env, { mensaje, conversacion }).catch((e) =>
      registrarEvento(env, "error", `Atendiendo mensaje: ${e.message || e}`).catch(() => {})
    )
  );

  return new Response("ok");
}

/** HMAC-SHA256 hex del cuerpo crudo, comparado en tiempo constante. */
async function firmaValida(cuerpo, firmaHex, secreto) {
  try {
    const clave = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secreto),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const mac = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode(cuerpo));
    const esperado = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
    if (esperado.length !== firmaHex.length) return false;
    let dif = 0;
    for (let i = 0; i < esperado.length; i++) dif |= esperado.charCodeAt(i) ^ firmaHex.charCodeAt(i);
    return dif === 0;
  } catch {
    return false;
  }
}

// ── Utilidades ───────────────────────────────────────────────────────────────

const claveOk = (url, env) => !env.CLAVE_PANEL || url.searchParams.get("clave") === env.CLAVE_PANEL;

// ── Sesión del panel ─────────────────────────────────────────────────────────
// La cookie no lleva la clave: lleva un token derivado de ella con HMAC. Robar
// la cookie no revela la clave, y rotar la clave invalida todas las sesiones.

async function tokenDeSesion(env) {
  const clave = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(env.CLAVE_PANEL),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", clave, new TextEncoder().encode("sesion-del-panel-v1"));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function cookieDeSesion(env, recordar = true) {
  const token = await tokenDeSesion(env);
  // "Mantener sesión iniciada": 30 días. Sin marcar: la cookie muere al cerrar
  // el navegador (cookie de sesión, sin Max-Age).
  const duracion = recordar ? "; Max-Age=2592000" : "";
  return `rv_sesion=${token}; Path=/${duracion}; HttpOnly; Secure; SameSite=Lax`;
}

async function sesionOk(request, env) {
  if (!env.CLAVE_PANEL) return true;
  const cookies = request.headers.get("Cookie") || "";
  const m = /(?:^|;\s*)rv_sesion=([a-f0-9]{64})/.exec(cookies);
  if (!m) return false;
  return igualesConstante(m[1], await tokenDeSesion(env));
}

function igualesConstante(a, b) {
  if (a.length !== b.length) return false;
  let dif = 0;
  for (let i = 0; i < a.length; i++) dif |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return dif === 0;
}

const respuestaClave = () =>
  new Response("Necesitas tu clave. Agrega ?clave=TU_CLAVE al final de la dirección.", {
    status: 401, headers: { "Content-Type": "text/plain; charset=utf-8" },
  });

function salud(env) {
  const listo = (v) => (v ? "✅" : "❌");
  return {
    agente: "vivo",
    whatsapp: {
      llave: listo(env.ZERNIO_API_KEY),
      cuenta: listo(env.ZERNIO_ACCOUNT_ID),
      firmaWebhook: listo(env.ZERNIO_WEBHOOK_SECRET),
    },
    avisos: {
      telegram: listo(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),
    },
    cerebro: env.OPENAI_API_KEY ? "llave propia (OpenAI)"
      : env.ANTHROPIC_API_KEY ? "llave propia (Anthropic)"
      : `incluido (${env.MODELO_CEREBRO || "@cf/meta/llama-3.3-70b-instruct-fp8-fast"})`,
    opcionales: {
      herramientas: listo(env.COMPOSIO_API_KEY),
      reportePorCorreo: viaDelReporte(env).via || "apagado",
    },
  };
}
