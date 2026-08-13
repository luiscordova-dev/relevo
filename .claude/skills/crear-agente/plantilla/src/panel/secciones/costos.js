// Costos: cuánto gasta el agente, con el dato real de la API (neurons).

export const HTML = `
<div class="lienzo-seccion">
  <div class="tarjetas">
    <div class="kpi acento"><span class="et">💰 Total del mes</span><b id="cTotal">—</b>
      <span class="sub" id="cTotalSub"></span></div>
    <div class="kpi"><span class="et">📈 Proyección</span><b id="cProy">—</b>
      <span class="sub">si el mes sigue a este ritmo</span></div>
    <div class="kpi"><span class="et">🆓 Free tier</span><b id="cFree">—</b>
      <span class="sub">del límite gratis diario usado hoy</span></div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>Gasto por día</h3><span class="mini">últimos 30 días, en neurons</span></div>
    <div class="caja-cuerpo"><div class="barras" id="cBarras"></div></div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>En qué se va</h3><span class="mini" id="cExacto"></span></div>
    <div class="caja-cuerpo" id="cDesglose"></div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>Tope mensual</h3></div>
    <div class="caja-cuerpo">
      <p style="margin:0 0 10px;font-size:13.5px;color:var(--sec)">
        Al llegar al tope, tu agente <b style="color:var(--txt)">no se calla</b>: baja al
        modelo económico y sigue contestando. Sin sorpresas ni silencio.</p>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        <input id="cTope" type="number" min="0" step="1000" placeholder="ej. 300000"
          style="width:150px;border:1px solid var(--borde-fuerte);border-radius:999px;
          padding:9px 12px;font:inherit;background:var(--lienzo);color:var(--txt)">
        <span style="font-size:12.5px;color:var(--sec)">neurons/mes · vacío = sin tope</span>
        <button class="btn-tema" style="width:auto;padding:0 18px;font-weight:600;font-size:13px" id="cGuardar">Guardar</button>
        <span id="cTopeEstado" style="font-size:12px;color:var(--verde)"></span>
      </div>
    </div>
  </div>
</div>`;

export const JS = String.raw`
SECCIONES.costos = {
  async init(){
    this.cada();
    document.getElementById('cGuardar').onclick = async () => {
      const v = document.getElementById('cTope').value;
      await api('ajustes', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ tope_mensual_neurons: v || null }) });
      document.getElementById('cTopeEstado').textContent = '✓ guardado — aplica de inmediato';
      setTimeout(() => document.getElementById('cTopeEstado').textContent = '', 3000);
    };
  },
  async cada(){
    const d = await api('costos');
    document.getElementById('cTotal').textContent = usd(d.usd);
    document.getElementById('cTotalSub').textContent =
      nf(Math.round(d.neurons)) + ' neurons · ' + (d.exacto ? 'dato real de la API' : 'incluye estimados');
    document.getElementById('cProy').textContent = usd(d.proyeccionNeurons * 0.011 / 1000);
    const hoyIso = new Date().toISOString().slice(0,10);
    const hoy = (d.porDia||[]).find(x => x.dia === hoyIso);
    document.getElementById('cFree').textContent =
      Math.round(((hoy?.neurons)||0) / d.freeTierDiario * 100) + '%';
    if (d.topeNeurons) document.getElementById('cTope').value = d.topeNeurons;

    const dias = (d.porDia||[]).slice(-14);
    const max = Math.max(1, ...dias.map(x => x.neurons||0));
    document.getElementById('cBarras').innerHTML = dias.length ? dias.map(x =>
      '<div class="barra'+(x.dia===hoyIso?' hoy':'')+'">' +
      '<span class="v">'+nf(Math.round(x.neurons||0))+'</span>' +
      '<div class="palo" style="height:'+Math.max(6,(x.neurons||0)/max*84)+'px"></div>' +
      '<span class="d">'+x.dia.slice(5)+'</span></div>').join('')
      : '<div class="vacio-caja">Aún no hay gasto registrado.</div>';

    const filas = d.filas || [];
    const tot = filas.reduce((t,f) => t + (f.neurons||0), 0) || 1;
    document.getElementById('cExacto').textContent = '';
    document.getElementById('cDesglose').innerHTML = filas.length ? filas.map(f => {
      const pct = Math.round((f.neurons||0)/tot*100);
      const nombre = { cerebro:'🧠 Cerebro', oido:'🎙️ Oído', vista:'👁️ Vista', calidad:'🎯 Calidad' }[f.tipo] || f.tipo;
      return '<div style="margin-bottom:12px">' +
        '<div style="display:flex;font-size:13px;margin-bottom:4px">' +
        '<span style="font-weight:600">'+nombre+'</span>' +
        '<span style="color:var(--sec);margin-left:8px">'+f.modelo.split('/').pop()+'</span>' +
        '<span style="margin-left:auto;font-variant-numeric:tabular-nums">'+
          nf(Math.round(f.neurons||0))+' n · '+usd((f.neurons||0)*0.011/1000)+
          (f.exacto===0?' <i style="color:var(--ambar)">est.</i>':'')+'</span></div>' +
        '<div style="height:8px;background:var(--apagado);border-radius:99px;overflow:hidden">' +
        '<div style="height:100%;width:'+pct+'%;background:var(--morado);border-radius:99px"></div></div></div>';
    }).join('') : '<div class="vacio-caja">Cuando tu agente conteste, aquí ves en qué gasta.</div>';
  },
};
`;
