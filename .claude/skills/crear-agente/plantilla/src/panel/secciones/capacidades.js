// Capacidades: todo lo que el agente sabe hacer, con su estado REAL — y cuando algo
// se cambia con Claude, la tarjeta trae el prompt listo para copiárselo.

export const HTML = `
<div class="lienzo-seccion">
  <p style="margin:0 0 4px;font-size:13.5px;color:var(--sec)">
    Lo que tu agente sabe hacer, con su estado real en <i>este</i> agente.
    Lo que se configura con Claude trae su <b style="color:var(--txt)">prompt listo</b>:
    cópialo y pégaselo a Claude Code en la carpeta de tu agente.</p>
  <div class="caps" id="capLista"></div>
</div>`;

export const CSS = `
.caps{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px;margin-top:14px}
.cap{background:var(--tarjeta);border:1px solid var(--borde);border-radius:14px;
  padding:16px;box-shadow:var(--sombra);display:flex;flex-direction:column;gap:8px}
.cap-cab{display:flex;align-items:center;gap:8px}
.cap-cab .ic{font-size:18px}
.cap-cab b{font-size:14px;letter-spacing:-.1px}
.cap-estado{margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.05em;
  padding:3px 10px;border-radius:99px}
.cap-estado.on{background:var(--morado-tenue);color:var(--morado)}
.cap-estado.off{background:var(--apagado);color:var(--sec)}
.cap p{margin:0;font-size:12.5px;color:var(--sec);line-height:1.5;flex:1}
.cap .dato{font-size:12px;color:var(--txt);font-weight:600}
.cap-prompt{border:1px dashed var(--borde-fuerte);background:var(--lienzo);border-radius:10px;
  padding:8px 11px;font-size:11.5px;color:var(--sec);cursor:pointer;text-align:left;
  font-family:inherit;transition:border-color .14s}
.cap-prompt:hover{border-color:var(--morado);color:var(--txt)}
.cap-prompt b{color:var(--morado);font-size:10.5px;letter-spacing:.05em;display:block;margin-bottom:3px}
`;

