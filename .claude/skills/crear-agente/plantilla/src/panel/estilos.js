// El sistema visual del panel. Tokens primero: cambiarlos aquí re-tematiza todo.

const CLARO = `
  --display:Fraunces,Georgia,"Times New Roman",serif;
  --tinta:#131628; --morado:#6F00FF; --rojo:#F44336; --gris:#607179;
  --lienzo:#FAFAFA; --tarjeta:#FFFFFF; --apagado:#F4F2FA;
  --borde:#E8E6F0; --borde-fuerte:#D9D6E6;
  --txt:#131628; --sec:#607179; --morado-tenue:#F1E8FF;
  --lateral:#131628; --lateral-txt:#FFFFFF; --lateral-sec:#9AA0B8;
  --lateral-linea:#282C42; --lateral-activo:#2A1A52;
  --sombra:0 1px 2px rgba(19,22,40,.04), 0 12px 32px -8px rgba(19,22,40,.10);
  --anillo:0 0 0 3px rgba(111,0,255,.22);
  --verde:#16A34A; --ambar:#D97706;`;

const OSCURO = `
  --lienzo:#08090F; --tarjeta:#14172A; --apagado:#1D2138;
  --borde:#262B45; --borde-fuerte:#333854;
  --txt:#F1F1F5; --sec:#98A0B8; --morado-tenue:#2C1660;
  --lateral:#0E1122; --lateral-linea:#232742; --lateral-activo:#2C1660;
  --sombra:0 1px 2px rgba(0,0,0,.4), 0 12px 32px -8px rgba(0,0,0,.5);`;

