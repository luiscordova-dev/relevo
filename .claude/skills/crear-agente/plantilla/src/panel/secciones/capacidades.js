// Capacidades: todo lo que el agente sabe hacer, con su estado REAL.
// Tres tipos de tarjeta, una sola estructura (por eso se ven parejas):
//   · DE SERIE  — viene incluida y no se apaga (es la esencia del agente)
//   · SWITCH    — se enciende/apaga desde aquí, y el Worker lo respeta al momento
//   · CONECTA   — necesita algo externo; el botón copia el prompt para Claude Code

export const HTML = `
<div class="lienzo-seccion">
  <p class="cap-intro">
    Lo que tu agente sabe hacer, con su estado real. Los interruptores aplican
    <b>al momento</b> — sin republicar. Lo que necesita conectarse trae su
    <b>prompt listo</b>: cópialo y pégaselo a Claude Code en la carpeta de tu agente.</p>
  <div class="caps" id="capLista"></div>
</div>`;

export const CSS = `
.cap-intro{margin:0 0 4px;font-size:13.5px;color:var(--sec);max-width:72ch;line-height:1.6}
.cap-intro b{color:var(--txt)}
.caps{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px;margin-top:14px}
.cap{background:var(--tarjeta);border:1px solid var(--borde);border-radius:16px;
  padding:16px;box-shadow:var(--sombra);display:flex;flex-direction:column;gap:9px;
  transition:border-color .14s}
.cap:hover{border-color:var(--borde-fuerte)}
.cap.apagada{opacity:.72}
.cap-cab{display:flex;align-items:center;gap:9px}
.cap-cab .ic{font-size:18px}
.cap-cab b{font-family:var(--display);font-size:15.5px;font-weight:600;letter-spacing:-.1px}
.cap-cab .sw{margin-left:auto}
.cap-estado{margin-left:auto;font-size:10px;font-weight:700;letter-spacing:.05em;
  padding:3px 10px;border-radius:99px;flex:none}
.cap-estado.on{background:var(--morado-tenue);color:var(--morado)}
.cap-estado.off{background:var(--apagado);color:var(--sec)}
.cap p{margin:0;font-size:12.5px;color:var(--sec);line-height:1.55;flex:1}
.cap-pie{display:flex;align-items:center;gap:8px;min-height:34px}
.cap-pie .cap-estado{margin-left:0}
.cap-pie small{font-size:11px;color:var(--sec)}
`;

