# EL KIT — Diseño aprobado
**Fecha:** 2026-08-12 · **Estado:** aprobado por Luis · **Siguiente paso:** plan de implementación

---

## La promesa (el contrato)

> "En 30 minutos tienes un agente de WhatsApp vivo 24/7 contestando con la info
> de TU negocio, capturando interesados y avisándote por Telegram."

Si algo pone en riesgo esta frase, se corta. **Límites duros e innegociables:**
- Máximo **2 cuentas nuevas** en el flujo core (Zernio + Cloudflare)
- **Cero tarjeta** en todo el flujo — ningún paso puede pedir pago
- La persona **no programa** y **no ejecuta comandos**: todo lo corre Claude Code

## Qué es

Una **SKILL que construye el agente** — no un repo que se forkea. La persona
clona el repo público, abre Claude Code, escribe `/crear-agente`, describe su
negocio, y la skill genera + despliega + prueba su agente. Se replica el patrón.

**Las tres piezas del lead magnet** (sin las tres no es un imán):
1. El repo con la skill
2. `GUIA.md` — guía escrita corta para alguien cero técnico
3. Video tutorial ~21 min (estilo FÁBRICA)

## Qué hace el agente generado

1. Contesta con la información del negocio de la persona
2. **Captura** al interesado (nombre + qué quiere; el teléfono lo da WhatsApp)
3. **Avisa** al dueño por Telegram — probado con evidencia, no asumido

## Qué NO hace (a propósito)

⛔ No agenda citas. No cobra. No hace seguimiento solo.
Estas exclusiones se comunican en README y video como decisión, no como carencia.

## El hueco que tapa

El kit de referencia (el kit de referencia) promete en su prompt
"conectarte con alguien del equipo" (CLAUDE.md:326) pero sus herramientas de
registro/aviso/escalación están comentadas sin implementar (CLAUDE.md:950-960).
El interesado se pierde y el dueño nunca se entera. **Que la captura y el aviso
SÍ funcionen — probados — es el requisito #1 de este kit.**

## De qué no se copia nada

- Del kit de referencia: ni código, ni prompts, ni README, ni textos, ni el
  cierre con el Instagram de su autor. Solo la IDEA de la estructura.
- Del producto de terceros que sirvió de referencia: ni una línea de código ni copy. Es producto de un
  tercero (Luis tiene licencia de uso, no de redistribución). Sirvió como
  **catálogo de inspiración** de superpoderes y como prueba de existencia
  técnica (ej. Zernio sí entrega audios/fotos por webhook). El patrón de
  presentación "nombre + tagline + cómo funciona" se replica con textos 100%
  propios.

---

## Arquitectura

```
Cliente escribe al número sandbox de Zernio
        │ webhook
        ▼
Cloudflare Worker (plan free, 24/7)
        ├─ Cerebro: Workers AI (Llama 3.3 70B; alt: GPT-OSS-120B)
        │    + prompt con la info del negocio + reglas anti-invento
        ├─ Audio entrante → Whisper (Workers AI) → transcripción al cerebro
        ├─ Foto entrante → Llama Vision (Workers AI) → descripción al cerebro
        ├─ Responde por la API de Zernio (ventana 24h, freeform)
        ├─ Captura completa (nombre + interés) →
        │    ├─ guarda lead en D1
        │    └─ tarjeta 🔔 a Telegram (verificada con message_id)
        ├─ Pide humano o queja →
        │    ├─ tarjeta 🔴 URGENTE a Telegram
        │    └─ agente se pausa en ESE chat 1 hora
        │       (avisa al cliente "ya le avisé al equipo")
        └─ Cron nocturno → reporte diario por CORREO (opcional, ver abajo)

Panel: tu-negocio.workers.dev/panel?clave=xxx
        └─ Tabla de leads desde el celular, botón wa.me por lead
```

**Decisión clave de robustez** (donde el kit de referencia se murió): la captura
NO depende de tool-calling del modelo. El Worker detecta un bloque JSON
estructurado en la respuesta del cerebro, lo separa del texto visible, y ejecuta
guardado + aviso con **código determinista**.

### Cuentas y costos

