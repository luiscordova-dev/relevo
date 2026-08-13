// El flujo: la radiografía en vivo del agente. SVG a mano, datos de la tabla eventos.
//
// No es un diagrama de adorno: cada nodo abre su ficha REAL (drawer lateral) con
// su configuración, sus números de 30 días, su interruptor cuando se puede apagar,
// y el prompt para Claude cuando falta conectarlo.

export const HTML = `
<div class="lienzo-seccion">
  <p style="margin:0 0 6px;font-size:13.5px;color:var(--sec)">
    Así funciona tu agente por dentro, con la actividad real de los últimos 30 días.
    <b style="color:var(--txt)">Toca un nodo</b> para abrir su ficha, o
    <b style="color:var(--txt)">arrástralo</b> para acomodarlo a tu gusto.
    <a class="liga" href="javascript:SECCIONES.flujo.reacomodar()">acomodo original</a></p>
  <div class="caja" style="margin-top:10px">
    <div class="caja-cuerpo" style="overflow-x:auto">
      <svg id="fSvg" viewBox="0 0 980 480" style="min-width:760px;width:100%;height:auto"
           font-family="Poppins,sans-serif"></svg>
    </div>
  </div>
</div>

<div class="f-scrim" id="fScrim" hidden></div>
<div class="f-drawer" id="fDrawer" hidden>
  <div class="f-dr-cab">
    <h3 id="fDetTitulo"></h3>
    <label class="sw" id="fDetSw" hidden><input type="checkbox" id="fDetSwInput"><i></i></label>
    <button class="f-dr-x" id="fDetCerrar" aria-label="Cerrar">✕</button>
  </div>
  <div class="f-dr-cuerpo" id="fDetCuerpo"></div>
  <div class="f-dr-pie" id="fDetPie"></div>
</div>`;

export const CSS = `
.f-scrim{position:fixed;inset:0;background:rgba(19,22,40,.35);z-index:40}
/* display:flex le gana al hidden del navegador: hay que decirlo explícito.
   (Este bug ya mordió dos veces — si agregas un panel con display propio, repítelo.) */
.f-drawer[hidden],.f-scrim[hidden]{display:none}
.f-drawer{position:fixed;top:0;right:0;bottom:0;width:min(400px,92vw);z-index:41;color:var(--txt);
  background:var(--tarjeta);border-left:1px solid var(--borde);box-shadow:-16px 0 48px rgba(19,22,40,.18);
  display:flex;flex-direction:column;animation:f-entra .18s ease}
@keyframes f-entra{from{transform:translateX(24px);opacity:0}to{transform:none;opacity:1}}
.f-dr-cab{display:flex;align-items:center;gap:12px;padding:18px 20px;border-bottom:1px solid var(--borde)}
.f-dr-cab h3{font-family:var(--display);font-size:19px;font-weight:600;margin:0;flex:1}
.f-dr-x{border:0;background:none;color:var(--sec);font-size:16px;cursor:pointer;
  padding:6px 9px;border-radius:9px}
.f-dr-x:hover{background:var(--apagado);color:var(--txt)}
.f-dr-cuerpo{flex:1;overflow-y:auto;padding:18px 20px;font-size:13.5px;line-height:1.65;color:var(--txt)}
.f-dr-cuerpo .f-dato{display:flex;justify-content:space-between;gap:10px;padding:8px 0;
  border-bottom:1px solid var(--borde);font-size:13px}
.f-dr-cuerpo .f-dato:last-of-type{border-bottom:0}
.f-dr-cuerpo .f-dato b{font-variant-numeric:tabular-nums}
.f-dr-cuerpo p{margin:12px 0 0;color:var(--sec)}
.f-dr-pie{padding:14px 20px 18px;border-top:1px solid var(--borde);display:flex;
  flex-direction:column;gap:9px}
.f-dr-pie:empty{display:none}
`;