export const JS = String.raw`
SECCIONES.capacidades = {
  async init(){ this.cada(); },
  async cada(){
    const d = await api('flujo');
    this.datos = d;
    this.pintar(d);
  },

  pintar(d){
    const caps = d.caps || {};
    const locales = (d.herramientas||[]).filter(h => String(h.tool).startsWith('local:'));
    const kn = d.conocimiento || {};

    // Cada tarjeta: { ic, t, p } + uno de:
    //   serie: true                          → chip DE SERIE
    //   sw: 'clave'                          → interruptor (estado en caps[clave])
    //   prompt: '…'                          → botón copiar para Claude Code
    // El pie SIEMPRE existe: por eso las tarjetas miden lo mismo.
    const tarjetas = [
      { ic:'⚡', t:'Contesta 24/7', serie:true,
        p:'Vive en internet, no en una compu. Responde al momento, también en domingo.' },
      { ic:'🛡️', t:'No inventa. Nunca.', serie:true,
        p:'Si algo no está en tu información, lo dice y captura al interesado en vez de inventar.' },
      { ic:'🔔', t:'Captura y te avisa', serie:true, alerta: !d.canales.telegramAvisos,
        p:'Nombre + qué quiere → tarjeta en tu Telegram al momento, con evidencia de entrega.',
        prompt: d.canales.telegramAvisos ? null :
          'Configura los avisos de Telegram de mi agente Relevo: guíame a crear el bot con BotFather y guarda el token y mi chat_id como secretos.' },
      { ic:'🙋', t:'Te pasa el chat', serie:true,
        p:'Si piden una persona o hay queja: aviso urgente y el agente se calla ' + d.minutosPausa + ' min para que entres tú.' },

      { ic:'🎙️', t:'Entiende notas de voz', sw:'oido', on:caps.oido,
        p:'Transcribe los audios de tus clientes y responde a lo que dijeron. Apagado: les pide amablemente que escriban.' },
      { ic:'👁️', t:'Ve fotos', sw:'vista', on:caps.vista,
        p:'Le mandan una foto (producto, lista, comprobante) y la entiende, con los textos exactos.' },
      { ic:'⏰', t:'Recordatorios', sw:'recordatorios', on:caps.recordatorios,
        p:'Desde una conversación: "recuérdame este chat mañana" → te llega el aviso a Telegram.' },

      { ic:'🧰', t:'Usa herramientas', sw: d.composio ? 'herramientas' : null,
        on: caps.herramientas, conecta: !d.composio,
        p: d.composio
          ? 'Conectadas: ' + (d.herramientas||[]).map(h=>h.id).join(', ') + '. El interruptor las apaga todas de golpe.'
          : 'Agenda en tu calendario, escribe en Notion, avisa a Slack — 1,000+ apps vía Composio.',
        prompt: d.composio ? null :
          'Usa /conectar para conectarle a mi agente Relevo mi [Google Calendar / Notion / Slack] con Composio, y pruébalo de punta a punta.' },
      { ic:'📚', t:'Conocimiento (RAG)', sw: kn.activo || (kn.documentos > 0) ? 'conocimiento' : null,
        on: caps.conocimiento, conecta: !(kn.activo || kn.documentos > 0),
        p: (kn.activo || kn.documentos > 0)
          ? 'Busca en tus documentos el dato exacto antes de contestar. ' + (kn.trozos||0) + ' fragmentos indexados.'
          : 'Cárgale el menú completo, el catálogo de 200 productos o tus políticas: encuentra el dato exacto, sin inventar.',
        prompt: (kn.activo || kn.documentos > 0) ? null :
          'Usa /cargar-conocimiento: quiero cargarle a mi agente Relevo mi [menú / catálogo / políticas] — te paso el archivo y tú lo estructuras, lo indexas y lo pruebas.' },
      { ic:'📊', t:'Reporte diario', sw: d.reporteCorreo ? 'reporte' : null,
        on: caps.reporte, conecta: !d.reporteCorreo,
        p: d.reporteCorreo
          ? 'Cada noche por ' + String(d.reporteVia||'correo').toUpperCase() + ': cuánta gente escribió, interesados nuevos y qué quedó pendiente.'
          : 'Cada noche por correo: cuánta gente escribió, interesados nuevos y qué quedó pendiente.',
        prompt: d.reporteCorreo ? null :
          'Enciende el reporte diario por correo de mi agente Relevo: por Gmail vía Composio (o Resend), y mándame uno de prueba con su id como evidencia.' },

      { ic:'🛠️', t:'Capacidades propias', conecta: !locales.length, serie: locales.length > 0,
        p: locales.length
          ? locales.map(h=>'· '+h.para).join(' ')
          : 'Lógica de TU negocio: consultar un pedido, calcular un envío, checar inventario.',
        prompt:'Usa /agregar-capacidad: quiero que mi agente Relevo pueda [describe la capacidad], con su prueba incluida.' },
      { ic:'🎯', t:'Se evalúa solo', serie:true,
        p:'Corre sus 6 escenarios de calidad; si su modelo no da el ancho, prueba el suplente y se lo cambia.',
        prompt:'Corre /calidad en mi agente Relevo y aplica lo que recomiende.' },
    ];

    document.getElementById('capLista').innerHTML = tarjetas.map((c, i) => {
      const apagada = c.sw && c.on === false;
      const cab = c.sw
        ? '<label class="sw" title="' + (c.on ? 'Apagar' : 'Encender') + '">' +
          '<input type="checkbox" data-sw="' + c.sw + '"' + (c.on ? ' checked' : '') + '><i></i></label>'
        : '<span class="cap-estado ' + (c.conecta ? 'off' : 'on') + '">' +
          (c.conecta ? 'CONECTA' : 'DE SERIE') + '</span>';

      const pie = c.prompt
        ? '<button class="cap-prompt" data-p="' + esc(c.prompt) + '">' +
          '<b>&gt;_ DÍSELO A CLAUDE — copiar</b>' + esc(c.prompt) + '</button>'
        : (c.sw
          ? '<div class="cap-pie"><span class="cap-estado ' + (c.on ? 'on' : 'off') + '">' +
            (c.on ? 'ENCENDIDA' : 'APAGADA') + '</span><small>' +
            (c.on ? 'aplica en la siguiente respuesta' : 'el agente lo dice de frente, no ignora') +
            '</small></div>'
          : '<div class="cap-pie"><small>Parte del corazón del agente — no se apaga.</small></div>');

      return '<div class="cap' + (apagada ? ' apagada' : '') + '">' +
        '<div class="cap-cab"><span class="ic">' + c.ic + '</span><b>' + c.t + '</b>' + cab + '</div>' +
        '<p>' + c.p + '</p>' + pie + '</div>';
    }).join('');

    // switches → ajustes en caliente; al guardar se repinta TODO (flujo incluido)
    document.querySelectorAll('#capLista [data-sw]').forEach(sw => sw.onchange = async () => {
      sw.disabled = true;
      await post('ajustes', { ['cap_' + sw.dataset.sw]: sw.checked ? '1' : '0' });
      // Repintar con la verdad del servidor, no con lo que creemos que pasó.
      await this.cada();
      if (SECCIONES.flujo?.datos) SECCIONES.flujo.cada();
      if (SECCIONES.configuracion?.cada) SECCIONES.configuracion.cada();
    });

    document.querySelectorAll('#capLista .cap-prompt').forEach(b => b.onclick = async () => {
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
