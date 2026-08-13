// El runtime del panel: router por hash, tema, y utilidades que comparten las secciones.

export const APP = String.raw`
const CLAVE = new URLSearchParams(location.search).get('clave') || '';
// La cookie de sesión ya quedó sembrada por el servidor: la clave no tiene por
// qué seguir en la barra del navegador (ni en un pantallazo, ni en el historial).
if (CLAVE) history.replaceState(null, '', location.pathname + location.hash);
const api = (r, o) => fetch('/api/' + r + (r.includes('?') ? '&' : '?') + 'clave=' + encodeURIComponent(CLAVE), o)
  .then(x => x.json());
const post = (r, datos) => api(r, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(datos || {}),
});

// ── utilidades compartidas ──
const esc = s => String(s == null ? '' : s).replace(/[<>&]/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
const ini = s => (String(s || '?').trim()[0] || '?').toUpperCase();
const nf = n => Number(n || 0).toLocaleString('es-MX');
const usd = n => '$' + Number(n || 0).toFixed(n >= 1 ? 2 : 4);
function reloj(ms){ return new Date(ms).toLocaleTimeString('es-MX',{hour:'2-digit',minute:'2-digit'}); }
function etiquetaDia(ms){
  const d=new Date(ms), hoy=new Date(), ayer=new Date(Date.now()-86400000);
  if(d.toDateString()===hoy.toDateString()) return 'Hoy';
  if(d.toDateString()===ayer.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});
}
function cuando(ms){
  const d=Date.now()-ms;
  if(d<60000) return 'ahora';
  if(d<3600000) return Math.floor(d/60000)+' min';
  if(d<86400000) return Math.floor(d/3600000)+' h';
  return new Date(ms).toLocaleDateString('es-MX',{day:'numeric',month:'short'});
}
function faltaPara(ms){
  const d=ms-Date.now();
  if(d<=0) return 'ya';
  if(d<3600000) return 'en '+Math.round(d/60000)+' min';
  if(d<86400000) return 'en '+Math.round(d/3600000)+' h';
  return 'en '+Math.round(d/86400000)+' d';
}

// ── tema día/noche: manual manda; sin elección, sigue al sistema ──
function aplicarTema(t){
  if(t) document.documentElement.dataset.tema = t;
  else delete document.documentElement.dataset.tema;
  const osc = t ? t === 'oscuro'
    : matchMedia('(prefers-color-scheme: dark)').matches;
  document.getElementById('btnTema').textContent = osc ? '☀️' : '🌙';
}
function alternarTema(){
  const actual = document.documentElement.dataset.tema
    || (matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro');
  const nuevo = actual === 'oscuro' ? 'claro' : 'oscuro';
  localStorage.setItem('tema', nuevo);
  aplicarTema(nuevo);
}

// ── router por hash ──
// Cada sección se registra en SECCIONES con { init, cada } (cada = refresco periódico).
const SECCIONES = {};
let seccionActiva = null, reloji = null;

function navegar(){
  const id = (location.hash.replace('#/','') || 'resumen').split('?')[0];
  const sec = SECCIONES[id] ? id : 'resumen';
  seccionActiva = sec;
  document.querySelectorAll('.seccion').forEach(s => s.classList.toggle('on', s.id === 'sec-' + sec));
  document.querySelectorAll('.nitem').forEach(n => n.classList.toggle('on', n.dataset.sec === sec));
  const el = document.querySelector('.nitem[data-sec="' + sec + '"]');
  document.getElementById('tituloSec').textContent = el ? el.dataset.titulo : sec;
  clearInterval(reloji);
  const s = SECCIONES[sec];
  if (s?.init) s.init();
  if (s?.cada) reloji = setInterval(() => { if (!document.hidden) s.cada(); }, 15000);
}

// ── el chip de "agente en línea" ──
async function latido(){
  try {
    const s = await api('../salud');
    const ok = s?.agente === 'vivo';
    const chip = document.getElementById('chipVivo');
    chip.classList.toggle('mal', !ok);
    chip.querySelector('span:last-child').textContent = ok ? 'AGENTE EN LÍNEA' : 'AGENTE CAÍDO';
  } catch { document.getElementById('chipVivo').classList.add('mal'); }
}

document.addEventListener('DOMContentLoaded', () => {
  aplicarTema(localStorage.getItem('tema'));
  const shell = document.querySelector('.shell');
  if (localStorage.getItem('menu') === 'oculto') shell.classList.add('plegada');
  document.getElementById('btnPlegar').onclick = () => {
    shell.classList.toggle('plegada');
    localStorage.setItem('menu', shell.classList.contains('plegada') ? 'oculto' : 'visible');
  };
  document.getElementById('btnTema').onclick = alternarTema;
  addEventListener('hashchange', navegar);
  navegar();
  latido(); setInterval(latido, 30000);
});

// ── mi cuenta: el menú ──
const mcZona = document.querySelector('.mc-zona');
document.getElementById('miCuenta')?.addEventListener('click', (e) => {
  e.stopPropagation();
  const menu = document.getElementById('mcMenu');
  menu.hidden = !menu.hidden;
  mcZona.classList.toggle('abierta', !menu.hidden);
});
document.addEventListener('click', () => {
  const menu = document.getElementById('mcMenu');
  if (menu && !menu.hidden) { menu.hidden = true; mcZona.classList.remove('abierta'); }
});
document.getElementById('mcMenu')?.addEventListener('click', (e) => {
  // navegar o accionar sí cierra; el clic en el fondo del menú no
  if (e.target.closest('.mc-item')) {
    document.getElementById('mcMenu').hidden = true;
    mcZona.classList.remove('abierta');
  }
  e.stopPropagation();
});
document.getElementById('mcTema')?.addEventListener('click', alternarTema);

// ── cerrar sesión ──
document.getElementById('btnSalir')?.addEventListener('click', async () => {
  if (!confirm('¿Cerrar la sesión en este dispositivo?')) return;
  await fetch('/api/logout', { method: 'POST' }).catch(() => {});
  location.replace('/panel');
});
`;