export const JS = String.raw`
SECCIONES.flujo = {
  datos: null,
  pos: null,
  abierto: null,

  async init(){
    // el acomodo del dueño se respeta entre visitas
    try { this.pos = JSON.parse(localStorage.getItem('flujo_pos')) || {}; }
    catch { this.pos = {}; }
    document.getElementById('fDetCerrar').onclick = () => this.cerrar();
    document.getElementById('fScrim').onclick = () => this.cerrar();
    document.getElementById('fDetSwInput').onchange = (e) => this.apagarEncender(e.target);
    this.cada();
  },

  async cada(){
    const d = await api('flujo');
    this.datos = d;
    this.render();
    // si la ficha está abierta, se actualiza con la verdad nueva
    if (this.abierto) this.detalle(this.abierto, true);
  },

  base(){
    const d = this.datos, c = d.conteos || {}, caps = d.caps || {};
    const kn = d.conocimiento || {};
    return [
      ['whatsapp', 20, 40, 190, '📱', 'WhatsApp', d.canales.whatsapp ? 'conectado' : 'sin conectar', d.canales.whatsapp],
      ['webhook', 20, 130, 190, '🔏', 'Webhook firmado', 'HMAC-SHA256 verificado', true],
      ['cerebro', 300, 82, 220, '🧠', 'Cerebro', (c.uso_cerebro||0)+' respuestas/30d', true],
      ['oido', 300, 300, 130, '🎙️', 'Oído', caps.oido ? (c.uso_oido||0)+' audios' : 'apagado', caps.oido],
      ['vista', 450, 300, 130, '👁️', 'Vista', caps.vista ? (c.uso_vista||0)+' fotos' : 'apagada', caps.vista],
      ['memoria', 600, 300, 150, '🗂️', 'Memoria', 'D1 · últimos 12 msgs', true],
      ['herr', 300, 390, 220, '🧰', 'Herramientas',
        !caps.herramientas ? 'apagadas' : (d.herramientas||[]).length + ' conectadas · ' + (c.herramienta||0) + ' usos',
        caps.herramientas && (d.herramientas||[]).length > 0],
      ['conoc', 560, 390, 200, '📚', 'Conocimiento', kn.activo
        ? kn.documentos + ' docs · ' + kn.trozos + ' fragmentos'
        : 'apagado', !!kn.activo],
      ['captura', 620, 40, 170, '🔔', 'Captura', (c.lead||0)+' interesados', true],
      ['escala', 620, 130, 170, '🔴', 'Escalación', (c.escalacion||0)+' pases a humano', true],
      ['telegram', 850, 82, 115, '📨', 'Telegram',
        !caps.avisos ? 'avisos apagados' : (d.canales.telegramAvisos ? 'avisos ON' : 'sin conectar'),
        caps.avisos && d.canales.telegramAvisos],
      ['respuesta', 620, 220, 170, '💬', 'Respuesta', 'al cliente por WhatsApp', true],
      ['reporte', 850, 220, 115, '📊', 'Reporte',
        !caps.reporte ? 'apagado' : (d.reporteCorreo ? String(d.reporteVia||'correo')+' ON' : 'sin conectar'),
        caps.reporte && d.reporteCorreo],
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

  // Arrastrar para acomodar; si casi no se movió, cuenta como clic y abre la ficha.
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
          this.render();   // ~13 nodos: redibujar completo es instantáneo
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

  // La ficha de cada nodo: qué es, sus números, su switch y su acción.
  ficha(id){
    const d = this.datos, c = d.conteos || {}, caps = d.caps || {};
    const kn = d.conocimiento || {};
    const dato = (k, v) => '<div class="f-dato"><span>' + k + '</span><b>' + v + '</b></div>';
    const F = {
      whatsapp: {
        t: '📱 WhatsApp',
        datos: dato('Estado', d.canales.whatsapp ? 'Conectado' : 'Sin conectar'),
        p: 'El canal de entrada. Los mensajes llegan por el webhook de Zernio, firmado y filtrado por tu cuenta — sin ese filtro contestaría mensajes de otros números.',
        prompt: d.canales.whatsapp ? null : 'Conecta WhatsApp a mi agente Relevo con Zernio: crea la llave, registra el webhook firmado y prueba con un mensaje real.' },
      webhook: {
        t: '🔏 Webhook firmado',
        datos: dato('Firma', 'HMAC-SHA256') + dato('Comparación', 'tiempo constante') +
               dato('Filtro', 'por account.id') + dato('Idempotencia', 'platformMessageId'),
        p: 'El endpoint es público, así que cada entrega se verifica antes de tocar nada: ' +
           'firma inválida → 401. La comparación es en tiempo constante para no filtrar por ' +
           'timing. Los webhooks de Zernio son <b>por cuenta, no por número</b>: sin el filtro ' +
           'de account.id, dos agentes tuyos se contestarían entre ellos (pasó de verdad). Y el ' +
           'platformMessageId hace la entrega idempotente: Zernio reintenta hasta 7 veces.' },
      cerebro: {
        t: '🧠 El cerebro',
        datos: dato('Modelo', esc(d.cerebroPropio ? ('llave propia · ' + d.cerebroPropio) : d.modelo.split('/').pop())) +
               dato('Respuestas / 30 días', c.uso_cerebro||0),
        p: 'Lee tu información + los últimos 12 mensajes, y nunca inventa: si no sabe, lo dice y captura al interesado.',
        prompt: 'Corre /calidad en mi agente Relevo y aplica lo que recomiende.' },
      oido: {
        t: '🎙️ Oído', sw: 'oido', on: caps.oido,
        datos: dato('Modelo', esc(d.modeloOido.split('/').pop())) + dato('Audios / 30 días', c.uso_oido||0),
        p: caps.oido ? 'Transcribe las notas de voz y el cerebro responde a lo que dijeron.'
          : 'Apagado: si mandan un audio, el agente pide con amabilidad que lo escriban.' },
      vista: {
        t: '👁️ Vista', sw: 'vista', on: caps.vista,
        datos: dato('Modelo', esc(d.modeloVista.split('/').pop())) + dato('Fotos / 30 días', c.uso_vista||0),
        p: caps.vista ? 'Describe las fotos que mandan, con los textos y precios exactos.'
          : 'Apagada: si mandan una foto, el agente pide que se lo cuenten con palabras.' },
      memoria: {
        t: '🗂️ Memoria',
        datos: dato('Dónde', 'tu base D1') + dato('Ventana', 'últimos 12 mensajes'),
        p: 'Cada conversación guarda su historial. El cerebro se acuerda del nombre y no pregunta dos veces lo mismo.' },
      conoc: {
        t: '📚 Conocimiento', sw: (kn.documentos > 0 || kn.activo) ? 'conocimiento' : null, on: caps.conocimiento,
        datos: dato('Documentos', kn.documentos||0) + dato('Fragmentos indexados', kn.trozos||0),
        p: kn.activo
          ? 'Antes de pensar, busca los 3-4 fragmentos que responden a la pregunta — solo esos entran a su cabeza.'
          : 'Con tu información actual no hace falta: va completa en el prompt. Se enciende al subir documentos.',
        prompt: (kn.documentos > 0 || kn.activo) ? null :
          'Usa /cargar-conocimiento: quiero cargarle a mi agente Relevo mi [menú / catálogo / políticas].' },
      herr: {
        t: '🧰 Herramientas', sw: d.composio ? 'herramientas' : null, on: caps.herramientas,
        datos: dato('Conectadas', (d.herramientas||[]).length) + dato('Usos / 30 días', c.herramienta||0),
        p: (d.herramientas||[]).length
          ? (d.herramientas||[]).map(h => '<b>' + esc(h.id) + '</b> — ' + esc(h.para)).join('<br>')
          : 'Sin herramientas todavía. Con /conectar le das acceso a tu calendario, Notion, Slack y 1,000+ apps.',
        prompt: d.composio ? null :
          'Usa /conectar para conectarle a mi agente Relevo mi [Google Calendar / Notion / Slack] con Composio, probado de punta a punta.' },
      captura: {
        t: '🔔 Captura',
        datos: dato('Interesados', c.lead||0) + dato('Evidencia', 'message_id de Telegram'),
        p: 'Nombre + qué quiere → se guarda y te llega la tarjeta a Telegram. Si el aviso fallara, el interesado NO se pierde: queda en el panel marcado.' },
      escala: {
        t: '🔴 Escalación',
        datos: dato('Pases a humano / 30 días', c.escalacion||0) + dato('Pausa al escalar', d.minutosPausa + ' min'),
        p: 'Si piden una persona o hay queja: aviso urgente y el agente se calla en ese chat para que entres tú. La pausa se ajusta en Configuración.' },
      telegram: {
        t: '📨 Telegram', sw: d.canales.telegramAvisos ? 'avisos' : null, on: caps.avisos,
        datos: dato('Estado', d.canales.telegramAvisos ? 'Conectado' : 'Sin conectar'),
        p: d.canales.telegramAvisos
          ? 'Cada aviso guarda el message_id que devuelve Telegram: sin id, cuenta como NO entregado.'
          : 'Sin conectar: los avisos no tienen a dónde llegar.',
        prompt: d.canales.telegramAvisos ? null :
          'Configura los avisos de Telegram de mi agente Relevo: guíame con BotFather y prueba que llegue un aviso con su message_id.' },
      respuesta: {
        t: '💬 Respuesta',
        datos: dato('Canal', 'WhatsApp vía Zernio') + dato('Pausa si contestas tú', d.horasPausaContestar + ' h'),
        p: 'La respuesta sale con su id de WhatsApp y se guarda. Al contestar tú desde el panel, el agente se calla en ese chat para no pisarte.' },
      reporte: {
        t: '📊 Reporte diario', sw: d.reporteCorreo ? 'reporte' : null, on: caps.reporte,
        datos: dato('Vía', d.reporteCorreo ? String(d.reporteVia||'—').toUpperCase() : '—') +
               dato('Cuándo', 'cada noche (cron)'),
        p: d.reporteCorreo
          ? 'El resumen del día por correo: cuánta gente escribió, interesados nuevos y qué quedó pendiente.'
          : 'Sin conectar. Sale por tu propio Gmail (Composio) o por Resend.',
        prompt: d.reporteCorreo ? null :
          'Enciende el reporte diario de mi agente Relevo por Gmail vía Composio (o Resend) y mándame uno de prueba con su id.' },
    };
    return F[id];
  },

  detalle(id, silencioso){
    const f = this.ficha(id);
    if (!f) return;
    this.abierto = id;
    document.getElementById('fDetTitulo').textContent = f.t;
    document.getElementById('fDetCuerpo').innerHTML = (f.datos || '') + '<p>' + f.p + '</p>';

    // el switch del nodo, cuando se puede apagar
    const swWrap = document.getElementById('fDetSw');
    const swInput = document.getElementById('fDetSwInput');
    swWrap.hidden = !f.sw;
    if (f.sw) { swInput.dataset.sw = f.sw; swInput.checked = !!f.on; swInput.disabled = false; }

    // la acción del pie, cuando falta conectar algo
    document.getElementById('fDetPie').innerHTML = f.prompt
      ? '<button class="cap-prompt" data-p="' + esc(f.prompt) + '">' +
        '<b>&gt;_ DÍSELO A CLAUDE — copiar</b>' + esc(f.prompt) + '</button>'
      : '';
    document.querySelectorAll('#fDetPie .cap-prompt').forEach(b => b.onclick = async () => {
      try { await navigator.clipboard.writeText(b.dataset.p); } catch {}
      const bb = b.querySelector('b'); const antes = bb.textContent;
      bb.textContent = '✓ COPIADO — pégaselo a Claude Code';
      setTimeout(() => bb.textContent = antes, 2200);
    });

    if (!silencioso) {
      document.getElementById('fScrim').hidden = false;
      document.getElementById('fDrawer').hidden = false;
    }
  },

  async apagarEncender(input){
    input.disabled = true;
    await post('ajustes', { ['cap_' + input.dataset.sw]: input.checked ? '1' : '0' });
    await this.cada();   // repinta el grafo Y la ficha con la verdad del servidor
    if (SECCIONES.capacidades?.datos) SECCIONES.capacidades.cada();
  },

  cerrar(){
    this.abierto = null;
    document.getElementById('fScrim').hidden = true;
    document.getElementById('fDrawer').hidden = true;
  },
};
`;
