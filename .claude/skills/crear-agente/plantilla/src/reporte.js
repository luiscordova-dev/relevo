// 📊 Reporte diario por correo. Opcional: si no hay a dónde mandarlo, no pasa nada.
//
// Dos vías, en orden:
//   1. Gmail por Composio  — sin dominio ni tarjeta; llega desde tu propio correo
//   2. Resend              — alternativa si prefieres un remitente del negocio
// La primera que esté configurada gana.

import { negocio } from "../negocio.js";
import { resumenDelDia, registrarEvento, recordatoriosVencidos, ponerRecordatorio } from "./datos.js";
import { avisarTexto } from "./avisos.js";
import { composioListo, ejecutarComposio } from "./composio.js";

/**
 * Recordatorios vencidos → aviso por Telegram, y se limpian para no repetirse.
 * Corre en cada tick del cron.
 */
export async function dispararRecordatorios(env) {
  const pendientes = await recordatoriosVencidos(env);
  let enviados = 0;
  for (const c of pendientes) {
    const quien = c.lead_nombre || c.nombre_contacto || c.telefono;
    try {
      await avisarTexto(env,
        `⏰ <b>RECORDATORIO</b>\n\nMe pediste que te recordara este chat.\n\n` +
        `👤 <b>${String(quien).replace(/[<>&]/g, "")}</b>\n` +
        (c.interes ? `💬 ${String(c.interes).replace(/[<>&]/g, "")}\n` : "") +
        `\nhttps://wa.me/${String(c.telefono).replace(/\D/g, "")}`);
      enviados++;
    } catch (e) {
      await registrarEvento(env, "error", `Recordatorio no enviado: ${e.message || e}`);
    }
    await ponerRecordatorio(env, c.id, null);
  }
  return enviados;
}

/** Por dónde se va a mandar el reporte. Lo usa el panel para decir la verdad. */
export function viaDelReporte(env) {
  if (!env.CORREO_DUENO) return { via: null, motivo: "Falta CORREO_DUENO" };
  if (composioListo(env)) return { via: "gmail", motivo: "Gmail por Composio" };
  if (env.RESEND_API_KEY) return { via: "resend", motivo: "Resend" };
  return { via: null, motivo: "Falta conectar Gmail (Composio) o poner RESEND_API_KEY" };
}

export async function enviarReporteDiario(env) {
  const { via, motivo } = viaDelReporte(env);
  if (!via) return { enviado: false, motivo: `Reporte por correo no configurado (es opcional). ${motivo}` };

  const desde = Date.now() - 24 * 60 * 60 * 1000;
  const r = await resumenDelDia(env, desde);
  const asunto = `${negocio.nombreNegocio}: ${r.leads} interesado(s) hoy`;
  const html = armarHTML(env, r);

  const res = via === "gmail"
    ? await porGmail(env, asunto, html)
    : await porResend(env, asunto, html);

  if (!res.enviado) {
    await registrarEvento(env, "error", `Reporte por correo falló (${via}): ${String(res.motivo).slice(0, 200)}`);
    return { ...res, via };
  }
  await registrarEvento(env, "reporte", `Reporte enviado a ${env.CORREO_DUENO} por ${via} (id ${res.id})`);
  return { ...res, via, resumen: r };
}

/** Gmail por Composio: sale de tu propia cuenta, sin dominio ni tarjeta. */
async function porGmail(env, asunto, html) {
  const r = await ejecutarComposio(env, "GMAIL_SEND_EMAIL", {
    recipient_email: env.CORREO_DUENO,
    subject: asunto,
    body: html,
    is_html: true,
  });
  if (!r.ok) return { enviado: false, motivo: r.error };
  // El id del mensaje es la evidencia de que salió. Sin id, no salió.
  const id = r.data?.id || r.data?.messageId || r.data?.message_id;
  if (!id) return { enviado: false, motivo: "Gmail respondió sin id de mensaje" };
  return { enviado: true, id };
}

/** Resend: la alternativa, si prefieres un remitente con tu dominio. */
async function porResend(env, asunto, html) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: env.CORREO_REMITENTE || "onboarding@resend.dev",
      to: [env.CORREO_DUENO],
      subject: asunto,
      html,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.id) return { enviado: false, motivo: data?.message || `HTTP ${res.status}` };
  return { enviado: true, id: data.id };
}

function armarHTML(env, r) {
  const fecha = new Date().toLocaleDateString("es-MX", {
    timeZone: env.ZONA_HORARIA || "America/Mexico_City",
    weekday: "long", day: "numeric", month: "long",
  });

  const filasLeads = r.nuevos.length
    ? r.nuevos.map((l) => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #eee">${escapar(l.nombre || "Sin nombre")}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee">${escapar(l.interes || "—")}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #eee">
            <a href="https://wa.me/${String(l.telefono).replace(/\D/g, "")}">Escribirle</a>
          </td>
        </tr>`).join("")
    : `<tr><td colspan="3" style="padding:14px 12px;color:#888">Hoy no cayó ningún interesado nuevo.</td></tr>`;

  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;color:#1a1a1a">
    <h2 style="margin:0 0 4px">Tu día en ${escapar(negocio.nombreNegocio)}</h2>
    <p style="margin:0 0 20px;color:#777;text-transform:capitalize">${fecha}</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      <tr>
        ${tarjeta("💬", r.conversaciones, "personas escribieron")}
        ${tarjeta("🔔", r.leads, "interesados nuevos")}
        ${tarjeta("🔴", r.escalaciones, "te necesitaron")}
      </tr>
    </table>
    <h3 style="margin:0 0 8px;font-size:15px">Interesados de hoy</h3>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${filasLeads}</table>
    ${r.errores ? `<p style="margin-top:20px;color:#b45309">⚠️ Hubo ${r.errores} error(es) técnicos hoy.</p>` : ""}
    <p style="margin-top:28px;color:#999;font-size:12px">Te lo manda tu agente de WhatsApp, cada noche.</p>
  </div>`;
}

const tarjeta = (icono, n, txt) => `
  <td style="padding:14px;background:#f6f7f9;border-radius:10px;text-align:center;width:33%">
    <div style="font-size:20px">${icono}</div>
    <div style="font-size:26px;font-weight:700">${n}</div>
    <div style="font-size:12px;color:#666">${txt}</div>
  </td><td style="width:8px"></td>`;

const escapar = (s) =>
  String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
