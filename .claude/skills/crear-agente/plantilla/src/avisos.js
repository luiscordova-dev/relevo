// Avisos al dueño por Telegram. Aquí es donde otros kits se quedan a medias:
// esto SÍ manda el mensaje y SÍ comprueba que llegó.

import { negocio } from "../negocio.js";
import { cargarAjustes, capacidadOn } from "./datos.js";

const esc = (s) =>
  String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);

function horaLocal(env) {
  return new Date().toLocaleString("es-MX", {
    timeZone: env.ZONA_HORARIA || "America/Mexico_City",
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

/**
 * Envía a Telegram y devuelve el message_id.
 * Devolver null significa "no llegó" — quien llama debe tratarlo como falla.
 */
async function enviarTelegram(env, html, botonUrl) {
  if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
    throw new Error("Falta configurar el aviso: TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID");
  }
  // El switch del panel (Configuración → Avisos por Telegram). Apagado: el
  // interesado se guarda igual en el panel — solo no suena el teléfono.
  if (!capacidadOn(await cargarAjustes(env), "cap_avisos")) {
    throw new Error("Los avisos están apagados desde el panel");
  }
  const cuerpo = {
    chat_id: env.TELEGRAM_CHAT_ID,
    text: html,
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };
  if (botonUrl) {
    cuerpo.reply_markup = {
      inline_keyboard: [[{ text: "💬 Contestarle por WhatsApp", url: botonUrl }]],
    };
  }
  const r = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
  const data = await r.json().catch(() => ({}));
  if (!data.ok) {
    throw new Error(`Telegram no aceptó el aviso: ${data.description || `HTTP ${r.status}`}`);
  }
  return String(data.result.message_id);
}

const linkWa = (tel) => `https://wa.me/${String(tel).replace(/\D/g, "")}`;

/** 🔔 Cayó un interesado. */
export async function avisarLead(env, { nombre, telefono, interes, ultimoMensaje }) {
  const html =
    `🔔 <b>NUEVO INTERESADO</b>\n\n` +
    `👤 <b>${esc(nombre || "Sin nombre")}</b>\n` +
    `📱 ${esc(telefono)}\n` +
    `💬 Quiere: ${esc(interes || "no lo especificó")}\n` +
    (ultimoMensaje ? `\n<i>Último mensaje: "${esc(ultimoMensaje.slice(0, 160))}"</i>\n` : "") +
    `\n<i>${esc(negocio.nombreNegocio)} · ${horaLocal(env)}</i>`;
  return enviarTelegram(env, html, linkWa(telefono));
}

/** 🔴 Pide un humano o está molesto. */
export async function avisarEscalacion(env, { nombre, telefono, motivo, ultimoMensaje, interes, minutosPausa }) {
  const html =
    `🔴 <b>TE NECESITAN</b>\n\n` +
    `👤 <b>${esc(nombre || "Sin nombre")}</b>\n` +
    `📱 ${esc(telefono)}\n` +
    `⚠️ ${esc(motivo || "Pidió hablar con una persona")}\n` +
    (interes ? `💬 Venía por: ${esc(interes)}\n` : "") +
    (ultimoMensaje ? `\n<i>Dijo: "${esc(ultimoMensaje.slice(0, 200))}"</i>\n` : "") +
    `\n🤖 El agente se calló en ese chat por ${minutosPausa} minutos para que tú contestes.\n` +
    `\n<i>${esc(negocio.nombreNegocio)} · ${horaLocal(env)}</i>`;
  return enviarTelegram(env, html, linkWa(telefono));
}

/** Aviso suelto (pruebas, errores). */
export async function avisarTexto(env, html) {
  return enviarTelegram(env, html);
}
