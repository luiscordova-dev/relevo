// Conocimiento: los documentos que tu agente consulta cuando la información ya no
// cabe en su prompt. Menús, catálogos, políticas — lo que no se escribe en una lista.

export const HTML = `
<div class="lienzo-seccion">
  <div class="cn-cab">
    <div>
      <p class="cn-intro">
        Lo que tu agente sabe, más allá de su información base. Sube tu menú, tu catálogo
        o tus políticas: al guardarlos se indexan y en la siguiente respuesta ya los usa.</p>
    </div>
    <div class="cn-acciones">
      <button class="btn-sec" id="cnReindexar">Reindexar todo</button>
      <button class="btn-pri" id="cnNuevo">+ Documento</button>
    </div>
  </div>

  <div id="cnEstado"></div>

  <div class="cn-probador">
    <div class="cn-prob-cab">
      <b>Pruébalo aquí</b>
      <small>Pregúntale como si fueras un cliente. No gasta un mensaje de WhatsApp.</small>
    </div>
    <div class="cn-prob-fila">
      <input class="cn-campo" id="cnPregunta" placeholder="¿Cuánto cuesta…?" maxlength="300">
      <button class="btn-pri" id="cnPreguntar">Preguntar</button>
    </div>
    <div id="cnRespuesta"></div>
  </div>

  <div class="cn-lista" id="cnLista"></div>
</div>

<div class="cn-modal" id="cnModal" hidden>
  <div class="cn-caja">
    <div class="cn-caja-cab">
      <b id="cnModalTitulo">Documento nuevo</b>
      <button class="cn-x" id="cnCerrar" aria-label="Cerrar">✕</button>
    </div>
    <input class="cn-campo" id="cnTitulo" placeholder="Título — p. ej. Menú de temporada" maxlength="120">
    <textarea class="cn-campo cn-texto" id="cnContenido"
      placeholder="Pega aquí el contenido. Escríbelo como se lo explicarías a un empleado nuevo: un tema por párrafo, con sus precios y detalles."></textarea>
    <div class="cn-caja-pie">
      <span class="cn-hint" id="cnHint"></span>
      <button class="btn-pri" id="cnGuardar">Guardar e indexar</button>
    </div>
  </div>
</div>`;

