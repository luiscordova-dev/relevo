# Tu WhatsApp contestando solo — guía de principio a fin

*(Escrita para el dueño del negocio: no da por hecho que sabes programar. Si eres
técnico y vas a entregarle esto a un cliente, tu punto de partida es el
[README](README.md); esta guía puedes entregársela tal cual.)*

**Lo que vas a lograr:** en unos 30 minutos le vas a escribir a un número de WhatsApp desde
tu propio celular, tu agente te va a contestar con la información de tu negocio, y cuando
te hagas pasar por cliente interesado te va a llegar un aviso a tu Telegram.

---

## Antes de empezar

Ten a la mano:
- **Tu celular**, con WhatsApp y Telegram
- **Lo que te preguntan tus clientes** — precios, servicios, horario. Si lo tienes en un
  archivo o en tu página, mejor: se lo pasas tal cual
- **Media hora sin interrupciones**

No necesitas tarjeta. Ningún paso te la va a pedir.

---

## Paso 1 · Abre el kit (2 minutos)

Abre la Terminal de tu computadora y pega esto, línea por línea:

```bash
git clone https://github.com/luiscordova-dev/relevo.git
cd relevo
claude
```

*Si nunca has usado Claude Code, primero instálalo:*
```bash
npm install -g @anthropic-ai/claude-code
```

Cuando veas que Claude Code arrancó, escribe:

```
/crear-agente
```

> 📸 *[captura: la terminal con /crear-agente escrito]*

De aquí en adelante ya no vas a escribir comandos. Solo contestas.

---

## Paso 2 · Cuéntale de tu negocio (5 minutos)

Claude te va a hacer seis preguntas, una por una:

1. Cómo se llama tu negocio y qué vendes
2. **Lo que más te preguntan tus clientes** — esta es la importante. Pega todo: precios,
   servicios, promociones. Escríbelo como se lo explicarías a un empleado nuevo
3. Horario, dónde estás y cómo te pagan
4. Qué **no** debe decir tu agente
5. Cómo se va a llamar tu agente y cómo quieres que hable (cercano, formal o divertido)
6. Si quieres usar la inteligencia artificial incluida (gratis) o la tuya

> 💡 **Mientras más específico seas en la pregunta 2, mejor contesta tu agente.**
> Si escribes poco, va a decir "no tengo esa información" muy seguido.

---

## Paso 3 · Conecta tu WhatsApp de prueba (6 minutos)

Claude te va a pedir que crees una cuenta gratis en **zernio.com**. Es gratis y no pide
tarjeta.

Después te va a pedir tu número de WhatsApp con lada (ejemplo: +52 33 1234 5678). Con eso
te va a llegar **un mensaje de verificación a tu WhatsApp**. Respóndele cualquier cosa —
un "hola" basta — y avísale a Claude.

> 📸 *[captura: el mensaje de verificación en WhatsApp]*

**Sobre este número:** es un número de prueba compartido, gratis. Sirve para que veas tu
agente funcionando: 50 mensajes al día, un teléfono. Cuando quieras atender clientes de
verdad le conectas tu propio número.

---

## Paso 4 · La casa de tu agente (5 minutos)

Ahora una cuenta gratis en **cloudflare.com**. Ahí es donde va a vivir tu agente, prendido
todo el día aunque apagues tu computadora.

Claude te va a abrir el navegador un par de veces para que apruebes. Solo das clic.

> 📸 *[captura: la pantalla de aprobación de Cloudflare]*

---

## Paso 5 · Los avisos (3 minutos)

Esta parte es la que hace que no se te escape nadie.

En **Telegram**, busca **@BotFather** (el que tiene palomita azul) y mándale:

```
/newbot
```

Te va a pedir dos cosas:
- Un **nombre** — el que quieras, por ejemplo "Avisos de mi negocio"
- Un **usuario** — tiene que terminar en `bot`, por ejemplo `avisos_mi_negocio_bot`

Te va a contestar con un código largo. **Cópialo y pégaselo a Claude.**

> ⚠️ **El tropiezo más común:** después de crear el bot, tienes que abrir **tu bot nuevo**
> (no BotFather) y presionar el botón **INICIAR**. Si no, los avisos no saben a dónde
> llegar. Claude te va a pasar el link directo.

> 📸 *[captura: el botón INICIAR del bot]*

---

## Paso 6 · Claude construye y prueba (5 minutos)

Aquí no haces nada. Claude escribe tu agente, lo publica en internet y le corre su
tanda de pruebas: que conteste bien, que no invente, que entienda audios y fotos, que
capture interesados y **que el aviso llegue de verdad a tu Telegram**.

Si algo sale mal, lo arregla solo y te dice qué pasó en español.

> 📸 *[captura: las pruebas en verde]*

---

## Paso 7 · Pruébalo tú (5 minutos) — el momento de la verdad

Abre tu WhatsApp y escríbele al número que te dio Claude. Haz de cliente:

1. **Pregúntale algo de tu negocio** — "¿cuánto cuesta X?"
2. **Mándale una nota de voz** — a ver si te entiende
3. **Dile que te interesa y dale tu nombre** — *"me interesa, soy Ana"*
4. **Pídele hablar con una persona** — *"quiero hablar con alguien"*

Deberías recibir **dos avisos en tu Telegram**: uno 🔔 cuando diste tu nombre y otro 🔴
cuando pediste un humano.

> 📸 *[captura: los dos avisos en Telegram]*

**Si te llegaron los dos, ya está.** Tu agente funciona.

---

## Tu bandeja de entrada

Claude te va a dar un link como este:

```
https://tu-negocio.workers.dev/panel
```

La primera vez te pide tu clave (te la dio Claude al terminar; si alguien más te armó
el agente, pídesela). Después de
entrar, la sesión queda iniciada en tu dispositivo — no la tecleas cada vez. Para
salir, abajo a la izquierda: **Mi cuenta → Salir**.

Ábrelo en tu celular y **guárdalo en la pantalla de inicio**. Ahí tienes:

- Todas tus conversaciones, completas
- Quién se interesó y qué quería
- Un botón para escribirle a cada quien por WhatsApp
- Y lo más útil: **puedes tomar el control y contestar tú mismo**. Cuando lo haces, tu
  agente se calla en ese chat para no interrumpirte, hasta que le des "Sigue el agente"

> 📸 *[captura: el panel en el celular]*

---

## Si algo sale mal

Vuelve a Claude Code y dile qué pasó, con tus palabras. Los tropiezos comunes ya están
mapeados con su solución.

Los tres más frecuentes:

| Lo que pasa | Qué hacer |
|---|---|
| No llegan los avisos a Telegram | Abre **tu** bot (no BotFather) y presiona INICIAR |
| El agente no contesta en WhatsApp | Revisa que hayas respondido el mensaje de verificación |
| El agente no contesta un chat en específico | Está en pausa porque tomaste el control. En el panel, dale **"Sigue el agente"** |

---

## ¿Y ahora qué?

- **Cámbiale cosas** hablándole normal a Claude → [ideas aquí](docs/personalizar.md)
- **Conéctale tu propio número** para que te escriba cualquiera, no solo tu teléfono →
  [cómo hacerlo](docs/ir-a-produccion.md). Ojo antes de decidir: ese número **deja la app
  de WhatsApp de tu celular**, y tiene una renta mensual (desde $3 USD). Por eso casi
  siempre conviene un número nuevo, y dejar el de siempre en tu teléfono.
- **Que te llegue un resumen por correo** cada noche — pídeselo a Claude, son 3 minutos
