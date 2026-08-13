// El sistema visual del panel. Tokens primero: cambiarlos aquí re-tematiza todo.

const CLARO = `
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
.nitem{display:flex;align-items:center;gap:10px;width:100%;padding:9px 10px;margin:1px 0;
       border:0;border-radius:9px;background:none;color:var(--lateral-txt);cursor:pointer;
       font-size:13.5px;text-align:left;text-decoration:none;transition:background .12s}
.nitem:hover{background:var(--lateral-linea)}
.nitem.on{background:var(--lateral-activo);font-weight:600}
.nitem .ic{width:20px;text-align:center;flex:none}
.nitem .nn{margin-left:auto;background:var(--rojo);color:#fff;font-size:10px;font-weight:700;
       padding:1px 7px;border-radius:20px}
.pie-lateral{padding:12px 18px;border-top:1px solid var(--lateral-linea);
       font-size:11px;color:var(--lateral-sec)}
.pie-lateral a{color:#B98AFF;text-decoration:none;font-weight:600}

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
.titulo{font-size:19px;font-weight:800;letter-spacing:-.3px;margin-top:1px}
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
.kpi b{display:block;font-size:28px;font-weight:800;letter-spacing:-.8px;margin-top:6px;
     font-variant-numeric:tabular-nums}
.kpi .sub{font-size:11.5px;color:var(--sec);margin-top:2px}
.kpi.acento{border-color:var(--morado)}
.kpi.acento b{color:var(--morado)}
.caja{background:var(--tarjeta);border:1px solid var(--borde);border-radius:14px;
     box-shadow:var(--sombra);margin-top:16px;overflow:hidden}
.caja-cab{display:flex;align-items:baseline;gap:10px;padding:15px 18px 0}
.caja-cab h3{font-size:15px;font-weight:800;margin:0}
.caja-cab .mini{font-size:11.5px;color:var(--sec)}
.caja-cab .der{margin-left:auto;font-size:12.5px}
.caja-cuerpo{padding:14px 18px 18px}
.nota-exacto{font-size:11px;color:var(--sec)}
.vacio-caja{padding:34px 20px;text-align:center;color:var(--sec);font-size:13.5px}
.vacio-caja b{display:block;color:var(--txt);font-weight:800;margin-bottom:4px}
a.liga{color:var(--morado);text-decoration:none;font-weight:600}

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
  .logo,.ngrupo,.pie-lateral{display:none}
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
