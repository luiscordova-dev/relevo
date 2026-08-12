# Guion del video — ~21 minutos

**Promesa del video:** que alguien lo termine **con su agente contestando**, no que
entienda cómo funciona. Todo lo que no sirva para eso, se corta.

**Negocio de ejemplo sugerido:** una panadería o un taller — algo que cualquiera entienda
en dos segundos. Evita usar un giro que compita con tu audiencia.

---

## ⚠️ Antes de grabar

**Seguridad en pantalla** — esto es lo único que no se puede corregir después:
- [ ] La **clave del panel** aparece en la URL. Grábala, pero **bórrala del agente después
      del video** (o usa un agente desechable solo para grabar)
- [ ] El **token de Telegram** de BotFather: tápalo o revócalo al terminar con `/revoke`
- [ ] La **llave de Zernio** nunca se imprime en pantalla (el kit la pasa directo), pero
      revisa que no salga en ningún scroll de terminal
- [ ] Cierra pestañas, notificaciones y cualquier chat personal

**Preparación:**
- [ ] Cuenta de Zernio y de Cloudflare **sin crear** — se crean en cámara, es parte del punto
- [ ] Terminal con letra grande (18-20 pt) y tema claro
- [ ] Celular en pantalla (grabación o espejo) para WhatsApp y Telegram
- [ ] Ten escrita la info del negocio de ejemplo, para no titubear en la entrevista
- [ ] Corre el flujo completo **una vez antes**, y borra todo. El video sale mejor cuando
      ya sabes dónde están las esperas

---

## 0:00 – 1:00 · El resultado, antes que nada

**En pantalla:** solo tu celular. Nada de terminal, nada de código.

1. Le escribes a un WhatsApp: *"¿cuánto cuesta un pastel?"* → contesta al instante
2. Le mandas una **nota de voz** → contesta lo que dijiste
3. Escribes *"me interesa, soy Ana"* → **vibra el Telegram** con la tarjeta del interesado
4. Abres el panel en el celular y ahí está la conversación

**Lo que dices:**
> "Esto que acabas de ver contesta el WhatsApp de un negocio las 24 horas, entiende notas
> de voz, y cuando alguien se interesa le avisa al dueño al instante. Lo vamos a construir
> en 30 minutos, sin saber programar y sin sacar la tarjeta ni una vez."

**Regla:** ni una palabra técnica en este minuto.

---

## 1:00 – 3:00 · Qué es, qué no es, y qué necesitas

**En pantalla:** tú, o el README.

- Qué hace: contesta, captura al interesado, te avisa
- **Qué NO hace: no agenda, no cobra, no persigue clientes.** Dilo tú, con seguridad —
  suena mejor que lo descubran contigo que solos
- Qué necesitas: **2 cuentas gratis, cero tarjetas, 30 minutos**

> "Un kit que promete pasarte con un humano y no avisa a nadie, no sirve. Aquí el aviso es
> lo primero que probamos, y no decimos que está listo hasta que llega."

---

## 3:00 – 5:00 · Clonar y arrancar

**En pantalla:** terminal, letra grande.

```bash
git clone https://github.com/USUARIO/contesta.git
cd contesta
claude
```
Y dentro: `/crear-agente`

> "De aquí en adelante ya no escribes comandos. Solo contestas preguntas."

---

## 5:00 – 9:00 · La entrevista

**En pantalla:** la conversación con Claude.

Contesta las 6 preguntas en cámara, sin cortes. Detente en la pregunta 2 y explica:

> "Esta es la que decide qué tan bueno queda tu agente. Pega todo lo que te preguntan tus
> clientes: precios, horario, lo que sea. Si escribes poco, va a decir 'no tengo esa
> información' muy seguido."

Muestra que puede pegar texto de su página o su lista de precios tal cual.

---

## 9:00 – 13:00 · Las conexiones

**En pantalla:** navegador y celular.

**Zernio (2 min):** crear cuenta → `auth:login` en el navegador → dar el número → **llega el
mensaje de verificación al WhatsApp** → responder "hola" → activa.
Aquí di claro qué es este número: *de prueba, gratis, 50 mensajes al día, un teléfono*.

**Cloudflare (2 min):** crear cuenta → aprobar en el navegador. Nada más.
> "Aquí es donde va a vivir tu agente. Sigue prendido aunque apagues tu compu."

**Telegram (1 min):** @BotFather → `/newbot` → nombre → usuario → copiar el token.
> ⚠️ **Muestra el tropiezo a propósito**: hay que darle INICIAR a **tu bot nuevo**, no a
> BotFather. Es el error más común y verlo en video se lo ahorra a la mitad de la gente.

---

## 13:00 – 16:00 · Construye y se prueba solo

**En pantalla:** la terminal trabajando.

Corta las esperas largas, pero **deja ver que hay esperas** — si lo cortas todo, la gente
cree que algo falló cuando a ellos les tarde.

Cuando salgan las 8 pruebas en verde, detente ahí:

> "Fíjate en esta: 'captura al interesado y te avisa'. No dice que mandó el aviso: dice que
> Telegram confirmó que llegó. Si no llega, esto sale en rojo y no seguimos."

Si el control de calidad cambia de modelo solo, **déjalo en el video**. Es un momento
buenísimo: la máquina se arregla sola y la persona ni se entera.

---

## 16:00 – 19:00 · El momento de la verdad

**En pantalla:** celular, pantalla completa. Este es el clímax.

Hazte pasar por cliente, en orden:
1. Una pregunta de precio → contesta con el dato exacto
2. Una **nota de voz** → contesta lo que dijiste
3. *"me interesa, soy Ana"* → 🔔 **el Telegram vibra en cámara**
4. *"quiero hablar con una persona"* → 🔴 **vibra otra vez** y el agente se calla

Luego abre el panel en el celular:
- La conversación completa
- **Escribe tú mismo desde el panel** y muestra que le llega al cliente
- Y que el agente ya no contesta encima de ti

> "Esto es lo que separa un chatbot de una herramienta: cuando algo importa, tú entras."

---

## 19:00 – 21:00 · Cómo lo haces tuyo, y el cierre

**En pantalla:** Claude Code otra vez.

Pide un cambio en voz alta y muéstralo funcionando:
> *"Sube el precio de la hogaza a $110."*

> "No abres archivos ni tocas código. Le hablas normal."

Cierra con lo honesto:
- El número es de prueba; para clientes reales le conectas el tuyo (está en la guía)
- Todo vive en tu cuenta, con tus llaves. Es tuyo
- Y tu llamado a la acción

---

## Reglas de edición

1. **Nada de acelerar la parte de las cuentas.** Es donde la gente se atora; que vean el
   ritmo real.
2. **Capítulos en YouTube** con estos mismos tiempos: la gente vuelve al paso donde se quedó.
3. **Subtítulos.** Se ve mucho en silencio.
4. **Cero cortes durante los avisos** (16:00-19:00). Si se corta, parece truco.
5. Si algo falla en la grabación y lo arreglas en cámara, **déjalo**. Ver un error resuelto
   da más confianza que un video perfecto.

## Miniatura y título

- **Miniatura:** una conversación de WhatsApp real + la tarjeta 🔔 del aviso. Nada de código.
- **Título:** que prometa el resultado, no la herramienta.
  *"Tu WhatsApp contestando solo en 30 minutos (sin saber programar)"*
- Los primeros 15 segundos deciden: arranca con el celular contestando, sin intro.
