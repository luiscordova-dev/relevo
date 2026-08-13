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
    <div class="caja-cab"><h3>Para cambiar lo demás</h3></div>
    <div class="caja-cuerpo" style="font-size:13.5px;color:var(--sec)">
      La información del negocio, el tono, el nombre del agente, las herramientas y los
      canales se cambian <b style="color:var(--txt)">pidiéndoselo a Claude</b> en la carpeta
      del agente: <i>"sube el precio del corte a $300"</i>, <i>"que sea más formal"</i>,
      <i>"conéctale mi calendario"</i>. Publica el cambio y listo.
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

    const linea = (ic, nombre, ok, siTxt, noTxt) =>
      '<div class="cf-linea"><span>' + ic + '</span><span>' + nombre + '</span>' +
      '<span class="estado ' + (ok ? 'si' : 'no') + '">' + (ok ? siTxt : noTxt) + '</span></div>';
    document.getElementById('cfConexiones').innerHTML =
      linea('📱', 'WhatsApp', fl.canales.whatsapp, 'CONECTADO', 'SIN CONECTAR') +
      linea('📨', 'Avisos por Telegram', fl.canales.telegramAvisos, 'ACTIVOS', 'SIN CONECTAR') +
      linea('🧰', 'Herramientas (Composio)', fl.herramientas.length,
            fl.herramientas.length + ' CONECTADAS', 'NINGUNA') +
      linea('📊', 'Reporte diario por correo', fl.reporteCorreo, 'ACTIVO', 'APAGADO') +
      linea('🧠', 'Cerebro', true, fl.cerebroPropio ? 'LLAVE PROPIA' : 'INCLUIDO', '');
  },
};
`;
