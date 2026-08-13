// Configuración: lo que el dueño ajusta sin redesplegar. Se guarda en D1 y el
// agente lo lee en caliente.

export const HTML = `
<div class="lienzo-seccion">
  <div class="caja" style="margin-top:0">
    <div class="caja-cab"><h3>Tu agente</h3><span class="mini" id="cfNegocio"></span></div>
    <div class="caja-cuerpo" id="cfAgente" style="font-size:13.5px"></div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>Cuando tomas el control</h3></div>
    <div class="caja-cuerpo">
      <p class="cf-p">Al contestar tú desde el panel, el agente se calla en ese chat para
      no pisarte. ¿Por cuánto tiempo?</p>
      <div class="cf-opciones" data-clave="horas_pausa_al_contestar">
        <button data-v="1">1 hora</button><button data-v="3">3 horas</button>
        <button data-v="8">8 horas</button><button data-v="24">Hasta mañana</button>
      </div>
    </div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>Antes de contestar</h3></div>
    <div class="caja-cuerpo">
      <p class="cf-p">La gente escribe en ráfaga: "hola" · "oye" · "cuánto cuesta X".
      El agente espera un poco y los junta en una sola respuesta, en vez de contestar
      tres veces descoordinado.</p>
      <div class="cf-opciones" data-clave="segundos_buffer">
        <button data-v="0">Sin espera</button><button data-v="10">10 s</button>
        <button data-v="20">20 s</button><button data-v="40">40 s</button>
      </div>
    </div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>Cuando alguien pide un humano</h3></div>
    <div class="caja-cuerpo">
      <p class="cf-p">El agente te avisa 🔴 y se calla en ese chat mientras llegas.</p>
      <div class="cf-opciones" data-clave="minutos_pausa_escalacion">
        <button data-v="30">30 min</button><button data-v="60">1 hora</button>
        <button data-v="180">3 horas</button><button data-v="480">8 horas</button>
      </div>
    </div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>Canales y avisos</h3>
      <span class="mini">las piezas fijas — los interruptores aplican al momento</span></div>
    <div class="caja-cuerpo" id="cfPiezas"></div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>Apps de tu agente</h3>
      <span class="mini">lo que puede usar para HACER cosas</span>
      <span class="der" id="cfAppsMaster"></span></div>
    <div class="caja-cuerpo">
      <div class="cf-catalogo" id="cfCatalogo"></div>
      <p class="cf-mas">…y 1,000+ apps más vía Composio. El código de referencia está en
      <b>src/avanzado/</b> de tu agente; la ruta guiada, con método y soporte, en el
      workshop.</p>
    </div>
  </div>

  <div class="caja">
    <div class="caja-cab"><h3>Para cambiar lo demás, díselo a Claude</h3></div>
    <div class="caja-cuerpo">
      <p class="cf-p">Tu agente se modifica <b style="color:var(--txt)">conversando</b>:
      abre Claude Code en la carpeta de tu agente, pega uno de estos (o escribe el tuyo
      en español) y Claude hace el cambio, lo publica y lo prueba. Aquí lo ves reflejado.</p>
      <div class="cf-prompts" id="cfPrompts"></div>
    </div>
  </div>
</div>`;

