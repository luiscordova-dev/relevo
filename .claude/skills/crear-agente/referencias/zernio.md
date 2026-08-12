# Zernio — lo que el kit necesita

WhatsApp del agente. Todo por CLI: la persona nunca copia una llave.

## Instalar y entrar
```bash
npm install -g @zernio/cli      # o usar npx @zernio/cli en cada comando
zernio auth:login               # abre el navegador (device flow); si no abre, pégale la URL que imprime
zernio auth:check               # confirma que quedó
```

## Número de prueba (sandbox) — gratis, sin tarjeta, sin verificación
```bash
zernio whatsappsandbox:create-whats-app-sandbox-session --phone "+52..." --pretty
zernio whatsappsandbox:list-whats-app-sandbox-sessions --pretty   # status: pending → active
```
El comando devuelve `sandboxNumber` (el número al que la persona le escribe). Le llega un
mensaje de verificación: **responde cualquier cosa** y la sesión pasa a `active`.

**Límites del sandbox** (dilos antes, no después):
- 1 teléfono activo por cuenta · 50 mensajes/día · la sesión dura 7 días y se renueva igual
- El número es compartido de Zernio: sirve para probar, no para clientes reales
- **Un agente por cuenta de Zernio.** El webhook es por cuenta, no por número: dos agentes
  en la misma cuenta recibirían los mismos mensajes.

## La llave del agente (nunca se imprime)
```bash
zernio apikeys:create --name "<slug>" | \
  python3 -c "import json,sys; print(json.load(sys.stdin,strict=False)['apiKey']['key'], end='')" | \
  npx wrangler secret put ZERNIO_API_KEY
```
⚠️ El campo es **`apiKey.key`**. `apiKey` a secas es el objeto entero: guardarlo así
produce un 401 en el que se pierde tiempo.

## El id de la cuenta de WhatsApp (va como var, no es secreto)

⚠️ **No lo busques en `accounts:list`**: ahí solo salen los números que la persona compró.
La cuenta del sandbox es de Zernio y no aparece. Sácalo de la conversación que se creó
cuando la persona respondió el mensaje de verificación:

```bash
zernio inbox:conversations --platform whatsapp --pretty
# usa el accountId de la conversación cuyo accountUsername sea el sandboxNumber
```

(Si aún no hay conversación, también viene en `account.id` del primer webhook. Y ojo: en
las listas de Zernio el campo suele ser `_id`, no `id`.)
Va en `wrangler.jsonc` como `ZERNIO_ACCOUNT_ID`. **Sin él el agente contesta mensajes de
otros números de la misma cuenta.**

## Webhook
```bash
zernio webhooks:create-settings --name "<slug>" \
  --url "https://<worker>.workers.dev/webhook/zernio" \
  --secret "<el mismo que ZERNIO_WEBHOOK_SECRET>" \
  --events "message.received" --isActive true --pretty

zernio webhooks:get-settings --pretty    # ver los que hay
zernio webhooks:get-logs --pretty        # entregas reales (status, statusCode)
zernio webhooks:delete-settings --id <id>
```
Firma: `X-Zernio-Signature` = HMAC-SHA256 hex del cuerpo crudo. Hay que responder 2xx en
menos de 5 s o reintenta (hasta 7 veces).

## Forma del evento `message.received`
```
message.text · message.attachments[{type:"audio"|"image", url, payload.mimeType}]
message.platformMessageId · message.direction ("incoming")
sender.phoneNumber · sender.name
conversation.id · conversation.participantId · conversation.participantName
account.id  ← con esto se filtra
```
Los adjuntos se bajan de `attachment.url` con `Authorization: Bearer <ZERNIO_API_KEY>`.

## Responder
`POST /v1/inbox/conversations/{id}/messages` con `{accountId, message}` →
devuelve `data.messageId`. Fuera de la ventana de 24 h WhatsApp rechaza el envío.
