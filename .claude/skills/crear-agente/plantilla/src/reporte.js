// 📊 Reporte diario por correo. Opcional: si no hay RESEND_API_KEY, no pasa nada.

import { negocio } from "../negocio.js";
import { resumenDelDia, registrarEvento } from "./datos.js";

export async function enviarReporteDiario(env) {
  if (!env.RESEND_API_KEY || !env.CORREO_DUENO) {
    return { enviado: false, motivo: "Reporte por correo no configurado (es opcional)" };
  }

  const desde = Date.now() - 24 * 60 * 60 * 1000;
  const r = await resumenDelDia(env, desde);

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

  const html = `
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

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.RESEND_API_KEY}` },
    body: JSON.stringify({
      from: env.CORREO_REMITENTE || "onboarding@resend.dev",
      to: [env.CORREO_DUENO],
      subject: `${negocio.nombreNegocio}: ${r.leads} interesado(s) hoy`,
      html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    await registrarEvento(env, "error", `Reporte por correo falló: ${JSON.stringify(data).slice(0, 200)}`);
    return { enviado: false, motivo: data?.message || `HTTP ${res.status}` };
  }
  await registrarEvento(env, "reporte", `Reporte enviado a ${env.CORREO_DUENO}`);
  return { enviado: true, id: data.id, resumen: r };
}

const tarjeta = (icono, n, txt) => `
  <td style="padding:14px;background:#f6f7f9;border-radius:10px;text-align:center;width:33%">
    <div style="font-size:20px">${icono}</div>
    <div style="font-size:26px;font-weight:700">${n}</div>
    <div style="font-size:12px;color:#666">${txt}</div>
  </td><td style="width:8px"></td>`;

const escapar = (s) =>
  String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