export const CSS = `
.cn-cab{display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap}
.cn-intro{margin:0;font-size:13.5px;color:var(--sec);max-width:60ch;line-height:1.55}
.cn-acciones{margin-left:auto;display:flex;gap:8px;flex-shrink:0}

.cn-medidor{background:var(--tarjeta);border:1px solid var(--borde);border-radius:14px;
  padding:15px 17px;margin-top:16px;box-shadow:var(--sombra)}
.cn-medidor-fila{display:flex;align-items:baseline;gap:8px;margin-bottom:9px}
.cn-medidor-fila b{font-size:13px;letter-spacing:-.1px}
.cn-medidor-fila .cn-chip{margin-left:auto}
.cn-chip{font-size:10px;font-weight:700;letter-spacing:.05em;padding:3px 10px;border-radius:99px}
.cn-chip.on{background:var(--morado-tenue);color:var(--morado)}
.cn-chip.off{background:var(--apagado);color:var(--sec)}
.cn-barra{height:6px;background:var(--apagado);border-radius:99px;overflow:hidden}
.cn-barra i{display:block;height:100%;background:var(--morado);border-radius:99px;
  transition:width .3s ease}
.cn-barra i.lleno{background:var(--rojo)}
.cn-medidor small{display:block;margin-top:8px;font-size:11.5px;color:var(--sec);line-height:1.5}

.cn-probador{background:var(--tarjeta);border:1px solid var(--borde);border-radius:14px;
  padding:16px 17px;margin-top:14px;box-shadow:var(--sombra)}
.cn-prob-cab{display:flex;align-items:baseline;gap:9px;flex-wrap:wrap;margin-bottom:11px}
.cn-prob-cab b{font-size:13px;letter-spacing:-.1px}
.cn-prob-cab small{font-size:11.5px;color:var(--sec)}
.cn-prob-fila{display:flex;gap:8px}
.cn-prob-fila .cn-campo{flex:1}
.cn-burbuja{margin-top:13px;background:var(--morado-tenue);border-radius:12px 12px 12px 4px;
  padding:12px 14px;font-size:13.5px;line-height:1.55;color:var(--txt)}
.cn-fuentes{margin-top:10px;display:flex;flex-direction:column;gap:5px}
.cn-fuente{display:flex;gap:9px;align-items:baseline;font-size:11.5px;color:var(--sec);
  background:var(--lienzo);border:1px solid var(--borde);border-radius:9px;padding:7px 11px}
.cn-fuente i{font-style:normal;font-weight:700;color:var(--morado);font-size:10.5px;
  letter-spacing:.03em;flex-shrink:0}
.cn-fuente span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cn-sinfuente{margin-top:10px;font-size:11.5px;color:var(--sec)}

.cn-lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:16px}
.cn-doc{background:var(--tarjeta);border:1px solid var(--borde);border-radius:14px;
  padding:16px;box-shadow:var(--sombra);display:flex;flex-direction:column;gap:9px;
  transition:border-color .14s,transform .14s}
.cn-doc:hover{border-color:var(--borde-fuerte);transform:translateY(-1px)}
.cn-doc-cab{display:flex;align-items:center;gap:8px}
.cn-doc-cab b{font-size:14px;letter-spacing:-.1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cn-doc p{margin:0;font-size:12px;color:var(--sec);line-height:1.5;flex:1}
.cn-doc-pie{display:flex;gap:7px;align-items:center}
.cn-mini{font-size:11.5px;font-family:inherit;background:none;border:1px solid var(--borde);
  color:var(--sec);border-radius:8px;padding:5px 11px;cursor:pointer;transition:.14s}
.cn-mini:hover{border-color:var(--morado);color:var(--morado)}
.cn-mini.peligro:hover{border-color:var(--rojo);color:var(--rojo)}

.cn-vacio{grid-column:1/-1;text-align:center;padding:44px 24px;background:var(--tarjeta);
  border:1px dashed var(--borde-fuerte);border-radius:14px}
.cn-vacio .ic{font-size:30px;display:block;margin-bottom:10px;opacity:.7}
.cn-vacio b{display:block;font-size:14.5px;margin-bottom:5px}
.cn-vacio p{margin:0 auto;font-size:12.5px;color:var(--sec);max-width:44ch;line-height:1.55}

.cn-modal{position:fixed;inset:0;background:rgba(19,22,40,.55);backdrop-filter:blur(3px);
  display:flex;align-items:center;justify-content:center;padding:20px;z-index:60}
/* display:flex le gana al display:none implícito de [hidden]: hay que decirlo. */
.cn-modal[hidden]{display:none}
.cn-caja{background:var(--tarjeta);border:1px solid var(--borde);border-radius:16px;
  width:min(640px,100%);max-height:88vh;display:flex;flex-direction:column;gap:11px;padding:20px;
  box-shadow:0 24px 60px rgba(19,22,40,.28)}
.cn-caja-cab{display:flex;align-items:center}
.cn-caja-cab b{font-size:15px;letter-spacing:-.2px}
.cn-x{margin-left:auto;background:none;border:0;color:var(--sec);font-size:16px;cursor:pointer;
  padding:4px 8px;border-radius:8px}
.cn-x:hover{background:var(--apagado);color:var(--txt)}
.cn-campo{width:100%;background:var(--lienzo);border:1px solid var(--borde);border-radius:10px;
  padding:11px 13px;font:inherit;font-size:13.5px;color:var(--txt);outline:none}
.cn-campo:focus{border-color:var(--morado)}
.cn-texto{min-height:260px;resize:vertical;line-height:1.6;font-size:13px}
.cn-caja-pie{display:flex;align-items:center;gap:12px}
.cn-hint{font-size:11.5px;color:var(--sec);flex:1}
.cn-caja-pie .btn-pri{margin-left:auto}

@media(max-width:640px){
  .cn-acciones{margin-left:0;width:100%}
  .cn-acciones button{flex:1}
}
`;

