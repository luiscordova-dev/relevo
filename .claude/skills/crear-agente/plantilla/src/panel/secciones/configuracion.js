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
    <div class="caja-cab"><h3>Conexiones</h3>
      <span class="mini">el estado real de cada pieza</span></div>
    <div class="caja-cuerpo" id="cfConexiones"></div>
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
.cf-linea{display:flex;align-items:center;gap:10px;padding:9px 0;font-size:13.5px;
  border-bottom:1px solid var(--borde)}
.cf-linea:last-child{border-bottom:0}
.cf-linea .estado{margin-left:auto;font-size:11px;font-weight:700;padding:3px 10px;
  border-radius:99px}
.cf-linea .estado.si{background:var(--morado-tenue);color:var(--morado)}
.cf-linea .estado.no{background:var(--apagado);color:var(--sec)}
.cf-linea .cf-conectar{margin-left:auto}
.cf-linea .cf-conectar + .estado{margin-left:0}
.cf-prompts{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
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
      const actual = aj.ajustes[clave] ||
        (clave === 'horas_pausa_al_contestar' ? fl.horasPausaContestar : fl.minutosPausa);
      marcar(cont, actual);
      cont.querySelectorAll('button').forEach(b => b.onclick = async () => {
        await api('ajustes', { method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ [clave]: b.dataset.v }) });
        marcar(cont, b.dataset.v);
      });
    });

    // Cada conexión: su estado real y, si está apagada, el botón que copia el
    // prompt exacto para conectarla con Claude Code. Conectar = copiar y pegar.
    const linea = (ic, nombre, ok, siTxt, noTxt, prompt) =>
      '<div class="cf-linea"><span>' + ic + '</span><span>' + nombre + '</span>' +
      (!ok && prompt
        ? '<button class="btn-sec cf-conectar" data-p="' + esc(prompt) + '">Conectar</button>'
        : '') +
      '<span class="estado ' + (ok ? 'si' : 'no') + '">' + (ok ? siTxt : noTxt) + '</span></div>';

    document.getElementById('cfConexiones').innerHTML =
      linea('📱', 'WhatsApp', fl.canales.whatsapp, 'CONECTADO', 'SIN CONECTAR',
        'Conecta WhatsApp a mi agente Relevo con Zernio: crea la llave, registra el webhook firmado y prueba con un mensaje real.') +
      linea('📨', 'Avisos por Telegram', fl.canales.telegramAvisos, 'ACTIVOS', 'SIN CONECTAR',
        'Configura los avisos de Telegram de mi agente Relevo: guíame con BotFather y prueba que llegue un aviso con su message_id.') +
      linea('🧰', 'Herramientas (Composio)', fl.composio,
            fl.herramientas.length + ' DECLARADAS', 'SIN LLAVE',
        'Usa /conectar para conectarle Composio a mi agente Relevo: mi API key del dashboard, la app que te diga, y pruébalo de punta a punta.') +
      linea('📊', 'Reporte diario por correo', fl.reporteCorreo,
            'POR ' + String(fl.reporteVia || '').toUpperCase(), 'APAGADO',
        'Enciende el reporte diario de mi agente Relevo por Gmail vía Composio (o Resend) y mándame uno de prueba con su id.') +
      linea('🧠', 'Cerebro', true, fl.cerebroPropio ? 'LLAVE PROPIA' : 'INCLUIDO', '');

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