export const CSS = `
.cf-p{margin:0 0 12px;font-size:13.5px;color:var(--sec)}
.cf-opciones{display:flex;gap:8px;flex-wrap:wrap}
.cf-opciones button{border:1px solid var(--borde-fuerte);background:var(--tarjeta);
  color:var(--txt);border-radius:999px;padding:9px 17px;font:600 13px Poppins,sans-serif;
  cursor:pointer;transition:.14s}
.cf-opciones button:hover{border-color:var(--morado);color:var(--morado)}
.cf-opciones button.on{background:var(--morado);color:#fff;border-color:var(--morado)}
.cf-linea{display:flex;align-items:center;gap:11px;padding:11px 0;font-size:13.5px;
  border-bottom:1px solid var(--borde)}
.cf-linea:last-child{border-bottom:0}
.cf-linea .ic{font-size:17px;flex:none;width:22px;text-align:center}
.cf-linea .nom{flex:1;min-width:0}
.cf-linea .nom b{display:block;font-size:13.5px;font-weight:600;letter-spacing:-.1px}
.cf-linea .nom small{display:block;font-size:11.5px;color:var(--sec);margin-top:1px}
.cf-linea .ctrl{display:flex;align-items:center;gap:10px;flex:none}
.estado{font-size:10.5px;font-weight:700;letter-spacing:.04em;padding:3px 10px;
  border-radius:99px;white-space:nowrap}
.estado.si{background:var(--morado-tenue);color:var(--morado)}
.estado.no{background:var(--apagado);color:var(--sec)}
.cf-prompts{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.cf-catalogo{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
.cf-app{display:flex;align-items:center;gap:11px;border:1px solid var(--borde);
  border-radius:13px;padding:11px 13px}
.cf-app .ic{font-size:18px;flex:none}
.cf-app .nom{flex:1;min-width:0}
.cf-app .nom b{display:block;font-size:12.5px;letter-spacing:-.1px;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.cf-app .nom small{display:block;font-size:10.5px;color:var(--sec);margin-top:1px;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.cf-app .btn-sec{padding:6px 13px;font-size:11.5px;border-radius:9px;flex:none}
.cf-mas{margin:12px 0 0;font-size:11.5px;color:var(--sec);line-height:1.6}
`;

