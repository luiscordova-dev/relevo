// La bandeja: migrada del panel anterior, ya probada. El shell la monta como sección.

export const HTML = `
<div class="bandeja"><div class="marco">
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
</div></div>`;

export const CSS = `
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
     border-radius:999px;padding:8px 15px;font:600 12.5px Poppins,sans-serif;
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


.filtros{display:flex;flex-direction:column;gap:10px;padding:12px;
         border-bottom:1px solid var(--borde);background:var(--tarjeta)}
.tabs{display:flex;gap:4px}
.tabs{display:flex;gap:4px}
.tab{padding:8px 16px;border:0;background:transparent;color:var(--sec);border-radius:999px;
     font:600 13px Poppins,sans-serif;cursor:pointer;transition:background .14s,color .14s}
.tab{padding:8px 16px;border:0;background:transparent;color:var(--sec);border-radius:999px;
     font:600 13px Poppins,sans-serif;cursor:pointer;transition:background .14s,color .14s}
.tab:hover{background:var(--apagado);color:var(--txt)}
.tab:hover{background:var(--apagado);color:var(--txt)}
.tab.on{background:var(--morado);color:#fff}
.busca{width:100%;border:1px solid var(--borde-fuerte);border-radius:999px;
       padding:9px 13px;font:400 13.5px Poppins,sans-serif;background:var(--lienzo);color:var(--txt);
       outline:none;transition:border-color .14s,box-shadow .14s;-webkit-appearance:none}
.busca:focus{border-color:var(--morado);box-shadow:var(--anillo)}
.busca:focus{border-color:var(--morado);box-shadow:var(--anillo)}
.dia{align-self:center;font:600 11px Poppins,sans-serif;color:var(--sec);
     letter-spacing:.04em;text-transform:capitalize;margin:10px 0 2px}
.aviso{align-self:center;font-size:11.5px;color:var(--sec);background:var(--apagado);
       padding:7px 15px;border-radius:999px;text-align:center;max-width:88%}
/* la bandeja dentro del shell */
#sec-conversaciones .bandeja{max-width:1180px;margin:14px auto;padding:0 22px}
#sec-conversaciones .marco{background:var(--tarjeta);border:1px solid var(--borde);
  border-radius:14px;box-shadow:var(--sombra);overflow:hidden}
#nada{display:none}
#hilo{position:fixed;inset:0;z-index:40;background:var(--tarjeta);display:none;flex-direction:column}
#hilo.abierto{display:flex}
@media(min-width:900px){
  #sec-conversaciones .marco{display:grid;grid-template-columns:360px 1fr;
    grid-template-rows:auto 1fr;grid-template-areas:"filtros hilo" "lista hilo";
    height:calc(100vh - 132px);min-height:460px}
  #sec-conversaciones .filtros{grid-area:filtros;border-right:1px solid var(--borde)}
  #lista{grid-area:lista;overflow-y:auto;border-right:1px solid var(--borde)}
  #nada,#hilo{grid-area:hilo}
  #hilo{position:static;min-width:0}
  #nada{display:grid;place-items:center;text-align:center;padding:40px;color:var(--sec);
        font-size:14px;line-height:1.7}
  #sec-conversaciones.split #nada{display:none}
  .volver{display:none}
}
@media(max-width:899px){
  #sec-conversaciones .bandeja{padding:0;margin:0}
  #sec-conversaciones .marco{border:0;border-radius:0;box-shadow:none}
}

/* compositor en dos pisos: modos arriba, texto abajo */
.comp{display:flex;flex-direction:column;align-items:stretch;gap:8px;padding:10px 12px;
      border-top:1px solid var(--borde);background:var(--tarjeta)}
.modos{display:flex;gap:6px}
.comp .mtab{border:0;background:var(--apagado);color:var(--sec);border-radius:999px;
      padding:5px 14px;width:auto;height:auto;font:600 12px Poppins,sans-serif;cursor:pointer}
.comp .mtab.on{background:var(--morado);color:#fff}
.comp.esnota .cfila textarea{background:var(--morado-tenue);border-color:var(--morado)}
.cfila{display:flex;gap:8px;align-items:flex-end}
.comp .cfila .ico{border:0;background:var(--apagado);color:var(--txt);border-radius:999px;
      width:40px;height:40px;cursor:pointer;font-size:16px;flex:none}
/* nota privada en el hilo */
.nota{align-self:center;max-width:82%;background:var(--morado-tenue);color:var(--txt);
      border:1px dashed var(--morado);border-radius:12px;padding:8px 13px;font-size:13px}
.nota .meta{display:block;font-size:10px;color:var(--sec);margin-top:4px}
/* acciones del hilo */
.acciones{display:flex;gap:6px;padding:8px 12px;border-bottom:1px solid var(--borde);
      background:var(--tarjeta)}
.acciones .ico{border:1px solid var(--borde-fuerte);background:var(--tarjeta);
      border-radius:999px;width:36px;height:36px;cursor:pointer;font-size:14px;
      display:grid;place-items:center;text-decoration:none;transition:border-color .14s}
.acciones .ico:hover{border-color:var(--morado)}
.acciones .ico.activo{background:var(--morado);border-color:var(--morado)}
.emojis{display:none;flex-wrap:wrap;gap:2px;padding:8px 12px;border-top:1px solid var(--borde);
      background:var(--tarjeta);max-height:120px;overflow-y:auto}
.emojis button{border:0;background:none;font-size:20px;cursor:pointer;padding:4px;border-radius:8px}
.emojis button:hover{background:var(--apagado)}
.gaveta{padding:12px 14px;border-bottom:1px solid var(--borde);background:var(--apagado);font-size:13px}
.gtit{font-weight:700;font-size:12px;margin-bottom:8px}
.gchips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.gchips .chip{cursor:pointer;border:0}
.gfila{display:flex;gap:8px;margin-top:4px}
.gfila input{flex:1;border:1px solid var(--borde-fuerte);border-radius:999px;padding:8px 13px;
      font:400 13px Poppins,sans-serif;background:var(--tarjeta);color:var(--txt);outline:none}
.gvacio{color:var(--sec);font-size:12px}
.ficha{font-size:13.5px}
.fficha{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--borde)}
.fficha:last-child{border-bottom:0}
.fficha span{color:var(--sec)}
`;

