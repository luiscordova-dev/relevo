# Cómo funciona por dentro

Para quien tenga curiosidad técnica. **No necesitas leer esto para usar el kit.**

## El recorrido de un mensaje

```
Tu cliente escribe por WhatsApp
        │
        │  Zernio recibe el mensaje y lo manda a tu agente (webhook firmado)
        ▼
Tu Cloudflare Worker  ── vive en el plan gratis, prendido 24/7
        │
        ├─ ¿Es nota de voz?  → Whisper la transcribe
        ├─ ¿Es foto?         → Llama Vision la describe
        │
        ├─ El cerebro (Llama 3.3) lee la info de tu negocio + el historial
        │  y escribe la respuesta
        │
        ├─ Se le contesta al cliente por WhatsApp
        │
        └─ Si en la respuesta venía un bloque de datos:
             ├─ lead     → se guarda en D1 y te llega 🔔 a Telegram
             └─ humano   → te llega 🔴 a Telegram y el agente se calla 1 hora

Tu panel  →  tu-negocio.workers.dev/panel?clave=…
             conversaciones, interesados, y puedes contestar tú
```

## Decisiones que valen la pena explicar

**La captura no depende de que el modelo "llame una herramienta".**
El agente le pide al modelo que agregue un bloque de datos al final de su respuesta. El
código lo separa del texto visible con un parser normal y ejecuta el guardado y el aviso.
Si el modelo trunca el bloque, hay un rescate por expresiones regulares. Menos magia,
menos cosas que fallen — y es la razón por la que el aviso sí llega.

**Un aviso "enviado" no cuenta: cuenta el `message_id`.**
Cada aviso a Telegram guarda el id que devuelve su API. Si ese campo está vacío, el aviso
**no llegó**, y el panel lo marca. Nada se da por hecho.

**Si el aviso falla, el interesado no se pierde.**
Primero se le contesta al cliente, luego se guarda el lead, y hasta el final se avisa. Si
Telegram se cae, el lead ya está en tu base y aparece en tu panel marcado "sin aviso".

**Los webhooks de Zernio son por cuenta, no por número.**
Llegan eventos de todos los números y plataformas conectados a esa cuenta. Por eso el
agente filtra por `account.id`: sin ese filtro, dos agentes de la misma cuenta se
contestarían los mensajes entre ellos.

**Zernio reintenta si no le contestas en 5 segundos.**
El agente responde 2xx de inmediato y hace el trabajo pesado después. Además, cada mensaje
se guarda con su id de WhatsApp: si llega repetido, se ignora y el cliente no recibe dos
respuestas.

**Cero dependencias.**
No hay `npm install` ni `node_modules` ni compilación. Es JavaScript que corre tal cual en
Cloudflare. Menos piezas, menos cosas que se rompan durante la instalación — y por eso el
panel se puede modificar pidiéndoselo a Claude en español.

## Los archivos

```
tu-agente/
├── negocio.js          ← lo único que necesitas tocar: tu información
├── marca.js            ← la firma del pie del panel
├── schema.sql          ← las 7 tablas (conversaciones, mensajes, leads, eventos,
│                          uso, ajustes, documentos)
├── wrangler.jsonc      ← configuración, modelos y bindings
└── src/
    ├── index.js        ← rutas, firma del webhook, filtro por cuenta, cron
    ├── agente.js       ← el flujo: interpretar → pensar → responder → capturar → avisar
    ├── cerebro.js      ← el prompt (con ejemplos), la temperatura y la llamada al modelo
    ├── medios.js       ← notas de voz y fotos
    ├── avisos.js       ← los avisos a Telegram, con su evidencia
    ├── datos.js        ← D1: conversaciones, mensajes, interesados, ajustes
    ├── capacidades.js  ← los switches del panel, con sus gates en runtime
    ├── herramientas.js ← el loop de tool-calling (lo usa el playground)
    ├── zernio.js       ← hablar con WhatsApp: leer, responder, bajar adjuntos
    ├── inbox.js        ← la API del panel
    ├── autoprueba.js   ← la tanda de pruebas de punta a punta
    ├── calidad.js      ← el control de calidad con auto-reparación
    ├── archivos-prueba.js
    ├── panel/          ← el panel: index.js, app.js, estilos.js, login.js, logo.js
    │   └── secciones/  ← resumen, conversaciones, flujo, capacidades,
    │                      conocimiento, costos, configuración
    └── avanzado/       ← 🧪 el playground, sin soporte
        ├── composio.js      ← citas e integraciones
        ├── conocimiento.js  ← RAG con Vectorize
        └── reporte.js       ← el resumen diario por correo (opcional)
```

