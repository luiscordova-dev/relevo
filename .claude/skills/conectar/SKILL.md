---
name: conectar
description: 'AVANZADO · referencia sin soporte (ver AVANZADO.md): Conecta tu agente con el mundo, guiado y probado. Composio para que HAGA cosas (agendar en Google Calendar o Cal.com, escribir en Notion o Sheets, avisar a Slack, crear deals en HubSpot — 1000+ apps), y canales nuevos (Telegram, y la ruta con ManyChat para Instagram/Messenger/TikTok). Explica qué es cada cosa antes de pedirte nada, y ninguna conexión se da por hecha: todas terminan con una prueba real. Úsala con "/conectar", "quiero que agende citas", "conéctalo con mi calendario", "mándame los leads a Notion/Sheets/Slack", "quiero el agente en Instagram", "qué es Composio".'
---

# Conectar tu agente

Regla de la casa: **una conexión no está lista cuando se configuró — está lista cuando se
probó.** Cada camino de esta skill termina ejecutando la conexión de verdad y enseñando el
resultado (el evento en el calendario, la fila en el Sheet, el mensaje en Slack).

## Antes de nada: ¿qué quiere lograr?
No preguntes "¿quieres Composio?". Pregunta **qué quiere que haga su agente** y tú eliges
el camino:

| Quiere que el agente… | Camino |
|---|---|
| Agende citas (Google Calendar, Cal.com, Calendly, Outlook) | Composio |
| Guarde interesados en su CRM/tablas (Notion, Sheets, HubSpot, Airtable) | Composio |
| Avise a su equipo (Slack, Discord) | Composio |
| Mande correos (Gmail, Outlook) | Composio |
| Atienda también en Telegram | Canal directo (mismo Zernio) |
| Atienda Instagram / Messenger / TikTok | La ruta ManyChat (ver abajo) |
| Cobre | Stripe vía Composio — y díselo claro: cobrar exige más cuidado que todo lo demás |

## Qué es Composio (explícalo así, antes de pedir nada)
> Composio es una caja de conexiones: tú conectas tus cuentas (tu Google Calendar, tu
> Notion, tu Slack) UNA vez en su página, con el login normal de cada app — sin copiar
> tokens de cada servicio. Tu agente recibe una sola llave, la de Composio, y con ella
> puede usar todas las apps que tú hayas conectado. Tiene plan gratis que alcanza de sobra
> para empezar.

## Antes de elegir camino: ¿directo o por Composio?

No todo va por Composio. La regla que decide, app por app:

| La app pide… | El camino | Por qué |
|---|---|---|
| **OAuth de Google/Meta** (Calendar, Gmail, Sheets, Drive, Instagram) | **Composio** | El refresh de tokens OAuth es el dolor que Composio existe para cargar |
| **Un token simple** (Notion `ntn_…`, Slack bot/webhook) | **Directo** como capacidad `local:` — un secreto + `fetch` | Cero intermediarios, cero dependencia extra; son 20 líneas |
| **Stripe** | **Composio** (decisión del kit) | Una sola llave (`COMPOSIO_API_KEY`) cubre pagos y lo demás |
| CRMs con OAuth (HubSpot, Salesforce) | **Composio** | Mismo dolor de OAuth |
| La API propia del negocio | **Directo** (`/agregar-capacidad`) | Es SU sistema; no necesita pasarela |

Criterio para lo que no esté en la tabla: **¿la conexión pide OAuth con refresh?** →
Composio. **¿Es un token que se pega una vez?** → directo, salvo que Composio YA esté
conectado (entonces reúsalo: una llave menos que cuidar).

Ejemplo del camino directo (Notion): `wrangler secret put NOTION_TOKEN` + una capacidad
`local:guardar_en_notion` que hace `fetch` a `api.notion.com` con ese token. Se declara
en `negocio.js` igual que cualquier herramienta, y se prueba igual: con evidencia (el id
de la página creada).

## Camino A · Composio, de cero a probado

**1. La cuenta y la llave.** composio.dev → registrarse → en el dashboard, crear una
**API key** y pegártela. Guárdala tú:
```bash
echo -n "<llave>" | npx wrangler secret put COMPOSIO_API_KEY
```
⚠️ La llave del CLI (`uak_…`) NO sirve para el agente: tiene que ser la del dashboard
(`ak_…`). Si la API contesta 401 con una llave que "sí es válida", es esto.

**2. Conectar la app** (una vez por app). La conexión se autoriza en el navegador; la
inicia el endpoint de connected accounts de Composio o el dashboard mismo. Guíalo a
conectar la app que necesita para SU objetivo — no un tour por el catálogo. Verifica que
quedó:
```bash
curl -s "https://backend.composio.dev/api/v3/connected_accounts" -H "x-api-key: <llave>"
```
Cada cuenta debe salir con `"status": "ACTIVE"`. Una `EXPIRED` hay que reconectarla.

**2.5. El `user_id`: la trampa que cuesta horas.** Composio usa `user_id` como **filtro**.
Si mandas uno que no existe, la llamada no falla con un error claro — simplemente no
encuentra ninguna cuenta y TODAS las herramientas se caen con "no connected account". Y el
valor correcto **no es adivinable**: en una cuenta real puede ser algo como
`pg-test-4f2a9c1e-…`, no `default`.

El agente ya lo resuelve solo: `src/composio.js` pregunta bajo qué usuario viven las
conexiones activas y lo guarda en `ajustes`. **No pongas `COMPOSIO_USER_ID` a mano** a menos
que sepas el valor exacto: un valor equivocado gana sobre el auto-descubrimiento y deja al
agente con cero integraciones.