export const JS = String.raw`
let vista = 'conversaciones', estado = 'abiertas', orden = 'reciente', etiquetaFiltro = '';
let abierta = null, datos = { conversaciones: [], etiquetas: [] }, hiloActual = null;
let modo = 'responder', gaveta = null, enviando = false;

const EMOJIS = ['😊','👍','🙏','✨','🎉','❤️','👋','✅','😅','🔥','🙌','💪','🤝','😍','📍','💰',
                '📸','⏰','🎂','☕','🚗','📦','💬','😉','🥳','👏','🌟','😃','🤗','💡'];

const listaEtiquetas = c => (c.etiquetas || '').split(',').filter(Boolean);

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
  const urgentes = abiertas.filter(c => c.escalado || teToca(c)).length;
  const nBadge = document.getElementById('navUrge');
  if (nBadge) { nBadge.style.display = urgentes ? '' : 'none'; nBadge.textContent = urgentes; }

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
  document.getElementById('sec-conversaciones').classList.add('split');
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
  document.getElementById('sec-conversaciones').classList.remove('split');
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


SECCIONES.conversaciones = {
  _listo: false,
  init(){
    if (!this._listo) {
      this._listo = true;
      document.querySelectorAll('#sec-conversaciones .tab').forEach(t =>
        t.onclick = () => { vista = t.dataset.v; pinta(); });
      document.querySelectorAll('.mtab').forEach(t => t.onclick = () => cambiaModo(t.dataset.m));
      document.getElementById('busca').addEventListener('input', pinta);
      document.getElementById('fEstado').addEventListener('change', e => { estado = e.target.value; pinta(); });
      document.getElementById('fOrden').addEventListener('change', e => { orden = e.target.value; cargar(); });
      document.getElementById('fEtiqueta').addEventListener('change', e => { etiquetaFiltro = e.target.value; pinta(); });
      document.getElementById('txt').addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
      });
    }
    cargar();
  },
  cada(){ cargar(); refrescarHilo(); },
};
`;
