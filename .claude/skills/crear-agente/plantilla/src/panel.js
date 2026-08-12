// El panel del dueño: sus interesados, desde el celular, con un botón para escribirles.

import { negocio } from "../negocio.js";
import { listarLeads } from "./datos.js";

const esc = (s) =>
  String(s ?? "").replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" })[c]);

function cuando(ms, zona) {
  const dif = Date.now() - ms;
  if (dif < 60_000) return "hace un momento";
  if (dif < 3_600_000) return `hace ${Math.floor(dif / 60_000)} min`;
  if (dif < 86_400_000) return `hace ${Math.floor(dif / 3_600_000)} h`;
  return new Date(ms).toLocaleDateString("es-MX", { timeZone: zona, day: "numeric", month: "short" });
}

export async function renderPanel(env) {
  const leads = await listarLeads(env);
  const zona = env.ZONA_HORARIA || "America/Mexico_City";
  const hoy = leads.filter((l) => Date.now() - l.creado_en < 86_400_000).length;
  const sinAviso = leads.filter((l) => !l.aviso_id).length;

  const filas = leads.length
    ? leads.map((l) => `
      <article class="lead${l.escalado ? " urgente" : ""}">
        <div class="cab">
          <strong>${esc(l.nombre || "Sin nombre")}</strong>
          ${l.escalado ? '<span class="tag rojo">Te necesita</span>' : ""}
          ${!l.aviso_id ? '<span class="tag gris" title="El aviso no se pudo enviar">Sin aviso</span>' : ""}
          <span class="tiempo">${cuando(l.creado_en, zona)}</span>
        </div>
        <p class="interes">${esc(l.interes || "No especificó qué quiere")}</p>
        ${l.motivo ? `<p class="motivo">⚠️ ${esc(l.motivo)}</p>` : ""}
        <a class="wa" href="https://wa.me/${String(l.telefono).replace(/\D/g, "")}">
          💬 Escribirle a ${esc(l.telefono)}
        </a>
      </article>`).join("")
    : `<div class="vacio">
         <p>Todavía no hay interesados.</p>
         <p class="chico">Cuando alguien le escriba a tu WhatsApp y muestre interés, aparecerá aquí
         y te llegará un aviso a Telegram.</p>
       </div>`;

  return `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Interesados · ${esc(negocio.nombreNegocio)}</title>
<style>
  :root{--bg:#f4f5f7;--card:#fff;--txt:#16181d;--sec:#6b7280;--bor:#e6e8eb;--verde:#16a34a;--rojo:#dc2626}
  @media(prefers-color-scheme:dark){:root{--bg:#0f1115;--card:#181b21;--txt:#e9eaec;--sec:#9aa1ac;--bor:#272b33}}
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--txt);font:16px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;padding:16px}
  .wrap{max-width:640px;margin:0 auto}
  h1{font-size:20px;margin:0 0 2px}
  .sub{color:var(--sec);font-size:14px;margin:0 0 18px}
  .nums{display:flex;gap:10px;margin-bottom:18px}
  .num{flex:1;background:var(--card);border:1px solid var(--bor);border-radius:12px;padding:12px;text-align:center}
  .num b{display:block;font-size:24px}
  .num span{font-size:12px;color:var(--sec)}
  .lead{background:var(--card);border:1px solid var(--bor);border-radius:12px;padding:14px;margin-bottom:10px}
  .lead.urgente{border-color:var(--rojo);border-width:2px}
  .cab{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .tiempo{margin-left:auto;color:var(--sec);font-size:12px}
  .tag{font-size:11px;padding:2px 8px;border-radius:20px;font-weight:600}
  .tag.rojo{background:var(--rojo);color:#fff}
  .tag.gris{background:var(--bor);color:var(--sec)}
  .interes{margin:8px 0 12px;color:var(--sec)}
  .motivo{margin:-6px 0 12px;color:var(--rojo);font-size:14px}
  .wa{display:block;text-align:center;background:var(--verde);color:#fff;text-decoration:none;
      padding:11px;border-radius:9px;font-weight:600}
  .vacio{background:var(--card);border:1px dashed var(--bor);border-radius:12px;padding:32px 20px;text-align:center;color:var(--sec)}
  .chico{font-size:13px}
  footer{margin:24px 0 8px;text-align:center;color:var(--sec);font-size:12px}
</style></head><body><div class="wrap">
  <h1>${esc(negocio.nombreNegocio)}</h1>
  <p class="sub">Interesados que capturó ${esc(negocio.nombreAgente)}</p>
  <div class="nums">
    <div class="num"><b>${leads.length}</b><span>en total</span></div>
    <div class="num"><b>${hoy}</b><span>hoy</span></div>
    ${sinAviso ? `<div class="num"><b>${sinAviso}</b><span>sin aviso</span></div>` : ""}
  </div>
  ${filas}
  <footer>Se actualiza solo. Guarda esta página en tu pantalla de inicio.</footer>
</div></body></html>`;
}
