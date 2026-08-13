// El flujo: la radiografía en vivo del agente. SVG a mano, datos de la tabla eventos.

export const HTML = `
<div class="lienzo-seccion">
  <p style="margin:0 0 6px;font-size:13.5px;color:var(--sec)">
    Así funciona tu agente por dentro, con la actividad real de los últimos 30 días.
    <b style="color:var(--txt)">Toca un nodo</b> para ver su configuración, o
    <b style="color:var(--txt)">arrástralo</b> para acomodarlo a tu gusto.
    <a class="liga" href="javascript:SECCIONES.flujo.reacomodar()">acomodo original</a></p>
  <div class="caja" style="margin-top:10px">
    <div class="caja-cuerpo" style="overflow-x:auto">
      <svg id="fSvg" viewBox="0 0 980 480" style="min-width:760px;width:100%;height:auto"
           font-family="Poppins,sans-serif"></svg>
    </div>
  </div>
  <div class="caja" id="fDetalle" style="display:none">
    <div class="caja-cab"><h3 id="fDetTitulo"></h3></div>
    <div class="caja-cuerpo" id="fDetCuerpo" style="font-size:13.5px"></div>
  </div>
</div>`;

export const JS = String.raw`
SECCIONES.flujo = {
  datos: null,
  pos: null,

  async init(){
    // el acomodo del dueño se respeta entre visitas
    try { this.pos = JSON.parse(localStorage.getItem('flujo_pos')) || {}; }
    catch { this.pos = {}; }
    this.cada();
  },

  async cada(){
    const d = await api('flujo');
    this.datos = d;
    this.render();
  },

  base(){
    const d = this.datos, c = d.conteos || {};
    return [
      ['whatsapp', 20, 40, 190, '📱', 'WhatsApp', d.canales.whatsapp ? 'conectado' : 'sin conectar', d.canales.whatsapp],
      ['webhook', 20, 130, 190, '🔏', 'Webhook firmado', 'HMAC verificado', true],
      ['cerebro', 300, 82, 220, '🧠', 'Cerebro', (c.uso_cerebro||0)+' respuestas/30d', true],
      ['oido', 300, 300, 130, '🎙️', 'Oído', (c.uso_oido||0)+' audios', true],
      ['vista', 450, 300, 130, '👁️', 'Vista', (c.uso_vista||0)+' fotos', true],
      ['memoria', 600, 300, 150, '🗂️', 'Memoria', 'D1 · últimos 12 msgs', true],
      ['herr', 300, 390, 220, '🧰', 'Herramientas', (d.herramientas||[]).length + ' conectadas · ' + (c.herramienta||0) + ' usos', (d.herramientas||[]).length > 0],
      ['conoc', 560, 390, 200, '📚', 'Conocimiento', (d.conocimiento && d.conocimiento.activo)
        ? d.conocimiento.documentos + ' docs · ' + d.conocimiento.trozos + ' fragmentos'
        : 'apagado', !!(d.conocimiento && d.conocimiento.activo)],
      ['captura', 620, 40, 170, '🔔', 'Captura', (c.lead||0)+' interesados', true],
      ['escala', 620, 130, 170, '🔴', 'Escalación', (c.escalacion||0)+' pases a humano', true],
      ['telegram', 850, 82, 115, '📨', 'Telegram', d.canales.telegramAvisos ? 'avisos ON' : 'sin conectar', d.canales.telegramAvisos],
      ['respuesta', 620, 220, 170, '💬', 'Respuesta', 'al cliente por WhatsApp', true],
      ['reporte', 850, 220, 115, '📊', 'Reporte', d.reporteCorreo ? 'correo ON' : 'apagado', d.reporteCorreo],
    ];
  },

  render(){
    const nodos = this.base();
    // posición: la del dueño si movió el nodo; si no, la de fábrica
    const pos = {};
    for (const [id,x,y,w] of nodos.map(n => [n[0],n[1],n[2],n[3]])) {
      const p = this.pos[id];
      pos[id] = { x: p?.x ?? x, y: p?.y ?? y, w };
    }
    this._pos = pos;

    const linea = (a, b, punteada) => {
      const A = pos[a], B = pos[b];
      const ax = A.x + A.w, ay = A.y + 28, bx = B.x, by = B.y + 28;
      return '<path d="M'+ax+' '+ay+' C '+(ax+44)+' '+ay+', '+(bx-44)+' '+by+', '+bx+' '+by+
        '" fill="none" stroke="var(--borde-fuerte)" stroke-width="1.6"'+
        (punteada ? ' stroke-dasharray="4 4"' : '')+'/>';
    };
    let svg =
      linea('whatsapp','cerebro') + linea('webhook','cerebro') +
      linea('cerebro','captura') + linea('cerebro','escala') + linea('cerebro','respuesta') +
      linea('captura','telegram') + linea('escala','telegram') + linea('respuesta','reporte', true) +
      linea('oido','cerebro', true) + linea('vista','cerebro', true) +
      linea('memoria','cerebro', true) + linea('herr','cerebro', true) +
      linea('conoc','cerebro', true);

    svg += nodos.map(([id,,,w,ic,t,s,on]) => {
      const { x, y } = pos[id];
      return '<g class="fnodo" data-id="'+id+'" style="cursor:grab">' +
      '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="56" rx="14" fill="var(--tarjeta)" ' +
        'stroke="'+(on ? 'var(--morado)' : 'var(--borde-fuerte)')+'" stroke-width="'+(on?2:1.4)+'"' +
        (on?'':' stroke-dasharray="5 4"')+'/>' +
      (on ? '<circle cx="'+(x+w-14)+'" cy="'+(y+14)+'" r="4" fill="var(--verde)"/>' : '') +
      '<text x="'+(x+14)+'" y="'+(y+25)+'" font-size="15">'+ic+'</text>' +
      '<text x="'+(x+38)+'" y="'+(y+25)+'" font-size="13" font-weight="700" fill="var(--txt)">'+t+'</text>' +
      '<text x="'+(x+14)+'" y="'+(y+44)+'" font-size="10.5" fill="var(--sec)">'+s+'</text></g>';
    }).join('');

    const el = document.getElementById('fSvg');
    el.innerHTML = svg;
    this.arrastre(el);
  },

  // Arrastrar para acomodar; si casi no se movió, cuenta como clic y abre el detalle.
  arrastre(svgEl){
    const aSvg = (ev) => {
      const pt = svgEl.createSVGPoint();
      pt.x = ev.clientX; pt.y = ev.clientY;
      return pt.matrixTransform(svgEl.getScreenCTM().inverse());
    };
    svgEl.querySelectorAll('.fnodo').forEach(n => {
      n.onpointerdown = (ev) => {
        const id = n.dataset.id, p0 = aSvg(ev), inicio = { ...this._pos[id] };
        let movio = false;
        try { n.setPointerCapture(ev.pointerId); } catch {}
        n.style.cursor = 'grabbing';
        n.onpointermove = (e2) => {
          const p = aSvg(e2);
          const dx = p.x - p0.x, dy = p.y - p0.y;
          if (Math.abs(dx) + Math.abs(dy) > 4) movio = true;
          if (!movio) return;
          this._pos[id].x = Math.max(0, Math.min(980 - this._pos[id].w, inicio.x + dx));
          this._pos[id].y = Math.max(0, Math.min(480 - 56, inicio.y + dy));
          this.pos[id] = { x: this._pos[id].x, y: this._pos[id].y };
          this.render();   // ~12 nodos: redibujar completo es instantáneo
          // el capture se pierde al redibujar: retomarlo en el nodo nuevo
          const nn = document.querySelector('.fnodo[data-id="'+id+'"]');
          if (nn && nn !== n) {
            this.arrastre(document.getElementById('fSvg'));
            try { nn.setPointerCapture(e2.pointerId); } catch {}
            nn.onpointermove = n.onpointermove; nn.onpointerup = n.onpointerup;
          }
        };
        n.onpointerup = () => {
          n.style.cursor = 'grab';
          if (movio) localStorage.setItem('flujo_pos', JSON.stringify(this.pos));
          else this.detalle(id);
          n.onpointermove = n.onpointerup = null;
        };
      };
    });
  },

  reacomodar(){
    this.pos = {};
    localStorage.removeItem('flujo_pos');
    this.render();
  },

  detalle(id){
    const d = this.datos, c = d.conteos || {};
    const M = {
      whatsapp: ['📱 WhatsApp', 'El canal de entrada. Los mensajes de tus clientes llegan por el webhook de Zernio, firmado y filtrado por tu cuenta (sin ese filtro, contestaría mensajes de otros números).'],
      webhook: ['🔏 Webhook firmado', 'Cada entrega se verifica con HMAC-SHA256 en tiempo constante. Firma inválida → rechazada con 401. Mensaje repetido (reintento) → ignorado: nunca contesta dos veces.'],
      cerebro: ['🧠 El cerebro', 'Modelo: <b>' + esc(d.cerebroPropio ? ('llave propia · ' + d.cerebroPropio) : d.modelo.split('/').pop()) + '</b><br>Respuestas en 30 días: <b>' + (c.uso_cerebro||0) + '</b><br>Lee tu información de negocio + los últimos 12 mensajes, y nunca inventa: si no sabe, captura al interesado.'],
      oido: ['🎙️ Oído', 'Modelo: ' + esc(d.modeloOido.split('/').pop()) + '. Transcribe las notas de voz y el cerebro responde a lo que dijeron. Audios en 30 días: <b>' + (c.uso_oido||0) + '</b>'],
      vista: ['👁️ Vista', 'Modelo: ' + esc(d.modeloVista.split('/').pop()) + '. Describe las fotos que mandan (productos, comprobantes, listas). Fotos en 30 días: <b>' + (c.uso_vista||0) + '</b>'],
      memoria: ['🗂️ Memoria', 'Cada conversación guarda su historial en tu base D1. El cerebro ve los últimos 12 mensajes: se acuerda del nombre y no pregunta dos veces lo mismo.'],
      conoc: ['📚 Conocimiento', (d.conocimiento && d.conocimiento.activo)
        ? 'Antes de pensar, el agente busca en tus documentos los 3-4 fragmentos que responden a la pregunta, y solo esos entran a su cabeza. ' +
          d.conocimiento.documentos + ' documento(s), ' + d.conocimiento.trozos + ' fragmentos indexados.'
        : 'Apagado. Con tu información actual no hace falta: va completa en el prompt, que es más simple y más confiable. Se enciende solo cuando subes documentos en la pestaña Conocimiento.'],
      herr: ['🧰 Herramientas', (d.herramientas||[]).length
        ? (d.herramientas||[]).map(h => '<b>' + esc(h.id) + '</b> → ' + esc(h.tool) + '<br><span style="color:var(--sec)">' + esc(h.para) + '</span>').join('<br><br>')
        : 'Sin herramientas conectadas todavía. Con <b>/conectar</b> le das acceso a tu calendario, Notion, Slack y 1000+ apps vía Composio.'],
      captura: ['🔔 Captura', 'Cuando alguien da su nombre y qué quiere, se guarda en tu base y te llega la tarjeta a Telegram. Interesados capturados: <b>' + (c.lead||0) + '</b>. Si el aviso fallara, el interesado NO se pierde: queda en el panel marcado.'],
      escala: ['🔴 Escalación', 'Si piden una persona o hay queja: aviso urgente + el agente se calla ' + d.minutosPausa + ' min en ese chat para que entres tú. Pases a humano: <b>' + (c.escalacion||0) + '</b>'],
      telegram: ['📨 Telegram', d.canales.telegramAvisos ? 'Conectado. Cada aviso guarda el message_id que devuelve Telegram: si no hay id, cuenta como NO entregado.' : 'Sin conectar. Los avisos no tienen a dónde llegar.'],
      respuesta: ['💬 Respuesta', 'La respuesta sale por la API de Zernio y se guarda con su id de WhatsApp. Al contestar tú desde el panel, el agente se pausa ' + d.horasPausaContestar + ' h en ese chat.'],
      reporte: ['📊 Reporte diario', d.reporteCorreo ? 'Activo: cada noche llega el resumen del día por correo.' : 'Apagado. Se enciende conectando Resend (pídeselo a Claude: son 3 minutos).'],
    };
    const [t, cuerpo] = M[id] || [id, ''];
    document.getElementById('fDetalle').style.display = 'block';
    document.getElementById('fDetTitulo').textContent = t;
    document.getElementById('fDetCuerpo').innerHTML = cuerpo;
  },
};
`;
