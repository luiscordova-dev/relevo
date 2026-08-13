// La puerta del panel. Una clave, una cookie de sesión, y adentro.
// (La cookie es un token HMAC derivado de la clave — ver index.js del worker.)

import { negocio } from "../../negocio.js";

const esc = (s) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);

export function paginaLogin() {
  return `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#131628">
<title>${esc(negocio.nombreNegocio)} — entrar</title>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Poppins:wght@400;600;800&display=swap">
<style>
:root{
  --tinta:#131628; --morado:#6F00FF; --blanco:#fff; --hueso:#FAFAFA;
  --gris:#607179; --borde:rgba(19,22,40,.1);
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;
  font-family:Poppins,system-ui,sans-serif;background:var(--tinta);color:var(--blanco);
  background-image:radial-gradient(ellipse 80% 60% at 70% -10%,rgba(111,0,255,.28),transparent);
}
.caja{width:min(400px,100%)}
.marca{display:flex;align-items:center;gap:12px;margin-bottom:34px}
.marca .cuadro{width:46px;height:46px;border-radius:14px;background:var(--morado);
  display:grid;place-items:center;font-weight:800;font-size:20px;flex-shrink:0}
.marca b{display:block;font-size:16px;letter-spacing:-.2px}
.marca span{font-size:12px;color:rgba(255,255,255,.55)}
h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:34px;letter-spacing:-.5px;
  line-height:1.15;margin-bottom:8px}
.sub{font-size:13.5px;color:rgba(255,255,255,.6);line-height:1.6;margin-bottom:28px}
form{display:flex;flex-direction:column;gap:12px}
input{
  width:100%;padding:14px 16px;border-radius:14px;border:1px solid rgba(255,255,255,.16);
  background:rgba(255,255,255,.06);color:var(--blanco);font:inherit;font-size:15px;
  outline:none;transition:border-color .15s;letter-spacing:.06em}
input:focus{border-color:var(--morado)}
input::placeholder{color:rgba(255,255,255,.35);letter-spacing:0}
button{
  padding:14px 16px;border-radius:14px;border:0;background:var(--blanco);color:var(--tinta);
  font:inherit;font-size:14.5px;font-weight:600;cursor:pointer;transition:transform .12s,opacity .12s}
button:hover{transform:translateY(-1px)}
button:disabled{opacity:.6;transform:none;cursor:default}
.error{min-height:20px;font-size:12.5px;color:#ff9d9d}
.ayuda{margin-top:22px;font-size:12px;color:rgba(255,255,255,.45);line-height:1.6}
.ayuda code{background:rgba(255,255,255,.08);padding:2px 7px;border-radius:6px;font-size:11px}
.pie{margin-top:40px;font-size:11.5px;color:rgba(255,255,255,.4)}
.pie a{color:rgba(255,255,255,.65);text-decoration:none}
</style></head><body>
<div class="caja">
  <div class="marca">
    <div class="cuadro">${esc((negocio.nombreNegocio || "R")[0].toUpperCase())}</div>
    <div><b>${esc(negocio.nombreNegocio)}</b><span>${esc(negocio.nombreAgente)} · tu agente de WhatsApp</span></div>
  </div>
  <h1>Tu panel te espera.</h1>
  <p class="sub">Entra con la clave de tu panel. La sesión queda iniciada en este
  dispositivo — no la vas a teclear cada vez.</p>
  <form id="f">
    <input id="clave" type="password" placeholder="Tu clave" autocomplete="current-password" autofocus>
    <div class="error" id="error"></div>
    <button id="btn" type="submit">Entrar</button>
  </form>
  <p class="ayuda">¿No tienes la clave? Quien configuró el agente la tiene. Se puede
  rotar en cualquier momento con <code>wrangler secret put CLAVE_PANEL</code> — al
  rotarla, todas las sesiones se cierran solas.</p>
  <p class="pie">hecho con <a href="https://github.com/luiscordova-dev/relevo" target="_blank" rel="noopener">Relevo</a>
   · by <a href="https://instagram.com/luiscordova.ia" target="_blank" rel="noopener">Luis Córdova</a></p>
</div>
<script>
document.getElementById('f').onsubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn'), err = document.getElementById('error');
  btn.disabled = true; err.textContent = '';
  try {
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave: document.getElementById('clave').value.trim() }),
    });
    const d = await r.json().catch(() => ({}));
    if (d.ok) { location.replace('/panel'); return; }
    err.textContent = d.error || 'Esa clave no es.';
  } catch { err.textContent = 'No hubo conexión. Intenta de nuevo.'; }
  btn.disabled = false;
};
</script></body></html>`;
}
