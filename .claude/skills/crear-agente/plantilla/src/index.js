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
        if (!claveOk(url, env)) return respuestaClave();
        return new Response(renderPanel(), {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }

      // API del panel: listar conversaciones, abrir un hilo, responder, pausar.
      if (url.pathname.startsWith("/api/")) {
        if (!claveOk(url, env)) return Response.json({ error: "clave" }, { status: 401 });
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
