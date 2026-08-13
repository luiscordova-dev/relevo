// Resumen: el estado del negocio de un vistazo. Todos los números salen de la base.

export const HTML = `
<div class="lienzo-seccion">
  <div class="tarjetas">
    <div class="kpi"><span class="et">💬 Mensajes</span><b id="rMsgs">—</b>
      <span class="sub">de clientes, últimas 24 h</span></div>
    <div class="kpi"><span class="et">📥 Conversaciones</span><b id="rConvs">—</b>
      <span class="sub">abiertas ahora</span></div>
    <div class="kpi acento"><span class="et">🔔 Interesados</span><b id="rLeads">—</b>
      <span class="sub">capturados en total</span></div>
    <div class="kpi"><span class="et">💰 Costo del mes</span><b id="rCosto">—</b>
      <span class="sub" id="rCostoSub">IA, dato real</span></div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>Actividad</h3><span class="mini">mensajes de clientes, últimos 7 días</span></div>
    <div class="caja-cuerpo"><div class="barras" id="rBarras"></div></div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>Conversaciones recientes</h3>
      <a class="liga der" href="#/conversaciones">ver todas →</a></div>
    <div id="rRecientes"></div>
  </div>
  <a class="r-lista" href="https://tally.so/r/EkGZoL?origen=panel" target="_blank" rel="noopener">
    <span>🎓</span>
    <b>Si quieres aprender a crear agentes de IA y automatizaciones con Claude Code
    en serio, anótate a la lista</b>
    <span class="r-lista-flecha">→</span>
  </a>
</div>`;

export const CSS = `
.r-lista{display:flex;align-items:center;gap:12px;margin-top:16px;padding:14px 18px;
  border:1px dashed var(--borde-fuerte);border-radius:14px;text-decoration:none;
  color:var(--sec);font-size:13px;line-height:1.5;transition:border-color .14s,color .14s}
.r-lista:hover{border-color:var(--morado);color:var(--txt)}
.r-lista b{font-weight:600;flex:1}
.r-lista-flecha{color:var(--morado);font-weight:700}
`;

export const JS = String.raw`
SECCIONES.resumen = {
  async init(){ this.cada(); },
  async cada(){
    const d = await api('resumen');
    document.getElementById('rMsgs').textContent = nf(d.mensajes24h);
    document.getElementById('rConvs').textContent = nf(d.conversacionesAbiertas);
    document.getElementById('rLeads').textContent = nf(d.leads);
    document.getElementById('rCosto').textContent = usd(d.costoMes.usd);
    document.getElementById('rCostoSub').textContent = d.costoMes.exacto
      ? nf(Math.round(d.costoMes.neurons)) + ' neurons · dato real'
      : 'incluye llave propia · estimado';

    // barras de los últimos 7 días (rellena los días sin actividad)
    const porDia = Object.fromEntries((d.actividad||[]).map(a => [a.dia, a.entrantes]));
    const dias = [];
    for (let i = 6; i >= 0; i--) {
      const f = new Date(Date.now() - i*86400000);
      const iso = f.toISOString().slice(0,10);
      dias.push({ iso, n: porDia[iso] || 0, hoy: i === 0,
        etiqueta: i === 0 ? 'hoy' : f.toLocaleDateString('es-MX',{weekday:'short'}) });
    }
    const max = Math.max(1, ...dias.map(x => x.n));
    document.getElementById('rBarras').innerHTML = dias.map(x =>
      '<div class="barra'+(x.hoy?' hoy':'')+'"><span class="v">'+x.n+'</span>' +
      '<div class="palo" style="height:'+Math.max(6, x.n/max*84)+'px"></div>' +
      '<span class="d">'+x.etiqueta+'</span></div>').join('');

    const rec = (d.recientes||[]).slice(0,6);
    document.getElementById('rRecientes').innerHTML = rec.length ? rec.map(c => {
      const nom = c.lead_nombre || c.nombre_contacto || c.telefono;
      const quien = c.ultimo_rol === 'cliente' ? '' : (c.ultimo_rol === 'dueño' ? 'Tú: ' : (d.agente||'Agente')+': ');
      return '<a class="fila" href="#/conversaciones" style="text-decoration:none;color:inherit">' +
        '<div class="ini">'+esc(ini(nom))+'</div><div class="cuerpo">' +
        '<div class="linea1"><span class="nom">'+esc(nom)+'</span>' +
        '<span class="hora">'+cuando(c.actualizado_en)+'</span></div>' +
        '<div class="prev">'+esc(quien+(c.ultimo_texto||'').slice(0,90))+'</div></div></a>';
    }).join('') :
      '<div class="vacio-caja"><b>Todavía no hay conversaciones.</b>' +
      'Cuando alguien le escriba a tu WhatsApp, aquí aparecen.</div>';
  },
};
`;
