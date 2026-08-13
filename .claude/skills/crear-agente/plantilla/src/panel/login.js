// La puerta del panel: split-screen — la marca a la izquierda, la entrada a la
// derecha. La clave se cambia por una cookie HMAC firmada (ver index.js).

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
  --gris:#607179; --borde:#E3E1EC;
}
*{box-sizing:border-box;margin:0;padding:0}
body{
  min-height:100vh;display:flex;align-items:center;justify-content:center;padding:22px;
  font-family:Poppins,system-ui,sans-serif;background:var(--tinta);
  background-image:radial-gradient(ellipse 70% 55% at 85% 110%,rgba(111,0,255,.30),transparent),
                   radial-gradient(ellipse 60% 50% at 10% -10%,rgba(111,0,255,.16),transparent)}
.caja{display:flex;width:min(880px,100%);min-height:520px;border-radius:22px;overflow:hidden;
  box-shadow:0 30px 80px rgba(0,0,0,.45)}

/* ── el panel de marca ── */
.lado{flex:1.08;background:linear-gradient(160deg,#191c33,#10121f);color:var(--blanco);
  padding:38px 40px;display:flex;flex-direction:column}
.marca{display:flex;align-items:center;gap:12px}
.marca .cuadro{width:44px;height:44px;border-radius:13px;background:var(--morado);
  display:grid;place-items:center;font-weight:800;font-size:19px;flex-shrink:0}
.marca b{display:block;font-size:15px;letter-spacing:-.2px}
.marca span{font-size:11.5px;color:rgba(255,255,255,.55)}
.lado h1{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:37px;line-height:1.14;
  letter-spacing:-.5px;margin:auto 0 14px}
.lado .sub{font-size:13px;color:rgba(255,255,255,.6);line-height:1.65;max-width:38ch}
.stats{display:flex;gap:26px;margin-top:30px}
.stat b{display:block;font-family:Fraunces,Georgia,serif;font-size:25px;font-weight:600}
.stat span{font-size:11px;color:rgba(255,255,255,.55)}
.seguro{margin-top:auto;padding-top:28px;font-size:11.5px;color:rgba(255,255,255,.5);
  display:flex;align-items:center;gap:7px;flex-wrap:wrap}
.seguro .atr a{color:rgba(255,255,255,.75);text-decoration:none;font-weight:600}

/* ── la entrada ── */
.entrada{flex:1;background:var(--blanco);color:var(--tinta);padding:44px 42px;
  display:flex;flex-direction:column;justify-content:center}
.entrada h2{font-family:Fraunces,Georgia,serif;font-weight:600;font-size:27px;letter-spacing:-.3px}
.entrada .hola{font-size:13px;color:var(--gris);margin:6px 0 26px}
label{display:block;font-size:12.5px;font-weight:600;margin-bottom:7px}
.campo{position:relative;margin-bottom:14px}
.campo input{width:100%;padding:13px 44px 13px 15px;border-radius:13px;border:1.5px solid var(--borde);
  background:var(--hueso);color:var(--tinta);font:inherit;font-size:14.5px;outline:none;
  letter-spacing:.05em;transition:border-color .14s}
.campo input:focus{border-color:var(--morado)}
.campo input::placeholder{letter-spacing:0;color:#A9A6B8}
.ojo{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:none;
  cursor:pointer;font-size:15px;padding:8px;color:var(--gris);border-radius:9px}
.ojo:hover{color:var(--tinta)}
.recordar{display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--gris);
  margin:2px 0 18px;cursor:pointer;user-select:none}
.recordar input{width:17px;height:17px;accent-color:var(--morado);cursor:pointer}
.error{min-height:19px;font-size:12px;color:#D93838;margin:-8px 0 6px}
.btn{width:100%;padding:14px;border-radius:13px;border:0;background:var(--morado);color:#fff;
  font:inherit;font-size:14.5px;font-weight:600;cursor:pointer;
  box-shadow:0 2px 4px rgba(111,0,255,.3),0 10px 24px -8px rgba(111,0,255,.55);
  transition:transform .12s,opacity .12s}
.btn:hover{transform:translateY(-1px)}
.btn:disabled{opacity:.6;transform:none;cursor:default}
.ayuda{margin-top:20px;font-size:11.5px;color:var(--gris);line-height:1.6}
.ayuda code{background:var(--hueso);border:1px solid var(--borde);padding:1px 6px;
  border-radius:6px;font-size:10.5px}

@media(max-width:760px){
  .caja{flex-direction:column;min-height:0}
  .lado{padding:26px 26px 22px}
  .lado h1{font-size:26px;margin:18px 0 10px}
  .stats{margin-top:18px;gap:20px}
  .seguro{display:none}
  .entrada{padding:28px 26px 32px}
}
</style></head><body>
<div class="caja">
  <div class="lado">
    <div class="marca">
      <div class="cuadro">${esc((negocio.nombreNegocio || "R")[0].toUpperCase())}</div>
      <div><b>${esc(negocio.nombreNegocio)}</b><span>${esc(negocio.nombreAgente)} · agente de WhatsApp</span></div>
    </div>
    <h1>Mientras no estás,<br>alguien sí contesta.</h1>
    <p class="sub">Tus conversaciones, interesados y costos en un solo lugar — con
    ${esc(negocio.nombreAgente)} atendiendo tu WhatsApp a toda hora.</p>
    <div class="stats">
      <div class="stat"><b>24/7</b><span>en turno</span></div>
      <div class="stat"><b>🔔</b><span>te avisa al momento</span></div>
      <div class="stat"><b>100%</b><span>tuyo, en tu nube</span></div>
    </div>
    <div class="seguro">🛡️ Conexión segura ·
      <span class="atr">hecho con <a href="https://github.com/luiscordova-dev/relevo" target="_blank" rel="noopener">Relevo</a>
      · by <a href="https://instagram.com/luiscordova.ia" target="_blank" rel="noopener">Luis Córdova</a></span></div>
  </div>

  <div class="entrada">
    <h2>Bienvenido de vuelta</h2>
    <p class="hola">Inicia sesión para entrar a tu panel.</p>
    <form id="f">
      <label for="clave">Clave del panel</label>
      <div class="campo">
        <input id="clave" type="password" placeholder="••••••••••••" autocomplete="current-password" autofocus>
        <button class="ojo" type="button" id="ojo" aria-label="Mostrar u ocultar la clave">👁️</button>
      </div>
      <label class="recordar"><input type="checkbox" id="recordar" checked>
        Mantener sesión iniciada</label>
      <div class="error" id="error"></div>
      <button class="btn" id="btn" type="submit">Iniciar sesión →</button>
    </form>
    <p class="ayuda">Tu clave te la entregó quien configuró tu agente, junto con el link
    de este panel. ¿La perdiste? Pídele que te genere una nueva — es un minuto.</p>
  </div>
</div>
<script>
document.getElementById('ojo').onclick = () => {
  const i = document.getElementById('clave');
  i.type = i.type === 'password' ? 'text' : 'password';
  i.focus();
};
document.getElementById('f').onsubmit = async (e) => {
  e.preventDefault();
  const btn = document.getElementById('btn'), err = document.getElementById('error');
  btn.disabled = true; err.textContent = '';
  try {
    const r = await fetch('/api/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clave: document.getElementById('clave').value.trim(),
        recordar: document.getElementById('recordar').checked,
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (d.ok) { location.replace('/panel'); return; }
    err.textContent = d.error || 'Esa clave no es.';
  } catch { err.textContent = 'No hubo conexión. Intenta de nuevo.'; }
  btn.disabled = false;
};
</script></body></html>`;
}
