# Relevo

**Con este repo vas a lograr SOLO esto: un agente mínimo en producción — responde
FAQs sin alucinar, captura interesados y te avisa con handoff a humano — en ±30
minutos, en tu propio Cloudflare.** Lo demás que encuentres aquí es playground.

El camino completo, en un vistazo:

1. **👣 Paso 1 — Tu primer agente en 30 minutos** (guiado, soportado, obligatorio)
2. **🧪 Paso 2 (opcional) — Juega con lo avanzado** (ejemplos sin soporte: léelos, rómpelos, haz forks)
3. **🎓 Paso 3 — [Si quieres aprender a crear agentes de IA y automatizaciones con Claude Code en serio, anótate a la lista](https://tally.so/r/EkGZoL?origen=readme)**

---

## 👣 Paso 1 · Tu primer agente en 30 minutos

Un agente real, no un eco de API: webhook firmado con HMAC validado en tiempo constante,
transcripción de notas de voz, visión, captura de leads con evidencia de entrega,
escalación a humano, buffer de mensajes, evals propias con **auto-reparación de modelo**,
panel de operación con sesión, y medición de costo exacta al neuron. **Cero dependencias
de npm en el runtime.**

Lo construyes conversando: una skill de Claude Code te entrevista sobre el negocio,
genera el agente, lo despliega en tu Cloudflare y **no te dice "listo" hasta que sus
pruebas pasan con evidencia** — incluido el aviso de Telegram confirmado con `message_id`.

**Necesitas:** [Claude Code](https://claude.com/claude-code) · cuenta de
[Cloudflare](https://cloudflare.com) (gratis) · cuenta de [Zernio](https://zernio.com)
(WhatsApp, sandbox gratis) · [Telegram](https://telegram.org). Sin tarjeta.

```bash
git clone https://github.com/luiscordova-dev/relevo.git
cd relevo
claude
# → /crear-agente
```

Eso es todo lo que tecleas: la skill corre los comandos, tú contestas la entrevista.

> **La letra chica, de frente:** en 30 minutos está en producción y contestando con la
> información que le diste. Dejarlo fino para clientes reales pide lo de siempre:
> probarlo como cliente, completar su información y afinarlo la primera semana. Los kits
> que prometen "listo al 100% sin tocar nada" son exactamente lo que esto no es.

### Qué recibe el Paso 1 (completo y soportado)

Contesta 24/7 con la información del negocio · entiende **notas de voz** (Whisper) y
**fotos** (Llama Vision) · **no inventa** — si no sabe, lo dice y captura · captura leads
y **avisa por Telegram al momento**, con evidencia de entrega · **handoff a humano**
cuando lo piden o hay queja (y se calla para que entres tú) · **buffer de mensajes**
configurable (la gente escribe en ráfaga; el agente agrupa y contesta una vez) ·
**memoria de conversación** · usa el **nombre del perfil de WhatsApp** para saludar, sin
darlo por bueno como lead · **panel de operación** con inicio/cierre de sesión (cookie
HMAC, nada de claves en la URL), inbox con toma de control, etiquetas, recordatorios,
notas privadas, switches de capacidades en caliente y costos exactos.

### Por qué está mejor hecho que el promedio

| | |
|---|---|
| **La captura no depende de tool-calling** | El modelo emite un bloque estructurado; un parser determinista (con rescate por regex) ejecuta el guardado y el aviso. Menos magia, cero avisos fantasma |
| **Evidencia, no fe** | Un aviso "enviado" sin `message_id` de Telegram cuenta como NO entregado, y el panel lo marca. Si el aviso falla, el lead se guarda igual |
| **Evals con auto-reparación** | El agente corre sus escenarios contra sí mismo; si su modelo no da el ancho, prueba el suplente y devuelve una acción aplicable |
| **Seguridad de serie** | Firma HMAC en tiempo constante, filtro por cuenta (los webhooks de Zernio son account-wide), idempotencia por `platformMessageId`, secretos fuera del código |
| **Costo exacto, no estimado** | Workers AI devuelve `neurons` por llamada y todo se registra. Una conversación típica: ~$0.004 USD |
| **Un solo Worker** | Agente + panel + API + cron en un deploy. Sin build, sin `node_modules`. Se modifica pidiéndoselo a Claude en español |

### Las skills del Paso 1

| Skill | Qué hace |
|---|---|
| `/crear-agente` | La entrevista → genera → despliega → **prueba con evidencia** |
| `/autopsia` | Pegas un chat que salió mal → lo busca en la D1 real → causa raíz → arreglo mínimo → re-verifica |
| `/auditoria` | Semáforo de seguridad (llaves, firma, secretos) y de costos (neurons reales, picos) |

## 🧪 Paso 2 (opcional) · Juega con lo avanzado

**Ejemplos de cómo podrías extender este agente: citas, conocimiento con documentos,
reportes, integraciones. Son ejemplos sin soporte: léelos, rómpelos, haz forks. Si solo
quieres aprender del código por tu cuenta, termina aquí.** Nada de esto es necesario
para el resultado de 30 minutos — todo degrada con gracia si no lo configuras.

El playground vive en [`AVANZADO.md`](AVANZADO.md) (el mapa) y en
[`src/avanzado/`](.claude/skills/crear-agente/plantilla/src/avanzado/) dentro de la
plantilla:

- 🗓️ **Citas reales** — el loop de herramientas vía Composio (`avanzado/composio.js` +
  `herramientas.js`), con auto-descubrimiento del `user_id` y una guarda en código que
  impide prometer "ya quedó agendado" sin haberlo hecho
- 📚 **Conocimiento (RAG)** — `avanzado/conocimiento.js`: troceado por secciones,
  Vectorize + bge-m3, filtro de relevancia medido contra el índice real
- 📊 **Reporte diario** — `avanzado/reporte.js`: Gmail vía Composio o Resend
- 🧰 Las skills marcadas **avanzado · referencia sin soporte**: `/conectar`,
  `/cargar-conocimiento`, `/agregar-capacidad`, `/afinar`

## 🎓 Paso 3 · Aprender el sistema

Si después de montar tu agente quieres aprender el método completo — cómo decidir
arquitectura, evals, evitar inventos, cuándo usar RAG, cómo probar en producción —
ese es justo el salto que sigue.

**[Si quieres aprender a crear agentes de IA y automatizaciones con Claude Code en
serio, anótate a la lista →](https://tally.so/r/EkGZoL?origen=readme)**

---

## Stack

**Cloudflare Workers** (runtime) · **Workers AI** — Llama 3.3 70B por default, elegido
por bake-off contra 4 modelos, con GPT-OSS-120B de suplente y BYOK opcional
(OpenAI/Anthropic) · **D1** (datos) · **Vectorize + bge-m3** (playground de conocimiento)
· **Zernio** (WhatsApp — sandbox gratis) · **Telegram** (avisos) · **Composio** y
**Resend** (playground).

- **[Cómo funciona por dentro](docs/como-funciona.md)** — arquitectura y decisiones
- **[Personalizar](docs/personalizar.md)** · **[Ir a producción](docs/ir-a-produccion.md)**
- **[Guía para tu cliente](GUIA.md)** — si entregas el agente a alguien no técnico
- **[AVANZADO.md](AVANZADO.md)** — el mapa del playground

## Licencia y la única condición

**MIT.** Úsalo, véndelo, modifícalo, entrégalo a tus clientes: es tuyo.

Lo único que Relevo pide a cambio es **la línea del pie del panel** — *"hecho con Relevo ·
by Luis Córdova"* — que no se quita. Va horneada en `src/panel/index.js` y en el login.
Todo lo demás (nombre, tono, colores, secciones, el código entero) sí es de la persona
que lo construye.

---

📌 **PD — si te saltaste hasta acá:** arriba tienes el paso a paso para dejar un agente
mínimo contestando solo, capturando interesados y avisándote. Y si quieres aprender a
crear agentes de IA y automatizaciones con Claude Code en serio,
**[anótate a la lista →](https://tally.so/r/EkGZoL?origen=readme)**