export const CSS = `
:root{${CLARO}}
@media(prefers-color-scheme:dark){ :root:not([data-tema="claro"]){${OSCURO}} }
:root[data-tema="oscuro"]{${OSCURO}}

*{box-sizing:border-box;-webkit-tap-highlight-color:transparent}
html{-webkit-text-size-adjust:100%}
body{margin:0;background:var(--lienzo);color:var(--txt);
     font:400 15px/1.5 Poppins,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
     -webkit-font-smoothing:antialiased}
:focus-visible{outline:none;box-shadow:var(--anillo);border-radius:9px}
@media(prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
button{font:inherit}

/* ═══ El cascarón: sidebar + contenido ═══ */
.shell{display:flex;min-height:100vh}
aside{width:232px;flex:none;background:var(--lateral);color:var(--lateral-txt);
      display:flex;flex-direction:column;position:sticky;top:0;height:100vh;
      transition:width .18s}
.logo{padding:20px 18px 14px;display:flex;align-items:center;gap:10px}
.logo-marca{width:34px;height:34px;border-radius:10px;background:var(--morado);
      display:grid;place-items:center;font-weight:800;font-size:16px;color:#fff;flex:none}
.logo b{font-size:15px;font-weight:800;letter-spacing:-.2px;white-space:nowrap;
        overflow:hidden;text-overflow:ellipsis}
.logo span{display:block;font-size:10.5px;color:var(--lateral-sec);font-weight:400}
nav{flex:1;overflow-y:auto;padding:4px 10px 10px}
.ngrupo{font-size:10px;letter-spacing:.1em;color:var(--lateral-sec);
        padding:14px 10px 6px;text-transform:uppercase}
.nitem{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;margin:2px 0;
       border:0;border-left:3px solid transparent;border-radius:12px;background:none;
       color:var(--lateral-txt);cursor:pointer;font-size:13.5px;text-align:left;
       text-decoration:none;transition:background .12s,border-color .12s}
.nitem:hover{background:var(--lateral-linea)}
.nitem.on{background:var(--lateral-activo);font-weight:600;border-left-color:var(--morado)}
.nitem .ic{width:20px;text-align:center;flex:none}
.nitem .nn{margin-left:auto;background:var(--rojo);color:#fff;font-size:10px;font-weight:700;
       padding:1px 7px;border-radius:20px}
.pie-lateral{padding:12px 18px;border-top:1px solid var(--lateral-linea);
       font-size:11px;color:var(--lateral-sec)}
.pie-lateral a{color:#B98AFF;text-decoration:none;font-weight:600}

/* Configuración vive dentro de Mi cuenta (como el CRM de referencia);
   en móvil no hay Mi cuenta, así que ahí sí aparece en la barra. */
@media(min-width:900px){ .nitem[data-sec="configuracion"]{display:none} }

/* colapso de la sidebar (escritorio) */
@media(min-width:900px){
  .shell.plegada aside{width:0;overflow:hidden;border:0}
}

/* barra superior del contenido */
.contenido{flex:1;min-width:0;display:flex;flex-direction:column}
.btn-plegar{border:1px solid var(--borde-fuerte);background:var(--tarjeta);color:var(--txt);
        border-radius:999px;width:38px;height:38px;cursor:pointer;font-size:15px;flex:none;
        transition:border-color .14s}
.btn-plegar:hover{border-color:var(--morado)}
@media(max-width:899px){.btn-plegar{display:none}}
.topbar{display:flex;align-items:center;gap:12px;padding:14px 22px;
        border-bottom:1px solid var(--borde);background:var(--tarjeta);
        position:sticky;top:0;z-index:5}
.miga{font-size:11px;letter-spacing:.08em;color:var(--sec);text-transform:uppercase}
.titulo{font-family:var(--display);font-size:23px;font-weight:600;letter-spacing:-.3px;margin-top:1px}
.tope-der{margin-left:auto;display:flex;align-items:center;gap:10px}
.btn-tema{border:1px solid var(--borde-fuerte);background:var(--tarjeta);color:var(--txt);
        border-radius:999px;width:38px;height:38px;cursor:pointer;font-size:15px;
        transition:border-color .14s}
.btn-tema:hover{border-color:var(--morado)}
.chip-vivo{display:flex;align-items:center;gap:7px;border:1px solid var(--borde-fuerte);
        border-radius:999px;padding:8px 14px;font-size:11.5px;font-weight:600;
        letter-spacing:.04em;background:var(--tarjeta)}
.chip-vivo .punto{width:8px;height:8px;border-radius:50%;background:var(--verde)}
.chip-vivo.mal .punto{background:var(--rojo)}
.seccion{display:none;flex:1}
.seccion.on{display:block}
.lienzo-seccion{max-width:1180px;margin:0 auto;padding:22px;width:100%}

/* ═══ Piezas compartidas ═══ */
.tarjetas{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.kpi{background:var(--tarjeta);border:1px solid var(--borde);border-radius:14px;
     padding:16px 18px;box-shadow:var(--sombra)}
.kpi .et{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--sec);
     display:flex;gap:6px;align-items:center}
.kpi b{display:block;font-family:var(--display);font-size:31px;font-weight:600;
     letter-spacing:-.5px;margin-top:6px;font-variant-numeric:tabular-nums}
.kpi .sub{font-size:11.5px;color:var(--sec);margin-top:2px}
.kpi.acento{border-color:var(--morado)}
.kpi.acento b{color:var(--morado)}
.caja{background:var(--tarjeta);border:1px solid var(--borde);border-radius:14px;
     box-shadow:var(--sombra);margin-top:16px;overflow:hidden}
.caja-cab{display:flex;align-items:baseline;gap:10px;padding:15px 18px 0}
.caja-cab h3{font-family:var(--display);font-size:17px;font-weight:600;margin:0}
.caja-cab .mini{font-size:11.5px;color:var(--sec)}
.caja-cab .der{margin-left:auto;font-size:12.5px}
.caja-cuerpo{padding:14px 18px 18px}
.nota-exacto{font-size:11px;color:var(--sec)}
.vacio-caja{padding:34px 20px;text-align:center;color:var(--sec);font-size:13.5px}
.vacio-caja b{display:block;color:var(--txt);font-weight:800;margin-bottom:4px}
a.liga{color:var(--morado);text-decoration:none;font-weight:600}

/* ═══ Botones — el sistema, definido una sola vez ═══ */
.btn-pri,.btn-sec,.btn-dark{
  font:inherit;font-size:13.5px;font-weight:600;letter-spacing:.01em;cursor:pointer;
  border-radius:12px;padding:10px 18px;transition:transform .12s,box-shadow .12s,
  border-color .14s,opacity .12s;display:inline-flex;align-items:center;gap:7px}
.btn-pri{border:0;background:var(--morado);color:#fff;
  box-shadow:0 1px 2px rgba(111,0,255,.3),0 6px 16px -6px rgba(111,0,255,.45)}
.btn-pri:hover{transform:translateY(-1px)}
.btn-pri:disabled{opacity:.55;transform:none;cursor:default}
.btn-dark{border:0;background:var(--tinta);color:#fff}
:root[data-tema="oscuro"] .btn-dark{background:#fff;color:var(--tinta)}
@media(prefers-color-scheme:dark){:root:not([data-tema="claro"]) .btn-dark{background:#fff;color:var(--tinta)}}
.btn-dark:hover{transform:translateY(-1px)}
.btn-sec{border:1px solid var(--borde-fuerte);background:var(--tarjeta);color:var(--txt)}
.btn-sec:hover{border-color:var(--morado);color:var(--morado)}
.btn-sec:disabled{opacity:.55;cursor:default}

/* selects con el mismo oficio que los botones */
select{
  font:inherit;font-size:12.5px;font-weight:600;color:var(--txt);cursor:pointer;
  background:var(--tarjeta);border:1px solid var(--borde-fuerte);border-radius:999px;
  padding:7px 30px 7px 14px;appearance:none;-webkit-appearance:none;
  background-image:url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23607179' stroke-width='1.6' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
  background-repeat:no-repeat;background-position:right 12px center;
  transition:border-color .14s}
select:hover{border-color:var(--morado)}

/* interruptor on/off */
.sw{position:relative;width:40px;height:23px;flex:none;cursor:pointer}
.sw input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.sw i{position:absolute;inset:0;border-radius:99px;background:var(--apagado);
  border:1px solid var(--borde-fuerte);transition:background .16s,border-color .16s}
.sw i::after{content:'';position:absolute;top:2px;left:2px;width:17px;height:17px;
  border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(19,22,40,.3);
  transition:transform .16s}
.sw input:checked + i{background:var(--morado);border-color:var(--morado)}
.sw input:checked + i::after{transform:translateX(17px)}
.sw input:focus-visible + i{box-shadow:var(--anillo)}

/* el botón "díselo a Claude" — compartido por todas las secciones */
.cap-prompt{border:1px dashed var(--borde-fuerte);background:var(--lienzo);border-radius:10px;
  padding:8px 11px;font-size:11.5px;color:var(--sec);cursor:pointer;text-align:left;
  font-family:inherit;transition:border-color .14s;width:100%}
.cap-prompt:hover{border-color:var(--morado);color:var(--txt)}
.cap-prompt b{color:var(--morado);font-size:10.5px;letter-spacing:.05em;display:block;margin-bottom:3px}

/* mi cuenta (sidebar): abre su menú con Configuración, tema y salir */
.mc-zona{position:relative;margin:0 10px 8px}
.mi-cuenta{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;
  border:1px solid var(--lateral-linea);border-radius:14px;background:none;
  color:var(--lateral-txt);cursor:pointer;font:inherit;text-align:left;
  transition:border-color .14s}
.mi-cuenta:hover{border-color:var(--lateral-sec)}
.mc-flecha{margin-left:auto;color:var(--lateral-sec);font-size:13px;transition:transform .15s}
.mc-zona.abierta .mc-flecha{transform:rotate(180deg)}
.mc-menu{position:absolute;bottom:calc(100% + 8px);left:0;right:0;z-index:35;
  background:var(--lateral);border:1px solid var(--lateral-linea);border-radius:14px;
  padding:6px;box-shadow:0 -8px 28px rgba(0,0,0,.35);display:flex;flex-direction:column;gap:2px}
.mc-menu[hidden]{display:none}
.mc-item{display:flex;align-items:center;gap:9px;width:100%;padding:9px 11px;border:0;
  border-radius:10px;background:none;color:var(--lateral-txt);cursor:pointer;font:inherit;
  font-size:13px;text-align:left;text-decoration:none;transition:background .12s}
.mc-item:hover{background:var(--lateral-linea)}
.mc-item.peligro{color:#ff9d9d}
.mc-avatar{width:32px;height:32px;border-radius:50%;background:var(--lateral-activo);
  color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px;flex:none}
.mc-texto{min-width:0;flex:1}
.mc-texto b{display:block;font-size:12.5px;letter-spacing:-.1px}
.mc-texto span{font-size:10.5px;color:var(--lateral-sec)}

/* barras de actividad */
.barras{display:flex;gap:8px;align-items:flex-end;height:120px;padding-top:8px}
.barra{flex:1;display:flex;flex-direction:column;align-items:center;gap:6px;min-width:0}
.barra .palo{width:100%;max-width:38px;background:var(--apagado);border-radius:6px 6px 2px 2px;
       position:relative;transition:height .2s}
.barra.hoy .palo{background:var(--morado)}
.barra .v{font-size:11px;font-weight:700;font-variant-numeric:tabular-nums}
.barra .d{font-size:10px;color:var(--sec);text-transform:capitalize;white-space:nowrap}

/* móvil: la sidebar se vuelve barra inferior */
@media(max-width:899px){
  .shell{flex-direction:column}
  aside{width:100%;height:auto;position:fixed;bottom:0;top:auto;z-index:30;
        flex-direction:row;align-items:center;border-top:1px solid var(--lateral-linea)}
  .logo,.ngrupo,.pie-lateral,.mc-zona{display:none}
  nav{display:flex;flex:1;padding:6px;overflow-x:auto;overflow-y:hidden}
  .nitem{flex:1;flex-direction:column;gap:3px;font-size:9px;padding:7px 3px;min-width:62px}
  /* 7+ secciones: la etiqueta se corta con puntos en vez de encimarse con la vecina */
  .nitem span:not(.ic):not(.nn){max-width:100%;overflow:hidden;text-overflow:ellipsis;
    white-space:nowrap;display:block;text-align:center}
  .nitem .ic{font-size:17px}
  .nitem .nn{position:absolute;transform:translate(14px,-4px)}
  .contenido{padding-bottom:74px}
  .topbar{padding:12px 14px}
  .lienzo-seccion{padding:14px}
}
`;
