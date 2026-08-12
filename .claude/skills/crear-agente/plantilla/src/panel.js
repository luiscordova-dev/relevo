// El panel del dueño: sus conversaciones y sus interesados, desde el celular.
// Una sola página, sin librerías ni compilación: la sirve el mismo Worker.

import { negocio } from "../negocio.js";
import { marca } from "../marca.js";

const CSS = `
/* ───────────────────────────────────────────────────────────────────────────
   Sistema de tokens. Superficies en capas: lienzo → tarjeta → apagado.
   Los colores salen de la identidad de marca; cambiarlos aquí cambia todo.
   ─────────────────────────────────────────────────────────────────────── */
:root{
  --tinta:#131628; --morado:#6F00FF; --rojo:#F44336; --gris:#607179;

  --lienzo:#FAFAFA;            /* fondo de la página */
  --tarjeta:#FFFFFF;           /* superficie de trabajo */
  --apagado:#F4F2FA;           /* superficie secundaria, con un guiño al morado */
  --borde:#E8E6F0;
  --borde-fuerte:#D9D6E6;
  --txt:var(--tinta);
  --sec:var(--gris);
  --morado-tenue:#F1E8FF;
  --banda:var(--tinta);        /* la banda superior */
  --banda-txt:#FFFFFF;
  --banda-sec:#9AA0B8;
  --banda-linea:#282C42;

  --r:12px;                    /* radio base */
  --r-sm:9px;
  --sombra:0 1px 2px rgba(19,22,40,.04), 0 12px 32px -8px rgba(19,22,40,.10);
  --anillo:0 0 0 3px rgba(111,0,255,.22);
}
@media(prefers-color-scheme:dark){:root{
  --lienzo:#08090F; --tarjeta:#14172A; --apagado:#1D2138; --borde:#262B45;
  --borde-fuerte:#333854; --txt:#F1F1F5; --sec:#98A0B8; --morado-tenue:#2C1660;
  --banda:#0E1122; --banda-linea:#232742;
  --sombra:0 1px 2px rgba(0,0,0,.4), 0 12px 32px -8px rgba(0,0,0,.5);
}}

*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--lienzo);color:var(--txt);
     font:400 15px/1.55 Poppins,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
     -webkit-font-smoothing:antialiased}
:focus-visible{outline:none;box-shadow:var(--anillo);border-radius:var(--r-sm)}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}

/* ── La banda: identidad y triaje de un vistazo ── */
.banda{background:var(--banda);color:var(--banda-txt);padding:16px 16px 20px}
.banda-int{max-width:1240px;margin:0 auto;display:flex;align-items:flex-end;
           gap:24px;flex-wrap:wrap}
.marca{flex:1;min-width:200px}
.marca h1{font-size:21px;font-weight:800;letter-spacing:-.4px;margin:0}
.marca p{margin:3px 0 0;font-size:13px;color:var(--banda-sec)}
.triaje{display:flex;gap:22px}
.dato b{display:block;font-size:20px;font-weight:800;line-height:1.05;
        font-variant-numeric:tabular-nums;letter-spacing:-.5px}
.dato span{font-size:10.5px;color:var(--banda-sec);letter-spacing:.06em;text-transform:uppercase}
.dato.urge.hay b{color:var(--rojo)}      /* solo se enciende si de verdad hay alguien */

/* ── El área de trabajo: papel blanco sobre el escritorio ── */
main{max-width:1240px;margin:-10px auto 0;background:var(--tarjeta);
     border:1px solid var(--borde);border-radius:var(--r);box-shadow:var(--sombra);
     overflow:hidden;min-height:64vh}
.filtros{display:flex;flex-direction:column;gap:10px;padding:12px;
         border-bottom:1px solid var(--borde);background:var(--tarjeta)}
.tabs{display:flex;gap:4px}
.tab{padding:8px 15px;border:0;background:transparent;color:var(--sec);border-radius:var(--r-sm);
     font:600 13px Poppins,sans-serif;cursor:pointer;transition:background .14s,color .14s}
.tab:hover{background:var(--apagado);color:var(--txt)}
.tab.on{background:var(--morado);color:#fff}
.busca{width:100%;border:1px solid var(--borde-fuerte);border-radius:var(--r-sm);
       padding:9px 13px;font:400 13.5px Poppins,sans-serif;background:var(--lienzo);color:var(--txt);
       outline:none;transition:border-color .14s,box-shadow .14s;-webkit-appearance:none}
.busca:focus{border-color:var(--morado);box-shadow:var(--anillo)}

/* ── Lista ── */
.fila{display:flex;gap:12px;align-items:flex-start;padding:14px 16px 14px 13px;
      border-bottom:1px solid var(--borde);cursor:pointer;position:relative;
      border-left:3px solid transparent;transition:background .14s,border-color .14s}
.fila:hover{background:var(--apagado)}
.fila.sel{background:var(--morado-tenue);border-left-color:var(--morado)}
.fila.esc{border-left-color:var(--morado)}     /* el riel: quién te necesita, sin leer */
.ini{width:42px;height:42px;border-radius:999px;background:var(--apagado);color:var(--sec);
     flex:none;display:grid;place-items:center;font-weight:800;font-size:15px}
.fila.esc .ini{background:var(--morado);color:#fff}
.cuerpo{flex:1;min-width:0}
.linea1{display:flex;align-items:baseline;gap:8px}
.nom{font-weight:600;letter-spacing:-.15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hora{margin-left:auto;color:var(--sec);font-size:11px;flex:none;font-variant-numeric:tabular-nums}
.prev{color:var(--sec);font-size:13px;white-space:nowrap;overflow:hidden;
      text-overflow:ellipsis;margin-top:2px}
.chips{display:flex;gap:5px;margin-top:8px;flex-wrap:wrap}
.chip{font:600 10.5px Poppins,sans-serif;padding:3px 9px;border-radius:999px;
      background:var(--apagado);color:var(--sec);letter-spacing:.01em}
.chip.rojo{background:var(--rojo);color:#fff}
.chip.morado{background:var(--morado-tenue);color:var(--morado)}
.vacio{padding:64px 28px;text-align:center;color:var(--sec);font-size:14px}
.vacio b,#nada b{display:block;color:var(--txt);font-weight:800;font-size:16px;margin-bottom:6px}
#nada{color:var(--sec)}

/* ── Hilo ── */
.hcab{padding:13px 14px;border-bottom:1px solid var(--borde);display:flex;
      align-items:center;gap:10px;flex:none;background:var(--tarjeta)}
.hcab .cuerpo{flex:1;min-width:0}
.hcab .nom{font-size:15px;font-weight:700}
.volver{background:none;border:0;font-size:24px;color:var(--txt);cursor:pointer;
        padding:0 6px 0 2px;line-height:1}
.btn{border:1px solid var(--borde-fuerte);background:var(--tarjeta);color:var(--txt);
     border-radius:var(--r-sm);padding:8px 13px;font:600 12.5px Poppins,sans-serif;
     cursor:pointer;white-space:nowrap;text-decoration:none;flex:none;
     transition:border-color .14s,background .14s,color .14s}
.btn:hover{border-color:var(--morado);color:var(--morado)}
.btn.pausa{border-color:var(--morado);color:var(--morado)}
.btn.activo{background:var(--morado);color:#fff;border-color:var(--morado)}
.btn.activo:hover{color:#fff;opacity:.92}
.btn.icono{padding:8px 11px;font-size:14px;line-height:1.2}
.msgs{flex:1;overflow-y:auto;padding:20px 16px;display:flex;flex-direction:column;
      gap:10px;background:var(--lienzo)}
.b{max-width:72%;padding:10px 13px;border-radius:14px;font-size:14px;line-height:1.5;
   white-space:pre-wrap;word-wrap:break-word}
.b .meta{display:block;font-size:10px;opacity:.62;margin-top:5px;letter-spacing:.02em}
.b.cliente{align-self:flex-start;background:var(--tarjeta);border:1px solid var(--borde);
           border-bottom-left-radius:4px}
.b.agente{align-self:flex-end;background:var(--apagado);border-bottom-right-radius:4px}
.b.dueño{align-self:flex-end;background:var(--morado);color:#fff;border-bottom-right-radius:4px}
.dia{align-self:center;font:600 11px Poppins,sans-serif;color:var(--sec);
     letter-spacing:.04em;text-transform:capitalize;margin:10px 0 2px}
.aviso{align-self:center;font-size:11.5px;color:var(--sec);background:var(--apagado);
       padding:7px 15px;border-radius:999px;text-align:center;max-width:88%}
.comp{padding:12px;display:flex;gap:9px;align-items:flex-end;flex:none;
      border-top:1px solid var(--borde);background:var(--tarjeta)}
.comp textarea{flex:1;border:1px solid var(--borde-fuerte);border-radius:22px;padding:11px 16px;
      resize:none;font:400 15px Poppins,sans-serif;background:var(--tarjeta);color:var(--txt);
      max-height:120px;outline:none;transition:border-color .14s,box-shadow .14s}
.comp textarea:focus{border-color:var(--morado);box-shadow:var(--anillo)}
.comp button{background:var(--morado);color:#fff;border:0;border-radius:999px;
      width:44px;height:44px;font-size:16px;cursor:pointer;flex:none;transition:opacity .14s}
.comp button:hover{opacity:.9}
.comp button:disabled{opacity:.35;cursor:default}
.error{background:var(--rojo);color:#fff;padding:11px 14px;font-size:13px;
       text-align:center;flex:none}
footer{padding:20px 16px 34px;text-align:center;color:var(--sec);font-size:12px}
footer a{color:var(--morado);text-decoration:none;font-weight:600}

/* ── Móvil: la lista manda, el hilo entra encima ── */
#nada{display:none}
#hilo{position:fixed;inset:0;z-index:20;background:var(--tarjeta);display:none;
      flex-direction:column}
#hilo.abierto{display:flex}

/* ── Escritorio: dos paneles dentro de la misma hoja ── */
@media(min-width:900px){
  .banda{padding:22px 20px 24px}
  .dato b{font-size:24px}
  main{display:grid;grid-template-columns:360px 1fr;
       grid-template-rows:auto 1fr;              /* sin esto, la fila de filtros se estira */
       grid-template-areas:"filtros hilo" "lista hilo";
       height:calc(100vh - 150px);min-height:480px}
  .filtros{grid-area:filtros;border-right:1px solid var(--borde)}
  #lista{grid-area:lista;overflow-y:auto;border-right:1px solid var(--borde)}
  #nada,#hilo{grid-area:hilo}
  #hilo{position:static;display:none;min-width:0}
  #hilo.abierto{display:flex}
  #nada{display:grid;place-items:center;text-align:center;padding:40px;
        color:var(--sec);font-size:14px;line-height:1.7}
  body.split #nada{display:none}
  .volver{display:none}
}
`;

