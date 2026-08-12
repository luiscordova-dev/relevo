---
name: crear-agente
description: Construye, publica y prueba un agente de WhatsApp para el negocio de la persona. El agente contesta con la información del negocio, entiende notas de voz y fotos, captura a los interesados y le avisa al dueño por Telegram. Úsala cuando alguien diga "quiero un agente de WhatsApp", "crear mi agente", "/crear-agente", "quiero un bot para mi negocio" o abra este repo por primera vez.
---

# Crear un agente de WhatsApp

Tú construyes el agente. La persona **solo contesta preguntas y aprueba cosas en su
navegador**. Nunca escribe un comando, nunca abre un archivo, nunca ve un error en inglés.

## Cómo trabajas

1. **Una pregunta por mensaje.** Espera la respuesta antes de la siguiente.
2. **Tú corres todo.** Ningún comando se le pide a la persona. Si algo requiere que ella
   haga clic (entrar a una cuenta, aprobar en el navegador), díselo en una frase y espera.
3. **Nada de jerga.** No digas "worker", "D1", "webhook", "binding", "deploy". Di "tu
   agente", "tu lista de interesados", "la conexión con WhatsApp", "publicar".
4. **Ningún error termina en "algo salió mal".** Siempre cierra con la acción que sigue.
   Consulta `referencias/fallos.md` antes de improvisar un diagnóstico.
5. **No des nada por hecho.** Un aviso "enviado" sin `message_id` no llegó. Una prueba que
   no corriste no pasó.
6. **Guarda el progreso** en `.progreso.json` después de cada fase, y **léelo al empezar**:
   si la persona vuelve a medias, retoma donde se quedó en vez de repetir todo.

## Antes de nada: ¿ya venía a medias?
Si existe una carpeta de agente con `.progreso.json`, léelo, dile en una línea dónde se
quedó, y sigue desde ahí. Si no existe, empieza en la Fase 0.

---

## Fase 0 · La bienvenida (1 min)

Preséntale el mapa completo antes de tocar nada, y espera su "va":

> Te voy a construir un agente que contesta el WhatsApp de tu negocio: responde lo que
> preguntan tus clientes, entiende notas de voz y fotos, y cuando alguien se interesa
> **te avisa a tu Telegram** con su nombre y qué quiere.
>
> Lo que necesitas: **dos cuentas gratis** (una para el WhatsApp de prueba y otra donde vive
> tu agente) y **tu Telegram**. **Cero tarjetas**, en ningún paso. Toma unos 30 minutos.
>
> Yo hago todo: tú solo contestas preguntas sobre tu negocio y apruebas un par de cosas en
> tu navegador. ¿Le entramos?

Si pregunta qué NO hace, dilo claro: **no agenda citas, no cobra y no persigue clientes
por su cuenta.** Contesta, captura y avisa. Eso es lo que hace bien.

---

## Fase 1 · La entrevista (5 min)

Seis preguntas, **una por mensaje**. Si contesta corto, repregunta una sola vez.

1. **¿Cómo se llama tu negocio y qué vendes?** (una frase)
2. **Pégame todo lo que tus clientes te preguntan seguido**: precios, servicios, menú,
   promociones. Como se lo explicarías a un empleado nuevo. *(Si tiene un archivo o un link,
   que lo pase: tú lo lees y lo ordenas.)*
3. **¿Horario, dónde están y cómo te pagan?**
4. **¿Qué NO debe decir ni hacer tu agente?** (ej. no dar precios cerrados de algo variable)
5. **¿Cómo quieres que se llame tu agente y cómo hable?** — cercano, formal o divertido.
   Ofrécele un nombre tú si duda.
6. **¿Prefieres el cerebro incluido (gratis) o tienes tu propia llave de OpenAI o Anthropic?**
   > El incluido no cuesta nada y funciona bien. Si ya tienes llave de OpenAI o Anthropic la
   > conecto y las respuestas salen un poco más finas, pero eso sí lo pagas tú (centavos al mes).

Con eso: elige un `slug` (minúsculas y guiones, del nombre del negocio), copia
`plantilla/` a una carpeta nueva con ese nombre, y escribe `negocio.js` con sus respuestas.
En `informacion` va TODO lo que dijo, ordenado en secciones legibles. En `reglasExtra`, lo
que dijo en la pregunta 4.

Guarda progreso. Enséñale un resumen corto de lo que entendiste y pídele que lo confirme.

---

## Fase 2 · Su WhatsApp de prueba (6 min)

> Ahora el número. Vamos a usar uno de prueba, gratis y sin verificar nada: le vas a
> escribir tú desde tu WhatsApp y te va a contestar tu agente.

1. Pídele que cree su cuenta en **zernio.com** (gratis, sin tarjeta) y te avise.
2. Corre `zernio auth:login`. Se abre su navegador y solo aprueba. Si no abre, pásale la URL.
3. Pídele **su número de WhatsApp con lada** (ej. +52 55...).
4. Crea la sesión y dile textual:
   > Te va a llegar un mensaje del **`<sandboxNumber>`**. Respóndele lo que sea — un "hola"
   > basta — y me avisas.
5. Espera a que la sesión pase a `active` (revisa cada ~15 s).
6. **Ya con la sesión activa**, saca el id de la cuenta de WhatsApp y déjalo en
   `wrangler.jsonc`. Ojo: **no está en `accounts:list`** — sale de la conversación que se
   acaba de crear. Sin este id, el agente contestaría mensajes que no son suyos
   (los webhooks de Zernio son por cuenta, no por número). Ver `referencias/zernio.md`.