| Pieza | Cuenta | ¿Nueva? | ¿Tarjeta? |
|---|---|---|---|
| WhatsApp sandbox (número compartido, 1 tel, 50 msg/día, sesión 7 días) | Zernio | ✅ #1 | No |
| Hosting + D1 + LLM + Whisper + Vision + cron | Cloudflare | ✅ #2 | No |
| Claude que construye | Anthropic | Ya la tienen (Claude Code es prerequisito) | No |
| Avisos | Telegram | App personal; bot = chat con BotFather | No |
| Reporte diario por correo | Resend | Opcional (paso final, fuera del core) | No |

### Canales de salida — regla aprobada

- **Telegram: SOLO avisos.** Lead capturado (🔔 tarjeta con nombre, teléfono,
  interés, botón wa.me) y escalación (🔴 URGENTE).
- **Correo: el reporte diario.** Resumen nocturno (conversaciones, interesados,
  escalaciones, lo más preguntado) vía **Resend** — paso OPCIONAL al final del
  setup (~3 min, gratis, sin tarjeta; su free tier manda al correo del dueño de
  la cuenta, que es el único destinatario necesario). El core del kit no
  depende de esto y queda en 2 cuentas.

---

## Superpoderes del agente (mapeo final vs catálogo de referencia)

| Superpoder | Estado | Implementación |
|---|---|---|
| 🛡️ Anti-invento | ✅ Default | Reglas duras en prompt: nunca inventar precios/datos; si no está en la info, lo admite y captura al interesado |
| 🎙️ Oído (notas de voz) | ✅ Default | Whisper en Workers AI |
| 👁️ Vista (fotos) | ✅ Default | Llama Vision en Workers AI |
| 🙋 Pase a humano | ✅ Default | Dispara con: pide humano o queja. Aviso 🔴 + pausa 1h en ese chat |
| 📊 Reporte diario | ✅ Opt-in | Cron → correo vía Resend (paso opcional final) |
| 🗣️ Voz de marca | ✅ Default | Nombre + tono (cercano/formal/divertido) en la entrevista |
| Vigilante | ✅ Cubierto | Su esencia = nuestros dos avisos (lead caliente + queja) |
| Multi-idioma | ⛔ Fuera | Decisión de Luis |
| Cazador (seguimiento) | ⛔ Fuera | Regla "no hace seguimiento solo" |
| Recupera no-shows | ⛔ Fuera | Sandbox sin plantillas fuera de 24h |
| Cobros | ⛔ Fuera | Regla "no cobra" + tarjeta |
| Encuestas / Reseñas | 📄 Docs | "Pídele a Claude que te lo agregue" (personalización post-kit) |

---

## La entrevista al dueño (6 preguntas, ~5 min)

1. ¿Cómo se llama tu negocio y qué vendes? (una frase)
2. Pégame todo lo que un cliente te suele preguntar: precios, servicios, menú,
   promos — texto libre o arrastra un archivo (la skill lo estructura)
3. ¿Horario, ubicación/zona, y cómo te pagan?
4. ¿Qué dato mínimo hace que un interesado "valga la pena"?
   (default: nombre + qué quiere)
5. ¿Nombre y tono del agente? (default listo para saltársela)
6. ¿A qué Telegram te aviso? (se resuelve al conectar el bot)

Las credenciales NO van en la entrevista: se piden en el momento de conectar
cada pieza, guiado por la skill.

## El flujo de los 30 minutos

| Min | Qué pasa | Quién |
|---|---|---|
| 0-3 | Clonar + `claude` + `/crear-agente` | persona |
| 3-8 | Entrevista de negocio | skill pregunta |
| 8-14 | Cuenta Zernio + sesión sandbox (verificación en su WhatsApp) | skill guía |
| 14-19 | Cuenta Cloudflare + `wrangler login` (OAuth navegador) | skill guía |
| 19-24 | Bot Telegram (BotFather) + skill genera, despliega, registra webhook | skill |
| 24-27 | Prueba automática E2E | skill |
| 27-30 | Prueba humana con guion de cliente falso → aviso vibra | persona |
| +3 opc | Reporte diario por correo (cuenta Resend) | skill guía |

## Pruebas de punta a punta

