// El panel del dueño: sus conversaciones y sus interesados, desde el celular.
// Una sola página, sin librerías ni compilación: la sirve el mismo Worker.

import { negocio } from "../negocio.js";
import { marca } from "../marca.js";

const CSS = `
/* Identidad de marca. Cámbiala en marca.js si quieres otros colores. */
:root{
  --tinta:#131628; --offwhite:#FAFAFA; --blanco:#FFFFFF;
  --morado:#6F00FF; --rojo:#F44336; --gris:#607179;
  --bg:var(--offwhite); --card:var(--blanco); --txt:var(--tinta); --sec:var(--gris);
  --bor:#E7E7EC; --suave:#F1F0F7; --morado-suave:#EFE6FF;
}
@media(prefers-color-scheme:dark){:root{
  --bg:#0C0E1A; --card:#181B2E; --txt:#F2F2F5; --sec:#98A0B0;
  --bor:#282C42; --suave:#20243A; --morado-suave:#2A1A52;
}}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
body{margin:0;background:var(--bg);color:var(--txt);
     font:400 15px/1.45 Poppins,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
header{background:var(--card);border-bottom:1px solid var(--bor);padding:14px 16px;
       position:sticky;top:0;z-index:5}
h1{font-size:19px;font-weight:800;letter-spacing:-.2px;margin:0}
.sub{color:var(--sec);font-size:12px;margin-top:2px}
.nums{display:flex;gap:16px;margin-top:12px;font-size:12px;color:var(--sec)}
.nums b{color:var(--txt);font-size:17px;font-weight:800;margin-right:4px}
.tabs{display:flex;gap:8px;margin-top:14px}
.tab{flex:1;padding:9px;border:1px solid var(--bor);background:transparent;color:var(--sec);
     border-radius:10px;font:600 13px Poppins,sans-serif;cursor:pointer}
.tab.on{background:var(--morado);color:#fff;border-color:var(--morado)}
main{max-width:1000px;margin:0 auto}
.fila{display:flex;gap:12px;align-items:flex-start;padding:13px 16px;background:var(--card);
      border-bottom:1px solid var(--bor);cursor:pointer}
.fila:active{background:var(--suave)}
.ini{width:42px;height:42px;border-radius:50%;background:var(--morado-suave);color:var(--morado);
     flex:none;display:flex;align-items:center;justify-content:center;font-weight:800}
.fila.esc .ini{background:var(--morado);color:#fff}
.cuerpo{flex:1;min-width:0}
.linea1{display:flex;align-items:baseline;gap:8px}
.nom{font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hora{margin-left:auto;color:var(--sec);font-size:11px;flex:none}
.prev{color:var(--sec);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.chips{display:flex;gap:5px;margin-top:6px;flex-wrap:wrap}
.chip{font:700 10px Poppins,sans-serif;padding:3px 8px;border-radius:20px;background:var(--suave);color:var(--sec)}
.chip.rojo{background:var(--rojo);color:#fff}
.chip.morado{background:var(--morado);color:#fff}
.vacio{padding:52px 24px;text-align:center;color:var(--sec)}
.vacio p{margin:6px 0}
.vacio b{color:var(--txt);font-weight:800}

/* Hilo */
#hilo{position:fixed;inset:0;background:var(--bg);display:none;flex-direction:column;z-index:10}
#hilo.abierto{display:flex}
.hcab{background:var(--card);border-bottom:1px solid var(--bor);padding:11px 12px;
      display:flex;align-items:center;gap:10px}
.volver{background:none;border:0;font-size:24px;color:var(--txt);cursor:pointer;padding:0 4px}
.hcab .cuerpo{flex:1;min-width:0}
.hcab .nom{font-size:15px}
.hcab .btn{flex:none}
.btn.solo-icono{font-size:15px;padding:8px 12px;line-height:1}
.btn{border:1px solid var(--bor);background:var(--card);color:var(--txt);border-radius:9px;
     padding:8px 11px;font:600 12px Poppins,sans-serif;cursor:pointer;white-space:nowrap;
     text-decoration:none;display:inline-block}
.btn.pausa{border-color:var(--morado);color:var(--morado)}
.btn.activo{background:var(--morado);color:#fff;border-color:var(--morado)}
.msgs{flex:1;overflow-y:auto;padding:16px 12px;display:flex;flex-direction:column;gap:8px}
.b{max-width:78%;padding:9px 12px;border-radius:14px;font-size:14px;white-space:pre-wrap;
   word-wrap:break-word}
.b .meta{display:block;font-size:10px;opacity:.65;margin-top:4px}
.b.cliente{align-self:flex-start;background:var(--card);border:1px solid var(--bor)}
.b.agente{align-self:flex-end;background:var(--suave)}
.b.dueño{align-self:flex-end;background:var(--morado);color:#fff}
.aviso{align-self:center;font-size:11px;color:var(--sec);background:var(--suave);
       padding:6px 14px;border-radius:20px;text-align:center;max-width:88%}
.comp{background:var(--card);border-top:1px solid var(--bor);padding:10px;display:flex;gap:8px;
      align-items:flex-end}
.comp textarea{flex:1;border:1px solid var(--bor);border-radius:22px;padding:11px 15px;resize:none;
      font:400 15px Poppins,sans-serif;background:var(--bg);color:var(--txt);max-height:110px}
.comp button{background:var(--morado);color:#fff;border:0;border-radius:50%;width:44px;height:44px;
      font-size:18px;cursor:pointer;flex:none}
.comp button:disabled{opacity:.4}
.error{background:var(--rojo);color:#fff;padding:10px 12px;font-size:13px;text-align:center}
#nada{display:none}
footer{padding:22px 16px 30px;text-align:center;color:var(--sec);font-size:12px}
footer a{color:var(--morado);text-decoration:none;font-weight:600}
@media(min-width:820px){
  #hilo{position:static;display:none}
  #hilo.abierto{display:flex;height:calc(100vh - 148px);border-left:1px solid var(--bor)}
  .split main{display:flex;max-width:1000px;margin:0 auto}
  .split #lista{flex:0 0 340px;border-right:1px solid var(--bor);overflow-y:auto;
                height:calc(100vh - 148px)}
  .split #hilo{flex:1}
  .split footer{display:none}
  .volver{display:none}
  #nada{display:flex;flex:1;align-items:center;justify-content:center;text-align:center;
        color:var(--sec);font-size:14px;height:calc(100vh - 148px);border-left:1px solid var(--bor)}
  .split #nada{display:none}
  main{display:flex}
  #lista{flex:0 0 340px;overflow-y:auto;height:calc(100vh - 148px);border-right:1px solid var(--bor)}
}`;