export const JS = String.raw`
SECCIONES.capacidades = {
  async init(){ this.cada(); },
  async cada(){
    const d = await api('flujo');
    const locales = (d.herramientas||[]).filter(h => String(h.tool).startsWith('local:'));
    const composio = (d.herramientas||[]).filter(h => !String(h.tool).startsWith('local:'));

    const caps = [
      { ic:'⚡', t:'Contesta 24/7', on:true, est:'ACTIVO',
        p:'Vive en internet, no en una compu. Responde al momento, también en domingo.' },
      { ic:'🎙️', t:'Entiende notas de voz', on:true, est:'ACTIVO',
        p:'Transcribe los audios de tus clientes y responde a lo que dijeron.' },
      { ic:'👁️', t:'Ve fotos', on:true, est:'ACTIVO',
        p:'Le mandan una foto (producto, lista, comprobante) y la entiende, con los textos exactos.' },
      { ic:'🛡️', t:'No inventa. Nunca.', on:true, est:'ACTIVO',
        p:'Si algo no está en tu información, lo dice y captura al interesado en vez de inventar.' },
      { ic:'🔔', t:'Captura y te avisa', on:d.canales.telegramAvisos, est:d.canales.telegramAvisos?'ACTIVO':'CONECTA',
        p:'Nombre + qué quiere → tarjeta en tu Telegram al momento, con evidencia de entrega.',
        prompt: d.canales.telegramAvisos ? null :
          'Configura los avisos de Telegram de mi agente Relevo: guíame a crear el bot con BotFather y guarda el token y mi chat_id como secretos.' },
      { ic:'🙋', t:'Te pasa el chat', on:true, est:'ACTIVO',
        p:'Si piden una persona o hay queja: aviso urgente y el agente se calla ' + d.minutosPausa + ' min para que entres tú.',
        prompt:'Cambia cuándo escala mi agente Relevo: quiero que también me pase el chat cuando pregunten por [tema].' },
      { ic:'🧰', t:'Usa herramientas', on:(d.herramientas||[]).length>0,
        est:(d.herramientas||[]).length ? (d.herramientas||[]).length+' ACTIVAS' : 'CONECTA',
        p: composio.length || locales.length
          ? 'Conectadas: ' + (d.herramientas||[]).map(h=>h.id).join(', ') + '.'
          : 'Agenda en tu calendario, escribe en Notion, avisa a Slack — 1000+ apps vía Composio.',
        prompt:'Usa /conectar para conectarle a mi agente Relevo mi [Google Calendar / Notion / Slack] con Composio, y pruébalo de punta a punta.' },
      { ic:'🛠️', t:'Capacidades propias', on:locales.length>0,
        est: locales.length ? locales.length+' PROPIAS' : 'AGREGA',
        p: locales.length ? locales.map(h=>'· '+h.para).join(' ') :
          'Lógica de TU negocio: consultar un pedido, calcular un envío, checar inventario.',
        prompt:'Usa /agregar-capacidad: quiero que mi agente Relevo pueda [describe la capacidad], con su prueba incluida.' },
      { ic:'📚', t:'Conocimiento (RAG)', on:!!(d.conocimiento && d.conocimiento.activo),
        est:(d.conocimiento && d.conocimiento.activo) ? d.conocimiento.documentos+' DOCS' : 'CARGA',
        p:(d.conocimiento && d.conocimiento.activo)
          ? 'Busca en tus documentos el dato exacto antes de contestar. ' + d.conocimiento.trozos + ' fragmentos indexados.'
          : 'Cárgale el menú completo, el catálogo de 200 productos o tus políticas: encuentra el dato exacto, sin inventar.',
        prompt:(d.conocimiento && d.conocimiento.activo) ? null :
          'Usa /cargar-conocimiento: quiero cargarle a mi agente Relevo mi [menú / catálogo / políticas] — te paso el archivo y tú lo estructuras, lo indexas y lo pruebas.' },
      { ic:'⏰', t:'Recordatorios', on:true, est:'ACTIVO',
        p:'Desde una conversación: "recuérdame este chat mañana" → te llega el aviso a Telegram.' },
      { ic:'📊', t:'Reporte diario', on:d.reporteCorreo, est:d.reporteCorreo?'ACTIVO':'CONECTA',
        p:'Cada noche por correo: cuánta gente escribió, interesados nuevos y qué quedó pendiente.',
        prompt: d.reporteCorreo ? null :
          'Enciende el reporte diario por correo de mi agente Relevo: guíame a crear la cuenta de Resend y configura RESEND_API_KEY y CORREO_DUENO.' },
      { ic:'🎯', t:'Se evalúa solo', on:true, est:'ACTIVO',
        p:'Corre sus 6 escenarios de calidad; si su modelo no da el ancho, prueba el suplente y se lo cambia.',
        prompt:'Corre /calidad en mi agente Relevo y aplica lo que recomiende.' },
      { ic:'🩺', t:'Se puede auditar', on:true, est:'SKILL',
        p:'Semáforo de seguridad y costos con los datos reales: firma del webhook, secretos, gasto por modelo.',
        prompt:'Corre /auditoria en mi agente Relevo y aplica los arreglos que salgan, uno por uno.' },
    ];

    document.getElementById('capLista').innerHTML = caps.map(c =>
      '<div class="cap"><div class="cap-cab"><span class="ic">'+c.ic+'</span><b>'+c.t+'</b>' +
      '<span class="cap-estado '+(c.on?'on':'off')+'">'+c.est+'</span></div>' +
      '<p>'+c.p+'</p>' +
      (c.prompt
        ? '<button class="cap-prompt" data-p="'+esc(c.prompt)+'">' +
          '<b>&gt;_ DÍSELO A CLAUDE — copiar</b>'+esc(c.prompt)+'</button>'
        : '') +
      '</div>').join('');

    document.querySelectorAll('.cap-prompt').forEach(b => b.onclick = async () => {
      try { await navigator.clipboard.writeText(b.dataset.p); }
      catch { const t = document.createElement('textarea'); t.value = b.dataset.p;
        document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
      const bb = b.querySelector('b'); const antes = bb.textContent;
      bb.textContent = '✓ COPIADO — pégaselo a Claude Code';
      setTimeout(() => bb.textContent = antes, 2200);
    });
  },
};
`;