**3. Elegir las tools.** Búscalas con `composio search "<caso de uso>"`.
Para citas, el patrón de dos herramientas es el bueno:
- `GOOGLECALENDAR_FIND_FREE_SLOTS` → ver huecos ANTES de ofrecer
- `GOOGLECALENDAR_CREATE_EVENT` → apartar cuando el cliente ya eligió

**3.5. LEE EL ESQUEMA REAL antes de escribir la herramienta. Siempre.**
```bash
composio execute GOOGLECALENDAR_CREATE_EVENT --get-schema
```
Suena a paso opcional y no lo es: adivinar los parámetros falló dos veces seguidas en la
construcción de este kit, y cada fallo cuesta un despliegue y una prueba. Reales, ambos:

| Lo que parecía razonable | Lo que pide de verdad |
|---|---|
| `event_duration_hour: 1.5` | **Entero**. Para 1h30 usa `end_datetime`, que es más simple |
| `items: [{ id: "primary" }]` en FIND_FREE_SLOTS | Array de **strings**: `items: ["primary"]` |
| Nada sobre videollamadas | `create_meeting_room` viene en **true**: crea un Google Meet en cada cita. Para un negocio presencial, ponlo en `false` |

**4. Escribirlas en `negocio.js`** con `para` bien específico (eso es lo que lee el
cerebro para decidir cuándo usarla) y `datos` con lo que debe pedirle al cliente:
```js
herramientas: [
  { id: "ver_huecos", tool: "GOOGLECALENDAR_FIND_FREE_SLOTS",
    para: "revisar qué horarios hay libres ANTES de ofrecer una cita",
    datos: "time_min y time_max en ISO 8601 del día que pide el cliente",
    fijos: { timezone: "America/Mexico_City", items: ["primary"] } },
  { id: "agendar", tool: "GOOGLECALENDAR_CREATE_EVENT",
    para: "apartar la cita SOLO cuando el cliente ya eligió día y hora",
    datos: "summary (nombre y servicio), start_datetime y end_datetime en ISO 8601 sin zona",
    fijos: { calendar_id: "primary", timezone: "America/Mexico_City",
             create_meeting_room: false } },
],
```

**4.5. Revisa que ninguna regla del prompt le prohíba lo que ahora SÍ puede hacer.**
El prompt base dice "no puedes agendar citas ni cobrar" — y esa regla le gana a las
herramientas: el agente las tiene conectadas y aun así toma datos en vez de usarlas.
`cerebro.js` ya la hace condicional a que existan herramientas, pero si escribiste reglas
en `reglasExtra` del estilo "nunca prometas una cita", quítalas o acótalas. Esto ya mordió
antes con el anti-invento, y vuelve a morder con cada capacidad nueva.

**5. Probar de verdad — el paso que no se salta:**
1. Publica y espera 20 s.
2. Por el webhook de prueba, actúa de cliente: *"¿tienen hueco el jueves en la tarde?"* →
   el agente debe consultar ANTES de contestar (revisa `eventos` tipo `herramienta`).
3. *"va, agéndame el jueves a las 5, soy <nombre>"* → **abre el calendario real y enseña
   el evento.** Eso es estar conectado; lo demás es esperanza. Confírmalo desde fuera:
   `composio execute GOOGLECALENDAR_FIND_EVENT -d '{"query":"<nombre>","calendar_id":"primary"}'`
   y enseña el id, el título y la hora que devuelve.
4. Borra el evento de prueba (`GOOGLECALENDAR_DELETE_EVENT`) y corre la autoprueba completa.

**Atajo para probar sin gastar WhatsApp:** el panel trae un probador
(`POST /api/probar` con `{"texto":"…"}`) que corre el MISMO loop que una conversación real
y devuelve qué herramientas usó y si salieron bien. Úsalo para iterar; deja el webhook
para la prueba final.

**Si la herramienta falla**, el agente ya está diseñado para degradar con gracia (dice que
lo confirma el equipo y captura los datos) — pero tú diagnostica: `eventos` tipo
`herramienta` con `ok:false` trae el error de Composio. Los tres clásicos: conexión no
activa (paso 2), argumentos mal descritos en `datos`, y timezone sin especificar.

## Camino B · Telegram como canal (el mismo agente, otra puerta)
Zernio maneja Telegram con la misma API de inbox. Alta: conectar el bot en Zernio,
verificar que sus mensajes llegan al webhook (`zernio webhooks:get-logs`) y que el filtro
por cuenta del agente los acepta. **Advertencia honesta: prueba esto de punta a punta
antes de prometerlo** — si el payload difiere, el ajuste va en `src/index.js` (el evento
trae `platform`).

## Camino C · Instagram / Messenger / TikTok vía ManyChat
Meta pide apps verificadas para sus DMs; la ruta práctica es ManyChat como front:
1. ManyChat conecta IG/Messenger/TikTok (su flujo de siempre, con login de Meta)
2. En ManyChat, un paso de "External Request" manda el mensaje al agente:
   `POST <worker>/webhook/manychat` con un secreto compartido
3. El agente contesta en el mismo request y ManyChat lo entrega
Esto requiere agregar la ruta `/webhook/manychat` (patrón request/response, distinto a
Zernio). Es un bloque de trabajo — preséntalo como "siguiente capítulo", no lo improvises
en una tarde con el usuario esperando.

## El cierre de toda conexión
> Conectado y probado: tu agente agendó una cita real en tu calendario (ya la borré).
> Le costó $0.0004. Si un día quieres quitarlo, me dices "quita el calendario" y listo.
