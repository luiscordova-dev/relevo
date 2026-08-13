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

---

# Número propio (producción)

> Esta sección es la ruta que promete `docs/ir-a-produccion.md`. El sandbox NO sirve para
> clientes reales: solo habla con el teléfono que lo activó. Para que cualquiera le
> escriba hace falta un número propio.

## ⚠️ Lo primero que hay que decirle a la persona: NO hay coexistencia

Un número en Cloud API **deja de vivir en la app de WhatsApp Business del celular**. No se
puede tener el mismo número contestando en la app y en la API a la vez — Zernio no expone
coexistencia (no hay comandos de `coexist`/`migrate`/`import` en el CLI).

Consecuencias que hay que decir **antes** de que compre nada:
- Si el negocio ya atiende a diario desde la app de WhatsApp Business con ese número,
  migrarlo significa que dejan de contestar desde el celular: **el panel pasa a ser su
  celular** para ese número.
- Por eso lo sano casi siempre es **un número nuevo** para el agente, y dejar el de
  siempre intacto en el teléfono.
- Si de verdad necesita coexistencia (mismo número en app + API), eso es otra plataforma;
  no lo prometas desde aquí.

## Camino A · Comprar el número en Zernio (lo normal)

```bash
zernio whatsappphonenumbers:list-whats-app-number-countries --pretty   # precio, KYC y stock
zernio whatsappphonenumbers:search-available-whats-app-numbers --country MX --pretty
zernio whatsappphonenumbers:purchase-whats-app-phone-number --profileId <id> --country MX --pretty
```

Precios reales (verificados contra la API, mensual, además del costo de conversaciones
que cobra WhatsApp aparte):

| País | Precio | ¿KYC? | Nota |
|---|---|---|---|
| 🇺🇸 US | $3.00 | **No** | el más rápido de encender |
| 🇪🇸 ES | $3.00 | Sí | national |
| 🇲🇽 MX | $6.00 | Sí | local |
| 🇨🇱 CL | $9.00 | Sí | local |
| 🇦🇷 AR | $9.00 | Sí | **sin stock** al verificar |
| 🇨🇴 CO | $21.00 | No | mobile |

**La compra cuesta dinero: nunca la corras tú.** Enséñale el precio, que él confirme, y
que la ejecute él o te lo pida explícitamente.

`--profileId` sale de `zernio profiles:list --pretty`.

**Si el país pide KYC** (casi toda LATAM), el número queda pendiente hasta aprobarse:
```bash
zernio whatsappphonenumbers:get-whats-app-number-kyc-form --pretty          # qué piden
zernio whatsappphonenumbers:validate-whats-app-number-kyc-address --pretty  # tier 4, pre-valida
zernio whatsappphonenumbers:upload-whats-app-number-kyc-document --pretty
zernio whatsappphonenumbers:submit-whats-app-number-kyc --pretty
zernio whatsappphonenumbers:get-whats-app-number-remediation <id> --pretty  # si lo rechazan
zernio whatsappphonenumbers:remediate-whats-app-number <id> --pretty
```

## Camino B · Traer una WABA que ya tiene (BYO)

Solo si el negocio **ya** está en Cloud API con otro proveedor:
```bash
zernio connect:whats-app-credentials \
  --profileId <id> --wabaId <waba> --phoneNumberId <phone> --accessToken <token> --pretty
zernio connect:list-whats-app-phone-numbers --profileId <id> --tempToken <tmp> --pretty
zernio connect:complete-whats-app-phone-number-selection --pretty
```
El `accessToken` es un secreto: que lo pegue él, y **no lo repitas en el chat ni lo dejes
en un archivo**.

## Verificar que quedó vivo (evidencia, no fe)

```bash
zernio accounts:list --pretty          # el nuevo accountId de platform "whatsapp"
zernio whatsappphonenumbers:get-whats-app-number-info --accountId <accountId> --pretty
```
Lo que hay que leer del resultado, y qué significa cuando muerde:

| Campo | Lo que quieres ver | Si no |
|---|---|---|
| `status` | `CONNECTED` | aún no terminó de registrarse |
| `platform_type` | `CLOUD_API` | no es un número de API |
| `quality_rating` | `GREEN` | lo están reportando |
| `health_status.can_send_message` | `AVAILABLE` | ver `errors[]` abajo |
| `name_status` | aprobado | el límite no sube hasta que aprueben el nombre |

Dos errores que salen seguido y **no** son culpa del kit:
- **141006 · payment method** — bloquea las conversaciones *iniciadas por el negocio*.
  Hay que poner método de pago en el Business Manager de Meta. Contestar dentro de la
  ventana de 24 h sigue funcionando.
- **`code_verification_status: EXPIRED`** — hay que reverificar el número.

## Apuntar el agente al número nuevo

El agente no cambia; solo cambia a qué cuenta escucha.
```bash
# 1) en wrangler.jsonc: ZERNIO_ACCOUNT_ID = el accountId NUEVO
grep ZERNIO_ACCOUNT_ID wrangler.jsonc
# 2) el webhook es POR CUENTA: hay que crear el del número nuevo
zernio webhooks:create-settings --name "<slug>-prod" \
  --url "https://<worker>.workers.dev/webhook/zernio" \
  --secret "<el mismo ZERNIO_WEBHOOK_SECRET>" \
  --events "message.received" --isActive true --pretty
# 3) publicar y esperar ~20 s
npx wrangler deploy
```
⚠️ **Un agente por cuenta de Zernio.** Si dejas vivo el webhook del sandbox junto al de
producción, los dos agentes reciben los mismos mensajes. Borra el viejo:
`zernio webhooks:delete-settings --id <id>`.

Cierra corriendo la autoprueba (`POST /prueba?clave=…`) y que la persona le escriba
desde un teléfono **que no sea** el que activó el sandbox: ese es el punto — que ahora
cualquiera puede.