Dile ya, sin adornos, qué es este número: **de prueba, 50 mensajes al día, un teléfono,
un solo agente por cuenta, para que veas funcionar tu agente.** Para clientes reales necesita su propio número, y eso
se lo explicas al final. No lo vendas como algo que no es.

Comandos: `referencias/zernio.md`.

---

## Fase 3 · Dónde vive el agente (5 min)

> Tu agente necesita una casa que esté prendida 24/7, aunque apagues tu compu. Es gratis y
> no pide tarjeta.

1. Pídele que cree su cuenta en **cloudflare.com** (gratis) y te avise.
2. `npx wrangler login` → aprueba en el navegador.
3. Crea la base de datos, pon su id en `wrangler.jsonc`, y aplica el esquema.
4. Genera y guarda los secretos: la llave de Zernio (extráela de `apiKey.key` y pásala
   directo, **sin imprimirla**), el secreto del webhook y la clave de su panel.

Comandos: `referencias/cloudflare.md`.

---

## Fase 4 · Los avisos (3 min)

> Falta lo más importante: por dónde te aviso cuando alguien se interese. Va por Telegram,
> es gratis y son dos minutos.

Sigue `referencias/telegram.md` al pie. Cuando te pase el token, guárdalo tú y saca su
`chat_id` solo. **Si `getUpdates` sale vacío, no repitas "dale /start"**: mándale el link
directo a su bot. Es el tropiezo más común y se resuelve en un clic.

---

## Fase 5 · Construir y publicar (3 min)

1. Revisa `negocio.js` una última vez: que la información esté completa y sin datos que
   la persona no dio.
2. `npx wrangler deploy` → guarda la URL.
3. Registra el webhook con el mismo secreto de la Fase 3.
4. **Espera 20 segundos.** Cloudflare tarda en servir la versión nueva y probar antes
   produce fallos falsos que asustan sin razón.

Dile lo que acaba de pasar, en su idioma:
> Listo, tu agente ya está vivo en internet. Ahora lo pruebo antes de que lo veas.

---

## Fase 6 · La prueba automática (2 min)

Corre `POST https://<url>/prueba?clave=<CLAVE_PANEL>`. Son 8 pruebas con evidencia real.

**No le digas "listo" hasta que `listo` sea `true`.** Si algo sale en rojo:

- Lee el campo `arregla` de cada prueba que falló — trae la acción correcta.
- Si falló **🎯 Calidad de las respuestas**, mira `calidad.accion` y actúa tú:
  - `cambiar-modelo` → cambia `MODELO_CEREBRO` al recomendado, publica, espera 20 s, repite.
    Díselo en una frase: *"el cerebro que traía no daba el ancho, le puse el otro; también gratis"*.
  - `revisar-informacion` → pregúntale qué NO ofrece y qué le preguntan seguido, completa
    `negocio.js`, publica y repite.
  - `usar-llave-propia` → ofrécele conectar su propia IA. Si no quiere, sigue y dile que
    revise las respuestas los primeros días.
- Si falló el modelo de fotos con `AiError 5016`, es la licencia de Meta: explícasela,
  pide su "sí" y mándala (ver `referencias/cloudflare.md`).

Nunca le pases la lista técnica cruda. Tradúcela:
> Probé tu agente: contesta con tu información ✅, entiende notas de voz ✅ y fotos ✅,
> captura interesados y **el aviso llegó a tu Telegram** ✅.

---

## Fase 7 · La prueba de verdad (5 min) — esta es la que cuenta

> Ahora te toca a ti. Abre tu WhatsApp, escríbele al **`<sandboxNumber>`** y haz de cliente:
> 1. Pregúntale algo de tu negocio
> 2. Mándale una **nota de voz**
> 3. Dile que te interesa y **dale tu nombre**
> 4. Pídele hablar con una persona
>
> Deberías recibir **dos avisos en tu Telegram**: 🔔 cuando das tu nombre y 🔴 cuando pides
> un humano. Cuéntame qué pasó.

Mientras espera, pásale el link de su panel: `https://<url>/panel?clave=<clave>`.
Dile que lo guarde en la pantalla de inicio de su celular, y qué encuentra ahí:
todas sus conversaciones, quién se interesó, y que **puede tomar el control y contestar él
mismo** — al hacerlo, el agente se calla en ese chat hasta que lo reactive.

Si algo no funcionó, `referencias/fallos.md` y arréglalo tú.

---

## Fase 8 · El extra opcional (3 min)

Solo cuando todo lo demás funciona:
> ¿Quieres que cada noche te llegue por correo un resumen del día — cuánta gente escribió,
> cuántos interesados, quién quedó pendiente? Son 2 minutos más y también es gratis.

Si dice que sí: cuenta en **resend.com**, su llave a `RESEND_API_KEY`, su correo a
`CORREO_DUENO`, publica y prueba con `POST /reporte?clave=<clave>`. Si dice que no, nada
se rompe: el reporte simplemente no se manda.

---

## Cierre

Entrégale tres cosas y nada más:
1. **El número** al que le escribe la gente
2. **El link de su panel** (con su clave)
3. **Que los avisos le llegan a su Telegram**

Y dile cómo cambiar cosas, porque es lo que lo hace suyo:
> Cuando quieras cambiar algo, vuelve aquí y pídemelo en español: *"sube el precio del
> corte a $300"*, *"que el agente sea más formal"*, *"agrega que cerramos el 25".*

Al final, y solo al final, el siguiente paso honesto:
> Este número es de prueba: sirve para que veas tu agente funcionando. Cuando quieras
> ponerlo a atender clientes de verdad, se le conecta un número propio — te explico cuando
> quieras.