const JS = String.raw`const CLAVE = new URLSearchParams(location.search).get('clave') || '';
const api = (r, o) => fetch('/api/' + r + (r.includes('?') ? '&' : '?') + 'clave=' + encodeURIComponent(CLAVE), o)
  .then(x => x.json());

let vista = 'conversaciones', estado = 'abiertas', orden = 'reciente', etiquetaFiltro = '';
let abierta = null, datos = { conversaciones: [], etiquetas: [] }, hiloActual = null;
let modo = 'responder', gaveta = null, enviando = false;

const EMOJIS = ['😊','👍','🙏','✨','🎉','❤️','👋','✅','😅','🔥','🙌','💪','🤝','😍','📍','💰',
                '📸','⏰','🎂','☕','🚗','📦','💬','😉','🥳','👏','🌟','😃','🤗','💡'];

const esc = s => String(s == null ? '' : s).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
const ini = s => (String(s || '?').trim()[0] || '?').toUpperCase();
const listaEtiquetas = c => (c.etiquetas || '').split(',').filter(Boolean);

function reloj(ms) {
  return new Date(ms).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}
function etiquetaDia(ms) {
  const d = new Date(ms), hoy = new Date(), ayer = new Date(Date.now() - 86400000);
  if (d.toDateString() === hoy.toDateString()) return 'Hoy';
  if (d.toDateString() === ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
}
function cuando(ms) {
  const d = Date.now() - ms;
  if (d < 60000) return 'ahora';
  if (d < 3600000) return Math.floor(d / 60000) + ' min';
  if (d < 86400000) return Math.floor(d / 3600000) + ' h';
  return new Date(ms).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
}
function faltaPara(ms) {
  const d = ms - Date.now();
  if (d <= 0) return 'ya';
  if (d < 3600000) return 'en ' + Math.round(d / 60000) + ' min';
  if (d < 86400000) return 'en ' + Math.round(d / 3600000) + ' h';
  return 'en ' + Math.round(d / 86400000) + ' d';
}
const pausada = c => c.pausado_hasta && c.pausado_hasta > Date.now();
// Tú tienes el control y el cliente escribió después: le debes respuesta.
const teToca = c => pausada(c) && c.ultimo_rol === 'cliente';
const nombreDe = c => c.lead_nombre || c.nombre_contacto || c.telefono || 'Sin nombre';

async function cargar() {
  datos = await api('conversaciones?orden=' + orden);
  pinta();
}

function pinta() {
  const cs = datos.conversaciones || [];
  const abiertas = cs.filter(c => !c.cerrada);
  document.getElementById('nConv').textContent = abiertas.length;
  document.getElementById('nLeads').textContent = abiertas.filter(c => c.lead_nombre || c.interes).length;
  const urgentes = abiertas.filter(c => c.escalado || teToca(c)).length;
  document.getElementById('nEsc').textContent = urgentes;
  document.getElementById('dUrge').classList.toggle('hay', urgentes > 0);

  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('on', t.dataset.v === vista));
  pintaSelectorEtiquetas();

  const q = (document.getElementById('busca').value || '').trim().toLowerCase();
  let items = cs;
  if (estado === 'abiertas') items = items.filter(c => !c.cerrada);
  else if (estado === 'cerradas') items = items.filter(c => c.cerrada);
  if (vista === 'interesados') items = items.filter(c => c.lead_nombre || c.interes);
  if (etiquetaFiltro) items = items.filter(c => listaEtiquetas(c).includes(etiquetaFiltro));
  if (q) items = items.filter(c =>
    (nombreDe(c) + ' ' + (c.interes || '') + ' ' + (c.ultimo_texto || '') + ' ' + (c.etiquetas || ''))
      .toLowerCase().includes(q));

  const lista = document.getElementById('lista');
  if (!items.length) {
    lista.innerHTML = '<div class="vacio"><b>' +
      (q || etiquetaFiltro ? 'Nada con ese filtro' :
       estado === 'cerradas' ? 'No has cerrado ninguna' : 'Todavía no hay nada por aquí.') +
      '</b>' + (q || etiquetaFiltro ? 'Prueba con otra palabra o quita el filtro.' :
       'Cuando alguien le escriba a tu WhatsApp, la conversación aparece aquí.') + '</div>';
    return;
  }

  lista.innerHTML = items.map(c => {
    const chips = [];
    if (teToca(c)) chips.push('<span class="chip rojo">Te toca contestar</span>');
    else if (c.escalado && !c.cerrada) chips.push('<span class="chip rojo">Te necesita</span>');
    if (pausada(c)) chips.push('<span class="chip morado">Tú contestas</span>');
    if (c.recordatorio) chips.push('<span class="chip">⏰ ' + faltaPara(c.recordatorio) + '</span>');
    listaEtiquetas(c).forEach(e => chips.push('<span class="chip eti">' + esc(e) + '</span>'));
    if (c.interes) chips.push('<span class="chip">' + esc(c.interes.slice(0, 30)) + '</span>');
    const quien = c.ultimo_rol === 'cliente' ? '' : (c.ultimo_rol === 'dueño' ? 'Tú: ' : 'Agente: ');
    const urge = (c.escalado || teToca(c)) && !c.cerrada;
    return '<div class="fila' + (urge ? ' esc' : '') + (c.cerrada ? ' cerrada' : '') +
      (c.id === abierta ? ' sel' : '') + '" data-id="' + c.id + '" onclick="abrir(\'' + c.id + '\')">' +
      '<div class="ini">' + esc(ini(nombreDe(c))) + '</div><div class="cuerpo">' +
      '<div class="linea1"><span class="nom">' + esc(nombreDe(c)) + '</span>' +
      '<span class="hora">' + cuando(c.actualizado_en) + '</span></div>' +
      '<div class="prev">' + esc(quien + (c.ultimo_texto || '').slice(0, 90)) + '</div>' +
      (chips.length ? '<div class="chips">' + chips.join('') + '</div>' : '') +
      '</div></div>';
  }).join('');
}

function pintaSelectorEtiquetas() {
  const sel = document.getElementById('fEtiqueta');
  const disponibles = datos.etiquetas || [];
  sel.style.display = disponibles.length ? '' : 'none';
  if (sel.dataset.n === String(disponibles.length)) return;
  sel.dataset.n = disponibles.length;
  sel.innerHTML = '<option value="">Todas las etiquetas</option>' +
    disponibles.map(e => '<option value="' + esc(e) + '">' + esc(e) + '</option>').join('');
  sel.value = etiquetaFiltro;
}

async function abrir(id) {
  abierta = id; gaveta = null; modo = 'responder';
  document.querySelectorAll('.fila').forEach(f => f.classList.toggle('sel', f.dataset.id === id));
  document.getElementById('hilo').classList.add('abierto');
  document.body.classList.add('split');
  document.getElementById('msgs').innerHTML = '<div class="aviso">Cargando…</div>';
  await refrescarHilo();
}

async function refrescarHilo() {
  if (!abierta) return;
  const h = await api('hilo?id=' + encodeURIComponent(abierta));
  if (h.error) return;
  hiloActual = h;
  const enPausa = h.pausado_hasta && h.pausado_hasta > Date.now();

  document.getElementById('hNom').textContent = h.lead_nombre || h.nombre_contacto || h.telefono;
  document.getElementById('hSub').textContent = (h.interes ? h.interes + ' · ' : '') + h.telefono;
  const bp = document.getElementById('btnPausa');
  bp.textContent = enPausa ? 'Sigue el agente' : 'Contesto yo';
  bp.classList.toggle('activo', enPausa);
  document.getElementById('btnWa').href = 'https://wa.me/' + String(h.telefono).replace(/\D/g, '');
  const bc = document.getElementById('btnCerrar');
  bc.textContent = h.cerrada ? '↩' : '✓';
  bc.title = h.cerrada ? 'Reabrir esta conversación' : 'Marcar como atendida';
  bc.classList.toggle('activo', !!h.cerrada);
  document.getElementById('btnRecordar').classList.toggle('activo', !!h.recordatorio);
  document.getElementById('btnEtiquetas').classList.toggle('activo', !!h.etiquetas);

  pintaGaveta();

  const cont = document.getElementById('msgs');
  let dia = null;
  cont.innerHTML = (h.mensajes || []).map(m => {
    let sep = '';
    const d = new Date(m.creado_en).toDateString();
    if (d !== dia) { dia = d; sep = '<div class="dia">' + etiquetaDia(m.creado_en) + '</div>'; }
    if (m.rol === 'nota') {
      return sep + '<div class="nota">📝 ' + esc(m.texto) +
        '<span class="meta">Nota privada · ' + reloj(m.creado_en) + '</span></div>';
    }
    const et = m.rol === 'cliente' ? '' : (m.rol === 'dueño' ? 'Tú' : 'Agente');
    const ic = m.tipo === 'audio' ? '🎙️ ' : (m.tipo === 'imagen' ? '📷 ' : '');
    return sep + '<div class="b ' + m.rol + '">' + ic + esc(m.texto) +
      '<span class="meta">' + (et ? et + ' · ' : '') + reloj(m.creado_en) + '</span></div>';
  }).join('') +
  (h.cerrada ? '<div class="aviso">✓ Marcaste esta conversación como atendida.</div>' : '') +
  (enPausa ? '<div class="aviso">⏸ El agente está callado aquí. Tú contestas.</div>' : '');
  cont.scrollTop = cont.scrollHeight;
}

// ── La gaveta: etiquetas, recordatorio o ficha, una a la vez ──
function abreGaveta(cual) { gaveta = gaveta === cual ? null : cual; pintaGaveta(); }

function pintaGaveta() {
  const g = document.getElementById('gaveta'), h = hiloActual;
  if (!gaveta || !h) { g.style.display = 'none'; g.innerHTML = ''; return; }
  g.style.display = 'block';

  if (gaveta === 'etiquetas') {
    const puestas = (h.etiquetas || '').split(',').filter(Boolean);
    const sugeridas = (datos.etiquetas || []).filter(e => !puestas.includes(e));
    g.innerHTML = '<div class="gtit">Etiquetas de esta conversación</div>' +
      '<div class="gchips">' +
      (puestas.length ? puestas.map(e =>
        '<button class="chip eti quitar" onclick="quitarEtiqueta(\'' + esc(e) + '\')">' +
        esc(e) + ' ✕</button>').join('') : '<span class="gvacio">Todavía ninguna</span>') +
      '</div>' +
      (sugeridas.length ? '<div class="gtit">Que ya usas</div><div class="gchips">' +
        sugeridas.map(e => '<button class="chip" onclick="ponerEtiqueta(\'' + esc(e) + '\')">+ ' +
        esc(e) + '</button>').join('') + '</div>' : '') +
      '<div class="gfila"><input id="etiNueva" placeholder="Nueva etiqueta" maxlength="24">' +
      '<button class="btn" onclick="ponerEtiqueta()">Agregar</button></div>';
    const inp = document.getElementById('etiNueva');
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') ponerEtiqueta(); });
  }

  if (gaveta === 'recordatorio') {
    g.innerHTML = '<div class="gtit">Recuérdame este chat…</div><div class="gchips">' +
      '<button class="btn" onclick="recordar(60)">En 1 hora</button>' +
      '<button class="btn" onclick="recordar(180)">En 3 horas</button>' +
      '<button class="btn" onclick="recordar(1440)">Mañana</button>' +
      '<button class="btn" onclick="recordar(4320)">En 3 días</button>' +
      (h.recordatorio ? '<button class="btn" onclick="recordar(0)">Quitar el recordatorio</button>' : '') +
      '</div>' + (h.recordatorio
        ? '<div class="gvacio">Te aviso ' + faltaPara(h.recordatorio) + ', por Telegram.</div>'
        : '<div class="gvacio">Te llega el aviso a tu Telegram.</div>');
  }

  if (gaveta === 'ficha') {
    const n = (h.mensajes || []).length;
    g.innerHTML = '<div class="gtit">Ficha</div><div class="ficha">' +
      fila('Nombre', h.lead_nombre || h.nombre_contacto || '—') +
      fila('Teléfono', h.telefono) +
      fila('Qué quiere', h.interes || '—') +
      (h.motivo ? fila('Pidió un humano', h.motivo) : '') +
      fila('Mensajes', n) +
      fila('Primer contacto', new Date(h.creado_en).toLocaleDateString('es-MX',
        { day: 'numeric', month: 'long', year: 'numeric' })) +
      '</div>';
  }
}
const fila = (k, v) => '<div class="fficha"><span>' + k + '</span><b>' + esc(v) + '</b></div>';

async function ponerEtiqueta(valor) {
  const inp = document.getElementById('etiNueva');
  const nueva = valor || (inp && inp.value.trim());
  if (!nueva) return;
  const puestas = (hiloActual.etiquetas || '').split(',').filter(Boolean);
  if (!puestas.includes(nueva)) puestas.push(nueva);
  await api('etiquetas', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: abierta, etiquetas: puestas }) });
  await refrescarHilo(); cargar();
}
async function quitarEtiqueta(e) {
  const puestas = (hiloActual.etiquetas || '').split(',').filter(Boolean).filter(x => x !== e);
  await api('etiquetas', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: abierta, etiquetas: puestas }) });
  await refrescarHilo(); cargar();
}
async function recordar(minutos) {
  await api('recordatorio', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: abierta, minutos }) });
  gaveta = null; await refrescarHilo(); cargar();
}
async function alternarCierre() {
  await api('cerrar', { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: abierta, cerrada: !hiloActual.cerrada }) });
  await refrescarHilo(); cargar();
}

function cerrar() {
  abierta = null; hiloActual = null; gaveta = null;
  document.querySelectorAll('.fila.sel').forEach(f => f.classList.remove('sel'));
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
  await refrescarHilo(); cargar();
}

function cambiaModo(m) {
  modo = m;
  document.querySelectorAll('.mtab').forEach(t => t.classList.toggle('on', t.dataset.m === m));
  const ta = document.getElementById('txt');
  ta.placeholder = m === 'nota' ? 'Nota para ti — no le llega al cliente' : 'Escribe tu respuesta…';
  document.getElementById('comp').classList.toggle('esnota', m === 'nota');
  ta.focus();
}

function alternarEmojis() {
  const p = document.getElementById('emojis');
  if (p.dataset.listo !== '1') {
    p.innerHTML = EMOJIS.map(e => '<button onclick="meteEmoji(\'' + e + '\')">' + e + '</button>').join('');
    p.dataset.listo = '1';
  }
  p.style.display = p.style.display === 'flex' ? 'none' : 'flex';
}
function meteEmoji(e) {
  const ta = document.getElementById('txt');
  ta.value += e; ta.focus();
}

async function enviar() {
  const ta = document.getElementById('txt');
  const texto = ta.value.trim();
  if (!texto || enviando) return;
  enviando = true;
  document.getElementById('btnEnviar').disabled = true;
  document.getElementById('err').style.display = 'none';
  document.getElementById('emojis').style.display = 'none';
  const r = await api(modo === 'nota' ? 'nota' : 'responder',
    { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: abierta, texto }) });
  enviando = false;
  document.getElementById('btnEnviar').disabled = false;
  if (r.error) {
    const e = document.getElementById('err');
    e.textContent = r.error; e.style.display = 'block';
    return;
  }
  ta.value = '';
  await refrescarHilo(); cargar();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab').forEach(t =>
    t.onclick = () => { vista = t.dataset.v; pinta(); });
  document.querySelectorAll('.mtab').forEach(t =>
    t.onclick = () => cambiaModo(t.dataset.m));
  document.getElementById('busca').addEventListener('input', pinta);
  document.getElementById('fEstado').addEventListener('change', e => { estado = e.target.value; pinta(); });
  document.getElementById('fOrden').addEventListener('change', e => { orden = e.target.value; cargar(); });
  document.getElementById('fEtiqueta').addEventListener('change', e => { etiquetaFiltro = e.target.value; pinta(); });
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
<meta name="theme-color" content="#131628">
<title>${esc(negocio.nombreNegocio)}</title>
${marca.fuente ? `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${marca.fuente}">` : ""}
<style>${CSS}</style></head><body>