export const JS = String.raw`
SECCIONES.conocimiento = {
  editando: null,
  async init(){
    document.getElementById('cnNuevo').onclick = () => this.abrir(null);
    document.getElementById('cnCerrar').onclick = () => this.cerrar();
    document.getElementById('cnGuardar').onclick = () => this.guardar();
    document.getElementById('cnModal').onclick = (e) => {
      if (e.target.id === 'cnModal') this.cerrar();
    };
    document.getElementById('cnReindexar').onclick = () => this.reindexar();
    document.getElementById('cnPreguntar').onclick = () => this.preguntar();
    document.getElementById('cnPregunta').onkeydown = (e) => { if (e.key === 'Enter') this.preguntar(); };
    this.cada();
  },

  async cada(){
    const d = await api('conocimiento');
    this.datos = d;
    this.pintarEstado(d);
    this.pintarLista(d);
  },

  pintarEstado(d){
    const cont = document.getElementById('cnEstado');

    // Sin índice el agente funciona igual; solo no puede consultar documentos.
    if (!d.disponible) {
      cont.innerHTML =
        '<div class="cn-medidor"><div class="cn-medidor-fila"><b>Conocimiento sin encender</b>' +
        '<span class="cn-chip off">SIN ÍNDICE</span></div>' +
        '<small>Tu agente contesta con su información base, que es suficiente para la mayoría ' +
        'de los negocios. Para subir documentos hace falta crear el índice de búsqueda.</small>' +
        '<button class="cap-prompt" style="margin-top:11px;width:100%" data-p="' +
        esc('Enciende el Conocimiento (RAG) de mi agente Relevo: crea el índice de Vectorize, agrega el binding KB a wrangler.jsonc y vuelve a publicar.') +
        '"><b>&gt;_ DÍSELO A CLAUDE — copiar</b>Enciende el Conocimiento (RAG) de mi agente Relevo: crea el índice de Vectorize, agrega el binding KB y vuelve a publicar.</button></div>';
      this.copiables();
      return;
    }

    const pct = Math.min(100, Math.round(d.infoBytes / d.umbral * 100));
    const kb = (n) => (n / 1000).toFixed(1) + ' KB';
    cont.innerHTML =
      '<div class="cn-medidor">' +
        '<div class="cn-medidor-fila"><b>Información base del agente</b>' +
          '<span class="cn-chip ' + (d.activo ? 'on' : 'off') + '">' +
          (d.activo ? 'BUSCANDO EN DOCUMENTOS' : 'TODO EN EL PROMPT') + '</span></div>' +
        '<div class="cn-barra"><i class="' + (d.infoGrande ? 'lleno' : '') + '" style="width:' + pct + '%"></i></div>' +
        '<small>' + kb(d.infoBytes) + ' de ' + kb(d.umbral) + '. ' +
        (d.infoGrande
          ? 'Pasó el punto en que conviene buscar en vez de mandarlo todo: tu agente ya consulta solo lo que necesita para cada pregunta.'
          : 'Cabe cómoda en el prompt, así que va completa en cada respuesta — lo más simple y lo más confiable. Los documentos que subas aquí sí se buscan.') +
        '</small></div>';
  },

  pintarLista(d){
    const cont = document.getElementById('cnLista');
    if (!d.documentos.length) {
      cont.innerHTML =
        '<div class="cn-vacio"><span class="ic">📚</span>' +
        '<b>Todavía no hay documentos</b>' +
        '<p>Sube tu menú completo, tu catálogo o tus políticas de cancelación. ' +
        'Lo que no cabe en una lista corta, vive aquí.</p></div>';
      return;
    }

    cont.innerHTML = d.documentos.map(doc => {
      const indexado = doc.trozos > 0;
      return '<div class="cn-doc">' +
        '<div class="cn-doc-cab"><b>' + esc(doc.titulo) + '</b>' +
          '<span class="cn-chip ' + (indexado ? 'on' : 'off') + '" style="margin-left:auto">' +
          (indexado ? doc.trozos + ' FRAGMENTOS' : 'SIN INDEXAR') + '</span></div>' +
        '<p>' + (doc.bytes / 1000).toFixed(1) + ' KB · ' +
          (indexado
            ? 'indexado ' + 'hace ' + cuando(doc.indexado_en)
            : 'guardado, pero el índice falló — vuelve a guardarlo') + '</p>' +
        '<div class="cn-doc-pie">' +
          '<button class="cn-mini" data-editar="' + doc.id + '">Editar</button>' +
          '<button class="cn-mini peligro" data-borrar="' + doc.id + '">Borrar</button>' +
        '</div></div>';
    }).join('');

    cont.querySelectorAll('[data-editar]').forEach(b =>
      b.onclick = () => this.abrir(Number(b.dataset.editar)));
    cont.querySelectorAll('[data-borrar]').forEach(b =>
      b.onclick = () => this.borrar(Number(b.dataset.borrar)));
  },

  async abrir(id){
    this.editando = id;
    document.getElementById('cnModalTitulo').textContent = id ? 'Editar documento' : 'Documento nuevo';
    document.getElementById('cnHint').textContent = '';
    const tit = document.getElementById('cnTitulo');
    const cnt = document.getElementById('cnContenido');
    tit.value = ''; cnt.value = '';

    if (id) {
      const d = await api('documento-leer?id=' + id);
      tit.value = d.titulo || '';
      cnt.value = d.contenido || '';
    }
    document.getElementById('cnModal').hidden = false;
    tit.focus();
  },

  cerrar(){ document.getElementById('cnModal').hidden = true; this.editando = null; },

  async guardar(){
    const titulo = document.getElementById('cnTitulo').value.trim();
    const contenido = document.getElementById('cnContenido').value.trim();
    const hint = document.getElementById('cnHint');
    if (!titulo || !contenido) { hint.textContent = 'Faltan el título o el contenido.'; return; }

    const btn = document.getElementById('cnGuardar');
    btn.disabled = true; hint.textContent = 'Indexando…';
    const r = await post('documento', { id: this.editando, titulo, contenido });
    btn.disabled = false;

    if (!r.ok) { hint.textContent = r.error || 'No se pudo guardar.'; return; }
    if (!r.indexado) {
      // Guardado ≠ indexado. Decirlo, en vez de dar por hecho que funcionó.
      hint.textContent = 'Guardado, pero el índice falló: ' + (r.error || 'razón desconocida');
      this.cada();
      return;
    }
    this.cerrar();
    this.cada();
  },

  async borrar(id){
    if (!confirm('¿Borrar este documento? Tu agente dejará de consultarlo.')) return;
    await post('documento', { id, borrar: true });
    this.cada();
  },

  async reindexar(){
    const btn = document.getElementById('cnReindexar');
    const antes = btn.textContent;
    btn.disabled = true; btn.textContent = 'Reindexando…';
    const r = await post('reindexar', {});
    const fallaron = (r.resultados || []).filter(x => !x.ok);
    btn.textContent = fallaron.length ? fallaron.length + ' fallaron' : '✓ Listo';
    btn.disabled = false;
    setTimeout(() => btn.textContent = antes, 2400);
    this.cada();
  },

  async preguntar(){
    const texto = document.getElementById('cnPregunta').value.trim();
    if (!texto) return;
    const btn = document.getElementById('cnPreguntar');
    const salida = document.getElementById('cnRespuesta');
    btn.disabled = true; salida.innerHTML = '<div class="cn-burbuja">Pensando…</div>';

    const r = await post('probar', { texto });
    btn.disabled = false;
    if (!r.ok) { salida.innerHTML = '<div class="cn-burbuja">' + esc(r.error || 'No se pudo probar.') + '</div>'; return; }

    // Enseñar de dónde salió la respuesta es la mitad del valor: si contestó mal,
    // aquí se ve si fue por el documento equivocado o por el modelo.
    const fuentes = (r.fragmentos || []).length
      ? '<div class="cn-fuentes">' + r.fragmentos.map(f =>
          '<div class="cn-fuente"><i>' + Math.round(f.score * 100) + '%</i>' +
          '<span>' + esc((f.titulo ? f.titulo + ' — ' : '') + f.texto.split('\n').filter(Boolean)[0]) +
          '</span></div>').join('') + '</div>'
      : '<p class="cn-sinfuente">Contestó con su información base: ningún documento salió relevante para esto.</p>';

    salida.innerHTML = '<div class="cn-burbuja">' + esc(r.respuesta) + '</div>' + fuentes;
  },

  copiables(){
    document.querySelectorAll('.cn-medidor .cap-prompt').forEach(b => b.onclick = async () => {
      try { await navigator.clipboard.writeText(b.dataset.p); } catch {}
      const bb = b.querySelector('b'); const antes = bb.textContent;
      bb.textContent = '✓ COPIADO — pégaselo a Claude Code';
      setTimeout(() => bb.textContent = antes, 2200);
    });
  },
};
`;