const JS = String.raw`
const CLAVE = new URLSearchParams(location.search).get('clave') || '';
const api = (r, o) => fetch('/api/' + r + (r.includes('?') ? '&' : '?') + 'clave=' + encodeURIComponent(CLAVE), o)
  .then(x => x.json());
let vista = 'conversaciones', abierta = null, datos = { conversaciones: [] }, enviando = false;

const esc = s => String(s == null ? '' : s).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
const ini = s => (String(s || '?').trim()[0] || '?').toUpperCase();
function cuando(ms) {
  const d = Date.now() - ms;
  if (d < 60000) return 'ahora';
  if (d < 3600000) return Math.floor(d / 60000) + ' min';
  if (d < 86400000) return Math.floor(d / 3600000) + ' h';
  return new Date(ms).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
const pausada = c => c.pausado_hasta && c.pausado_hasta > Date.now();
const nombreDe = c => c.lead_nombre || c.nombre_contacto || c.telefono || 'Sin nombre';

async function cargar() {
  datos = await api('conversaciones');
  pinta();
}

function pinta() {
  const cs = datos.conversaciones || [];
  const leads = cs.filter(c => c.lead_nombre || c.interes);
  document.getElementById('nConv').textContent = cs.length;
  document.getElementById('nLeads').textContent = leads.length;
  document.getElementById('nEsc').textContent = cs.filter(c => c.escalado).length;
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.v === vista));

  const items = vista === 'conversaciones' ? cs : leads;
  const lista = document.getElementById('lista');
  if (!items.length) {
    lista.innerHTML = '<div class="vacio"><p><b>Todavía no hay nada por aquí.</b></p>' +
      '<p>Cuando alguien le escriba a tu WhatsApp, la conversación aparece aquí y ' +
      'tú puedes tomar el control cuando quieras.</p></div>';
    return;
  }
  lista.innerHTML = items.map(c => {
    const chips = [];
    if (c.escalado) chips.push('<span class="chip rojo">Te necesita</span>');
    if (pausada(c)) chips.push('<span class="chip morado">Tú contestas</span>');
    if (c.interes) chips.push('<span class="chip">' + esc(c.interes.slice(0, 34)) + '</span>');
    const quien = c.ultimo_rol === 'cliente' ? '' : (c.ultimo_rol === 'dueño' ? 'Tú: ' : 'Agente: ');
    return '<div class="fila' + (c.escalado ? ' esc' : '') + '" onclick="abrir(\'' + c.id + '\')">' +
      '<div class="ini">' + esc(ini(nombreDe(c))) + '</div><div class="cuerpo">' +
      '<div class="linea1"><span class="nom">' + esc(nombreDe(c)) + '</span>' +
      '<span class="hora">' + cuando(c.actualizado_en) + '</span></div>' +
      '<div class="prev">' + esc(quien + (c.ultimo_texto || '').slice(0, 90)) + '</div>' +
      (chips.length ? '<div class="chips">' + chips.join('') + '</div>' : '') +
      '</div></div>';
  }).join('');
}

async function abrir(id) {
  abierta = id;
  document.getElementById('hilo').classList.add('abierto');
  document.body.classList.add('split');
  document.getElementById('msgs').innerHTML = '<div class="aviso">Cargando…</div>';
  await refrescarHilo();
}

async function refrescarHilo() {
  if (!abierta) return;
  const h = await api('hilo?id=' + encodeURIComponent(abierta));
  if (h.error) return;
  const enPausa = h.pausado_hasta && h.pausado_hasta > Date.now();
  document.getElementById('hNom').textContent = h.lead_nombre || h.nombre_contacto || h.telefono;
  document.getElementById('hSub').textContent =
    (h.interes ? h.interes + ' · ' : '') + h.telefono;
  const bp = document.getElementById('btnPausa');
  bp.textContent = enPausa ? '▶ Reactivar' : '⏸ Contesto yo';
  bp.classList.toggle('activo', enPausa);
  document.getElementById('btnWa').href = 'https://wa.me/' + String(h.telefono).replace(/\D/g, '');

  const cont = document.getElementById('msgs');
  cont.innerHTML = (h.mensajes || []).map(m => {
    const et = m.rol === 'cliente' ? '' : (m.rol === 'dueño' ? 'Tú' : 'Agente');
    const ic = m.tipo === 'audio' ? '🎙️ ' : (m.tipo === 'imagen' ? '📷 ' : '');
    return '<div class="b ' + m.rol + '">' + ic + esc(m.texto) +
      '<span class="meta">' + (et ? et + ' · ' : '') + cuando(m.creado_en) + '</span></div>';
  }).join('') + (enPausa
    ? '<div class="aviso">⏸ El agente está callado en este chat. Tú contestas.</div>'
    : '');
  cont.scrollTop = cont.scrollHeight;
}

function cerrar() {
  abierta = null;
  document.getElementById('hilo').classList.remove('abierto');
  document.body.classList.remove('split');
  cargar();
}

async function alternarPausa() {
  const bp = document.getElementById('btnPausa');
  const pausar = !bp.classList.contains('activo');
  bp.disabled = true;
  await api('pausa', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: abierta, pausar }) });
  bp.disabled = false;
  await refrescarHilo();
  cargar();
}

async function enviar() {
  const ta = document.getElementById('txt');
  const texto = ta.value.trim();
  if (!texto || enviando) return;
  enviando = true;
  document.getElementById('btnEnviar').disabled = true;
  document.getElementById('err').style.display = 'none';
  const r = await api('responder', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: abierta, texto }) });
  enviando = false;
  document.getElementById('btnEnviar').disabled = false;
  if (r.error) {
    const e = document.getElementById('err');
    e.textContent = r.error; e.style.display = 'block';
    return;
  }
  ta.value = '';
  await refrescarHilo();
  cargar();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(t =>
    t.onclick = () => { vista = t.dataset.v; pinta(); });
  document.getElementById('txt').addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  });
  cargar();
  setInterval(() => { cargar(); refrescarHilo(); }, 12000);
});
`;