## Los modelos

Todos incluidos en el plan gratis de Cloudflare (10,000 neurons al día; un día lleno del
número de prueba gasta como 2,300).

| Para qué | Modelo |
|---|---|
| Cerebro | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| Cerebro de respaldo | `@cf/openai/gpt-oss-120b` |
| Oído | `@cf/openai/whisper-large-v3-turbo` |
| Vista | `@cf/meta/llama-3.2-11b-vision-instruct` |

Si prefieres usar tu propia llave de OpenAI o Anthropic, se conecta y ya: es un secreto
más, y el resto del código no cambia.

## El control de calidad

Al terminar la instalación, tu agente **se evalúa a sí mismo** con seis escenarios: que
capte interesados, que no avise sin nombre, que detecte cuando piden un humano, que no
invente y que escriba bien. Si el cerebro no pasa, prueba el otro modelo incluido y
recomienda el cambio. Claude lo aplica sin que tú tengas que entender nada.

## Rutas del agente

| Ruta | Para qué |
|---|---|
| `POST /webhook/zernio` | Por aquí entran los mensajes de tus clientes |
| `GET /panel` | Tu bandeja de entrada. Dos puertas: la sesión iniciada (cookie firmada) o `?clave=` la primera vez — al entrar con clave se siembra la cookie para que no viva en la barra del navegador |
| `POST /api/login` · `/api/logout` | Abrir y cerrar sesión (cookie `HttpOnly; Secure; SameSite=Lax`) |
| `GET /api/*` | Lo que usa el panel (conversaciones, hilo, responder, pausar) |
| `POST /prueba?clave=` | La tanda de pruebas con evidencia (8, o 9 con Conocimiento encendido) |
| `POST /calidad?clave=` | El control de calidad del cerebro |
| `GET /salud` | Qué está configurado y qué falta |
| cron cada 15 min | Recordatorios. Y a las 3:00 am **de tu `ZONA_HORARIA`**, el resumen diario por correo si lo activaste — una sola vez al día |


## Por qué D1 y no R2 (ni KV)

Son cosas distintas, no alternativas:

| | Qué es | Rol en Relevo |
|---|---|---|
| **D1** | SQLite gestionado, relacional, con SQL | **Todo el estado**: conversaciones, mensajes, leads, eventos, uso, ajustes, documentos. Se consulta con `WHERE`/`JOIN`/`GROUP BY`, que es exactamente lo que el panel necesita |
| **R2** | Object storage (S3-compatible) | **No se usa hoy**. Su caso sería archivar los audios e imágenes originales de los clientes; hoy se procesan al vuelo (Whisper/Vision) y se guarda el texto, que es lo que el cerebro necesita |
| **KV** | Clave-valor, lectura eventual | Tampoco. Su consistencia eventual es mala para "¿esta conversación está pausada AHORA?" |
| **Vectorize** | Índice vectorial | El Conocimiento (RAG), cuando se enciende |

Resumen: el estado es relacional y se consulta por atributos, así que va en D1. R2 entra el
día que se quieran guardar los medios originales (por ejemplo, para reprocesarlos con otro
modelo) — es aditivo, no un reemplazo.