**Automática** (la skill no dice "listo" sin esto, con evidencia):
- Inyecta mensaje de texto de cliente falso → respuesta generada ✓
- Inyecta el **audio de prueba empaquetado** en la skill → transcripción ✓
- Inyecta la **foto de prueba empaquetada** → descripción ✓
- Flujo de captura completo → lead escrito en D1 ✓
- Aviso Telegram → **message_id confirmado por la API** ✓
- Frase de escalación → tarjeta 🔴 + chat pausado ✓

**Humana** (la vara del usuario): guion de cliente falso incluido en la guía
("pregunta el precio, di que te interesa, deja tu nombre, manda una nota de
voz") → el aviso llega al Telegram del dueño. Es lo que sale en el video.

## Manejo de atorones

- Principio: la persona nunca ejecuta comandos ni ve stack traces — Claude Code
  corre todo y traduce.
- Mapa de fallos conocidos → mensaje en español + LA acción siguiente concreta
  (ej. API key mal copiada → URL exacta para recopiarla; sesión sandbox
  expirada → "responde el mensaje de verificación en tu WhatsApp").
- Checkpoints por fase (Zernio ✓ → Cloudflare ✓ → deploy ✓ → aviso ✓): si algo
  truena se reanuda desde ahí, nunca desde cero.
- Regla dura: ningún mensaje de error termina en "algo salió mal".

## Estructura del repo

```
agent-kit/                      (nombre comercial por definir)
├── README.md                   ← promesa, "no necesitas programar", 3 pasos, video
├── GUIA.md                     ← paso a paso con capturas
├── LICENSE                     (MIT)
├── .claude/skills/crear-agente/
│   ├── SKILL.md                ← fases, checkpoints, mapa de fallos
│   ├── templates/              ← worker.js, panel, wrangler.jsonc, prompt base,
│   │                             audio y foto de prueba
│   └── referencias/            ← docs condensadas Zernio / Telegram / CF
└── docs/                       ← personalizar, ir-a-produccion.md, arquitectura
```

## README (primera pantalla)

Solo: la promesa en una frase · "no necesitas saber programar" · 3 pasos
(instala Claude Code → clona → `/crear-agente`) · link al video. Cero jerga,
cero badges, cero arquitectura arriba. Superpoderes presentados como tarjetas
(nombre + tagline propia). Lo técnico al fondo y en `docs/`.

## El video (~21 min, estilo FÁBRICA)

1. **0-1** Cold open: le escriben al agente (texto + nota de voz), contesta,
   vibra el Telegram, panel en el celular. "Esto en 30 minutos."
2. **1-3** Qué es, qué NO hace y por qué, qué necesitas (2 cuentas, 0 tarjeta)
3. **3-5** Claude Code + clonar + `/crear-agente`
4. **5-9** La entrevista con un negocio real de ejemplo
5. **9-13** Conexiones en pantalla: Zernio, Cloudflare, BotFather
6. **13-16** La skill construye y despliega (cortes) + prueba automática en verde
7. **16-19** Cliente falso: texto, nota de voz, "quiero hablar con alguien" →
   los avisos llegando — el money shot
8. **19-21** Personalización en lenguaje natural + siguiente paso (número real,
   reporte por correo) + CTA

## La vara de "ya está listo"

Una persona que NO sabe programar:
1. Abre el repo
2. Sigue las instrucciones sin preguntarle nada a nadie
3. En 30 minutos le escribe a su agente y contesta con la info de SU negocio
4. Se hace pasar por interesado y el dueño RECIBE el aviso

Los 4 de punta a punta o no está listo. "Done is better than perfect" aplica al
alcance, no a que funcione.

## Riesgos abiertos (verificar ANTES de construir encima)

1. **Webhook de Zernio**: formato exacto del payload, cómo se registra, y si el
   sandbox lo soporta igual que producción (alternativa de respaldo: polling).
2. **Media en sandbox**: que audio/foto lleguen con URL descargable (probado en
   producción por terceros; confirmar en sandbox).
3. **Calidad de Llama 3.3** en español con el bloque JSON de captura (fallback:
   GPT-OSS-120B, mismo free tier).
4. **Resend free tier**: confirmar envío a correo propio sin dominio verificado.
5. **Renovación de sesión sandbox** a los 7 días — documentar en la guía.
6. **Límites free de Workers AI** (neurons/día) vs 50 msg/día del sandbox con
   audio+visión — dimensionar.