export function renderPanel() {
  const esc = (s) => String(s ?? "").replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" })[c]);
  return `<!doctype html><html lang="es"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="theme-color" content="#6F00FF">
<title>${esc(negocio.nombreNegocio)}</title>
${marca.fuente ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${marca.fuente}">` : ""}
<style>${CSS}</style></head><body>
<header>
  <h1>${esc(negocio.nombreNegocio)}</h1>
  <div class="sub">${esc(negocio.nombreAgente)} está atendiendo tu WhatsApp</div>
  <div class="nums">
    <span><b id="nConv">0</b>conversaciones</span>
    <span><b id="nLeads">0</b>interesados</span>
    <span><b id="nEsc">0</b>te necesitan</span>
  </div>
  <div class="tabs">
    <button class="tab on" data-v="conversaciones">Conversaciones</button>
    <button class="tab" data-v="interesados">Interesados</button>
  </div>
</header>
<main>
  <div id="lista"></div>
  <div id="nada">
    <div>
      <div style="font-size:30px;margin-bottom:8px">💬</div>
      Elige una conversación para leerla<br>y contestar tú mismo.
    </div>
  </div>
</main>
<footer>
  Tu agente atiende solo, 24/7.<br>
  hecho con ${marca.url
    ? `<a href="${esc(marca.url)}" target="_blank" rel="noopener">${esc(marca.nombre)}</a>`
    : esc(marca.nombre)}
</footer>

<div id="hilo">
  <div class="hcab">
    <button class="volver" onclick="cerrar()">‹</button>
    <div class="cuerpo">
      <div class="nom" id="hNom"></div>
      <div class="prev" id="hSub"></div>
    </div>
    <button class="btn pausa" id="btnPausa" onclick="alternarPausa()">⏸ Contesto yo</button>
    <a class="btn solo-icono" id="btnWa" target="_blank" rel="noopener"
       title="Abrir el chat en WhatsApp">💬</a>
  </div>
  <div class="error" id="err" style="display:none"></div>
  <div class="msgs" id="msgs"></div>
  <div class="comp">
    <textarea id="txt" rows="1" placeholder="Escribe tu respuesta…"></textarea>
    <button id="btnEnviar" onclick="enviar()">➤</button>
  </div>
</div>
<script>${JS}</script></body></html>`;
}