<div class="banda"><div class="banda-int">
  <div class="marca">
    <h1>${esc(negocio.nombreNegocio)}</h1>
    <p>${esc(negocio.nombreAgente)} contesta tu WhatsApp, 24/7</p>
  </div>
  <div class="triaje">
    <div class="dato"><b id="nConv">0</b><span>conversaciones</span></div>
    <div class="dato"><b id="nLeads">0</b><span>interesados</span></div>
    <div class="dato urge" id="dUrge"><b id="nEsc">0</b><span>te necesitan</span></div>
  </div>
</div></div>

<main>
  <div class="filtros">
    <input id="busca" class="busca" type="search" placeholder="Buscar por nombre o palabra"
           aria-label="Buscar conversaciones">
    <div class="tabs">
      <button class="tab on" data-v="conversaciones">Conversaciones</button>
      <button class="tab" data-v="interesados">Interesados</button>
    </div>
    <div class="selects">
      <select id="fEstado" aria-label="Qué conversaciones ver">
        <option value="abiertas">Sin atender</option>
        <option value="cerradas">Atendidas</option>
        <option value="todas">Todas</option>
      </select>
      <select id="fOrden" aria-label="Orden">
        <option value="reciente">Recientes primero</option>
        <option value="antiguo">Antiguas primero</option>
      </select>
      <select id="fEtiqueta" aria-label="Filtrar por etiqueta" style="display:none"></select>
    </div>
  </div>
  <div id="lista"></div>
  <div id="nada">
    <div>
      <b>Elige una conversación</b>
      Ábrela para leerla completa y contestar tú mismo.
    </div>
  </div>
  <div id="hilo">
    <div class="hcab">
      <button class="volver" onclick="cerrar()" aria-label="Volver a la lista">‹</button>
      <div class="cuerpo">
        <div class="nom" id="hNom"></div>
        <div class="prev" id="hSub"></div>
      </div>
      <button class="btn pausa" id="btnPausa" onclick="alternarPausa()">Contesto yo</button>
    </div>
    <div class="acciones">
      <button class="ico" id="btnEtiquetas" onclick="abreGaveta('etiquetas')" title="Etiquetas">🏷️</button>
      <button class="ico" id="btnRecordar" onclick="abreGaveta('recordatorio')" title="Recordármelo">⏰</button>
      <button class="ico" id="btnCerrar" onclick="alternarCierre()" title="Marcar como atendida">✓</button>
      <button class="ico" id="btnFicha" onclick="abreGaveta('ficha')" title="Ficha">📇</button>
      <a class="ico" id="btnWa" target="_blank" rel="noopener" title="Abrir en WhatsApp">💬</a>
    </div>
    <div class="gaveta" id="gaveta" style="display:none"></div>
    <div class="error" id="err" style="display:none"></div>
    <div class="msgs" id="msgs"></div>
    <div class="emojis" id="emojis" style="display:none"></div>
    <div class="comp" id="comp">
      <div class="modos">
        <button class="mtab on" data-m="responder">Responder</button>
        <button class="mtab" data-m="nota">Nota</button>
      </div>
      <div class="cfila">
        <button class="ico" onclick="alternarEmojis()" title="Emojis" aria-label="Emojis">🙂</button>
        <textarea id="txt" rows="1" placeholder="Escribe tu respuesta…" aria-label="Tu respuesta"></textarea>
        <button id="btnEnviar" onclick="enviar()" aria-label="Enviar">➤</button>
      </div>
    </div>
  </div>
</main>

<footer>
  hecho con ${marca.url
    ? `<a href="${esc(marca.url)}" target="_blank" rel="noopener">${esc(marca.nombre)}</a>`
    : esc(marca.nombre)}
</footer>
<script>${JS}</script></body></html>`;
}
