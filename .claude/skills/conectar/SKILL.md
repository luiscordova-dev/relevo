---
name: conectar
description: Conecta tu agente con el mundo, guiado y probado. Composio para que HAGA cosas (agendar en Google Calendar o Cal.com, escribir en Notion o Sheets, avisar a Slack, crear deals en HubSpot — 1000+ apps), y canales nuevos (Telegram, y la ruta con ManyChat para Instagram/Messenger/TikTok). Explica qué es cada cosa antes de pedirte nada, y ninguna conexión se da por hecha: todas terminan con una prueba real. Úsala con "/conectar", "quiero que agende citas", "conéctalo con mi calendario", "mándame los leads a Notion/Sheets/Slack", "quiero el agente en Instagram", "qué es Composio".
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
quedó: `GET /api/v3/connected_accounts` debe listar la app con status activo.

**3. Elegir las tools.** Búscalas con `composio search "<caso de uso>"` (o el endpoint de
tools). Para citas, el patrón de dos herramientas es el bueno:
- `GOOGLECALENDAR_FIND_FREE_SLOTS` → ver huecos ANTES de ofrecer
- `GOOGLECALENDAR_CREATE_EVENT` → apartar cuando el cliente ya eligió
Pitfalls conocidos de calendario: datetimes ISO **con timezone**; `event_duration_minutes`
solo hasta 59 (usa horas para 1h+); el id del evento viene anidado en `response_data`.

**4. Escribirlas en `negocio.js`** con `para` bien específico (eso es lo que lee el
cerebro para decidir cuándo usarla) y `datos` con lo que debe pedirle al cliente:
```js
herramientas: [
  { id: "ver_huecos", tool: "GOOGLECALENDAR_FIND_FREE_SLOTS",
    para: "revisar qué horarios hay libres ANTES de ofrecer una cita",
    datos: "el día que pide el cliente",
    fijos: { calendar_id: "primary" } },
  { id: "agendar", tool: "GOOGLECALENDAR_CREATE_EVENT",
    para: "apartar la cita SOLO cuando el cliente ya eligió día y hora",
    datos: "nombre del cliente, día y hora exacta",
    fijos: { calendar_id: "primary" } },
],
```

**5. Probar de verdad — el paso que no se salta:**
1. Publica y espera 20 s.
2. Por el webhook de prueba, actúa de cliente: *"¿tienen hueco el jueves en la tarde?"* →
   el agente debe consultar ANTES de contestar (revisa `eventos` tipo `herramienta`).
3. *"va, agéndame el jueves a las 5, soy <nombre>"* → **abre el calendario real y enseña
   el evento.** Eso es estar conectado; lo demás es esperanza.
4. Borra el evento de prueba y corre la autoprueba completa (8/8).

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
