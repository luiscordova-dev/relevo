# Mapa de fallos — qué pasó y qué hacer

Regla de la casa: **ningún mensaje de error termina en "algo salió mal"**. Siempre
cierra con LA acción que sigue. La persona no lee inglés técnico ni stack traces.

| Lo que ves | Lo que pasó de verdad | Qué haces |
|---|---|---|
| `getUpdates` → `result: []` | Le dio `/start` a BotFather, no a su bot | Saca el usuario con `getMe` y mándale `https://t.me/<usuario>` para que le dé INICIAR |
| Zernio responde `401` | Guardaste el objeto, no `apiKey.key` | Vuelve a crear la llave extrayendo `['apiKey']['key']` |
| Sesión sandbox en `pending` | No ha respondido el mensaje de verificación | "Busca el mensaje del `<sandboxNumber>` en tu WhatsApp y respóndele cualquier cosa" |
| `AiError 5016` | Falta aceptar la licencia de Meta para el modelo de fotos | Explícale qué es, pide su "sí", manda `agree` (ver cloudflare.md) |
| Todo falla justo después de publicar | Cloudflare aún sirve la versión vieja | Espera 20 s y repite. **No cambies nada todavía** |
| Telegram: `chat not found` | El `chat_id` no corresponde a ese bot | Vuelve a leer `getUpdates` con el token correcto |
| La prueba de captura falla pero Telegram sí manda | Es el cerebro, no los avisos | Corre `/calidad` y aplica su campo `accion` |
| `/calidad` → `cambiar-modelo` | El modelo no sigue el protocolo | Cambia `MODELO_CEREBRO` al recomendado, publica, espera 20 s, prueba otra vez |
| `/calidad` → `revisar-informacion` | Falta detalle del negocio y por eso inventa | Pregúntale qué NO ofrece y qué le preguntan seguido; complétalo en `negocio.js` |
| `/calidad` → `usar-llave-propia` | Ningún modelo incluido da el ancho | Ofrécele conectar su OpenAI/Anthropic; si no quiere, dile que revise las respuestas los primeros días |
| Al responder desde el panel: error de envío | Pasaron más de 24 h desde el último mensaje del cliente | Explícale la regla de WhatsApp; que le escriba desde su WhatsApp personal con el botón del panel |
| `wrangler deploy` pide login | La sesión se venció | `npx wrangler login` otra vez |
| El agente no contesta en WhatsApp | Revisa en orden: sesión sandbox `active` → webhook registrado → `webhooks:get-logs` → `/salud` | Arregla el primero que salga mal |
| El agente no contesta un chat específico | Está pausado porque el dueño tomó el control | Dile que en el panel presione **▶ Reactivar** |

## Cómo se reanuda si se cortó a medias
El progreso vive en `.progreso.json` dentro de la carpeta del agente. Léelo ANTES de
preguntar nada: si ya hay fases hechas, **no las repitas**, confírmalas y sigue desde
la primera pendiente.
```json
{ "slug": "...", "negocio": {...}, "fases": {
  "entrevista": true, "zernio": true, "cloudflare": false,
  "telegram": false, "publicado": false, "probado": false } }
```