export const JS = String.raw`
SECCIONES.configuracion = {
  async init(){
    const [aj, fl] = await Promise.all([api('ajustes'), api('flujo')]);
    document.getElementById('cfNegocio').textContent =
      aj.negocio.nombre + ' · zona ' + aj.zonaHoraria;
    document.getElementById('cfAgente').innerHTML =
      'Tu agente se llama <b>' + esc(aj.negocio.agente) + '</b>, habla en tono <b>' +
      esc(aj.negocio.tono) + '</b> y contesta con la información que le cargaste.';

    const marcar = (cont, valor) => {
      cont.querySelectorAll('button').forEach(b =>
        b.classList.toggle('on', b.dataset.v === String(valor)));
    };
    document.querySelectorAll('.cf-opciones').forEach(cont => {
      const clave = cont.dataset.clave;
      const porDefecto = { horas_pausa_al_contestar: fl.horasPausaContestar,
        minutos_pausa_escalacion: fl.minutosPausa, segundos_buffer: fl.segundosBuffer };
      // ?? y no ||: "0" es un valor válido (sin espera), no un vacío.
      const actual = aj.ajustes[clave] ?? porDefecto[clave];
      marcar(cont, actual);
      cont.querySelectorAll('button').forEach(b => b.onclick = async () => {
        await api('ajustes', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ [clave]: b.dataset.v }) });
        marcar(cont, b.dataset.v);
      });
    });

    // ── Canales y avisos: las piezas fijas del agente ──────────────────────
    // Una fila = un icono, su nombre con la explicación debajo, y UN control a
    // la derecha (interruptor si se puede apagar, botón si falta conectar,
    // etiqueta si no hay nada que hacer). Nunca los tres a la vez.
    const caps = fl.caps || {};
    const fila = ({ ic, nombre, detalle, ok, sw, on, prompt, fijo, lista }) => {
      const ctrl = !ok && lista
        ? '<a class="btn-sec" href="https://tally.so/r/EkGZoL?origen=panel" target="_blank" rel="noopener">Conectar →</a>'
        : !ok && prompt
        ? '<button class="btn-sec" data-p="' + esc(prompt) + '">Conectar</button>'
        : (ok && sw
          ? '<span class="estado ' + (on ? 'si' : 'no') + '">' + (on ? 'ACTIVO' : 'APAGADO') + '</span>' +
            '<label class="sw" title="' + (on ? 'Apagar' : 'Encender') + '">' +
            '<input type="checkbox" data-cfsw="' + sw + '"' + (on ? ' checked' : '') + '><i></i></label>'
          : '<span class="estado ' + (ok ? 'si' : 'no') + '">' + (ok ? (fijo || 'CONECTADO') : 'SIN CONECTAR') + '</span>');
      return '<div class="cf-linea"><span class="ic">' + ic + '</span>' +
        '<span class="nom"><b>' + nombre + '</b><small>' + detalle + '</small></span>' +
        '<span class="ctrl">' + ctrl + '</span></div>';
    };

    document.getElementById('cfPiezas').innerHTML =
      fila({ ic:'📱', nombre:'WhatsApp', ok: fl.canales.whatsapp, fijo:'CONECTADO',
        detalle: fl.canales.whatsapp ? 'por donde te escriben tus clientes' : 'sin esto, el agente no puede contestar',
        prompt:'Conecta WhatsApp a mi agente Relevo con Zernio: crea la llave, registra el webhook firmado y prueba con un mensaje real.' }) +
      fila({ ic:'📨', nombre:'Avisos por Telegram', ok: fl.canales.telegramAvisos, sw:'avisos', on: caps.avisos,
        detalle: caps.avisos ? 'te suena el teléfono cuando cae un interesado'
                             : 'apagados: el interesado se guarda igual en el panel',
        prompt:'Configura los avisos de Telegram de mi agente Relevo: guíame con BotFather y prueba que llegue un aviso con su message_id.' }) +
      fila({ ic:'📊', nombre:'Reporte diario', ok: fl.reporteCorreo, sw:'reporte', on: caps.reporte,
        detalle: fl.reporteCorreo
          ? 'cada noche por ' + String(fl.reporteVia||'correo').toUpperCase() + ': el resumen del día'
          : 'referencia en src/avanzado/reporte.js — la ruta guiada, en el workshop',
        lista: true }) +
      fila({ ic:'🧠', nombre:'Cerebro', ok:true, fijo: fl.cerebroPropio ? 'LLAVE PROPIA' : 'INCLUIDO',
        detalle: fl.cerebroPropio ? 'usando tu propia llave de ' + esc(fl.cerebroPropio)
                                  : 'el modelo incluido en tu Cloudflare, sin llaves extra' });

    document.querySelectorAll('#cfPiezas [data-cfsw]').forEach(sw => sw.onchange = async () => {
      sw.disabled = true;
      await post('ajustes', { ['cap_' + sw.dataset.cfsw]: sw.checked ? '1' : '0' });
      this.init();
      if (SECCIONES.flujo?.datos) SECCIONES.flujo.cada();
      if (SECCIONES.capacidades?.datos) SECCIONES.capacidades.cada();
    });

    // ── Apps: lo que el agente puede USAR. El encabezado dice si están
    //    encendidas; cada tarjeta, si esa app en particular está conectada.
    const maestro = document.getElementById('cfAppsMaster');
    maestro.innerHTML = fl.composio
      ? '<span class="estado ' + (caps.herramientas ? 'si' : 'no') + '">' +
        (caps.herramientas ? (fl.herramientas.length + ' EN USO') : 'APAGADAS') + '</span>' +
        '<label class="sw" style="margin-left:8px;vertical-align:middle" title="Apagar todas">' +
        '<input type="checkbox" data-cfsw="herramientas"' + (caps.herramientas ? ' checked' : '') + '><i></i></label>'
      : '<span class="estado no">SIN LLAVE DE COMPOSIO</span>';
    maestro.querySelectorAll('[data-cfsw]').forEach(sw => sw.onchange = async () => {
      sw.disabled = true;
      await post('ajustes', { cap_herramientas: sw.checked ? '1' : '0' });
      this.init();
      if (SECCIONES.flujo?.datos) SECCIONES.flujo.cada();
      if (SECCIONES.capacidades?.datos) SECCIONES.capacidades.cada();
    });

    const slugs = (fl.herramientas || []).map(h => String(h.tool));
    const usa = (pref) => slugs.some(t => t.startsWith(pref));
    // "vía": de dónde sale la conexión. Notion y Slack van directo (un token y
    // ya); lo que pide OAuth con refresh va por Composio, que carga ese dolor.
    const apps = [
      ['🗓️','Google Calendar','agendar citas','Composio', usa('GOOGLECALENDAR'),
       'Usa /conectar: quiero que mi agente Relevo agende citas en mi Google Calendar, probado de punta a punta.'],
      ['📊','Google Sheets','registrar interesados','Composio', usa('GOOGLESHEETS'),
       'Usa /conectar: quiero que mi agente Relevo registre cada interesado en mi hoja de Google Sheets, probado de punta a punta.'],
      ['🧲','HubSpot','crear contactos y deals','Composio', usa('HUBSPOT'),
       'Usa /conectar: quiero que mi agente Relevo cree contactos y deals en mi HubSpot, probado de punta a punta.'],
      ['💳','Stripe','cobrar por WhatsApp','Composio', usa('STRIPE'),
       'Usa /conectar: quiero que mi agente Relevo genere links de pago de Stripe, probado de punta a punta.'],
      ['📝','Notion','guardar en tu base','directo', usa('NOTION') || slugs.some(t => t.includes('notion')),
       'Usa /conectar: quiero que mi agente Relevo guarde los interesados en mi base de Notion. Va directo con mi token de Notion (sin Composio), como capacidad local, probado de punta a punta.'],
      ['💬','Slack','avisar a tu canal','directo', usa('SLACK') || slugs.some(t => t.includes('slack')),
       'Usa /conectar: quiero que mi agente Relevo avise a mi canal de Slack cuando caiga un interesado. Va directo con un webhook de Slack (sin Composio), probado de punta a punta.'],
      ['✈️','Telegram como canal','que también atienda ahí','canal', false,
       'Usa /conectar: quiero que mi agente Relevo también atienda por Telegram, probado con un mensaje real.'],
      ['📸','Instagram y Messenger','atender tus DMs','canal', false,
       'Usa /conectar: quiero llevar mi agente Relevo a Instagram y Messenger (ruta ManyChat), probado de punta a punta.'],
    ];
    document.getElementById('cfCatalogo').innerHTML = apps.map(a =>
      '<div class="cf-app"><span class="ic">' + a[0] + '</span>' +
      '<span class="nom"><b>' + a[1] + '</b><small>' + a[2] + ' · ' + a[3] + '</small></span>' +
      (a[4]
        ? '<span class="estado si">EN USO</span>'
        : '<a class="btn-sec" href="https://tally.so/r/EkGZoL?origen=panel" target="_blank" rel="noopener" ' +
          'title="La ruta guiada vive en el workshop">Conectar →</a>') +
      '</div>').join('');

    // Los prompts de ejemplo para cambiar el agente conversando
    const ejemplos = [
      ['✏️', 'Cambiar la información', 'Sube el precio del corte de dama a $300 en mi agente Relevo, publica y verifica.'],
      ['🗣️', 'Cambiar el tono', 'Que mi agente Relevo hable más formal (de usted), publica y enséñame un antes/después.'],
      ['🗓️', 'Conectar el calendario', 'Usa /conectar: quiero que mi agente Relevo agende citas en mi Google Calendar, probado de punta a punta.'],
      ['📚', 'Cargarle mi catálogo', 'Usa /cargar-conocimiento: te paso mi catálogo y quiero que mi agente Relevo conteste con él.'],
      ['🩺', 'Revisar una conversación', 'Corre /autopsia sobre esta conversación que salió mal: [pega el chat].'],
      ['🔒', 'Auditar seguridad y costos', 'Corre /auditoria en mi agente Relevo y aplica los arreglos, uno por uno.'],
      ['🔑', 'Rotar la clave del panel', 'Rota la clave del panel de mi agente Relevo (openssl rand -hex 8 → wrangler secret put CLAVE_PANEL), pásamela por un canal seguro y confirma que las sesiones viejas ya no entran.'],
    ];
    document.getElementById('cfPrompts').innerHTML = ejemplos.map(e =>
      '<button class="cap-prompt" data-p="' + esc(e[2]) + '">' +
      '<b>' + e[0] + ' ' + esc(e[1]) + ' — copiar</b>' + esc(e[2]) + '</button>').join('');

    // un solo manejador de copiado para toda la sección
    document.querySelectorAll('#sec-configuracion [data-p]').forEach(b => b.onclick = async () => {
      try { await navigator.clipboard.writeText(b.dataset.p); }
      catch { const t = document.createElement('textarea'); t.value = b.dataset.p;
        document.body.appendChild(t); t.select(); document.execCommand('copy'); t.remove(); }
      const bb = b.querySelector('b') || b; const antes = bb.textContent;
      bb.textContent = '✓ Copiado — pégaselo a Claude Code';
      setTimeout(() => bb.textContent = antes, 2200);
    });
  },
  async cada(){ this.init(); },
};
`;
