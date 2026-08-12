# Fase 0 — Spikes de verificación · Veredictos
**Fecha:** 2026-08-12 · Todos los riesgos técnicos del spec resueltos con pruebas reales.

## 1. Zernio sandbox — ✅ TODO CONFIRMADO

Probado con el número real de Luis (+52 669 441 4164) contra el sandbox (+1 202 908 7457):

- **Sesión**: `zernio whatsappsandbox:create-whats-app-sandbox-session --phone "+52..."` →
  el usuario responde cualquier cosa al mensaje del sandbox → `active` (7 días).
- **Webhook**: `zernio webhooks:create-settings --name X --url Y --secret Z --events message.received`
  → entregas confirmadas (200) con reintentos y logs (`webhooks:get-logs`).
- **Payload `message.received`**: trae `message.text`, `message.attachments[]`,
  `sender.phoneNumber`, `sender.name`, `conversation.id`, `account.id`, `platformMessageId`.
- **🎙️ Audio en sandbox**: SÍ llega — `attachments[{type:"audio", url, mimeType:"audio/ogg; codecs=opus"}]`.
  La URL se descarga con `Authorization: Bearer <API key>` (HTTP 200, ogg opus real).
- **📸 Imagen en sandbox**: SÍ llega — `{type:"image", url, mimeType:"image/jpeg"}`, misma descarga.
- **Salida**: `POST /v1/inbox/conversations/{id}/messages` (CLI: `inbox:send`) →
  devuelve `messageId` (wamid…) = la evidencia que usa la prueba automática del kit.

### ⚠️ Lecciones de diseño (van al worker patrón)
1. **Los webhooks son POR CUENTA, no por número**: el agente SIEMPRE filtra por
   `account.id` o dos bots en la misma cuenta se pisan.
2. **Nada de estado en memoria del Worker** (isolates no comparten memoria): todo a D1.
3. Responder 2xx en <5s al webhook; el trabajo pesado va después de contestar
   (`ctx.waitUntil`) porque Zernio reintenta si no hay 2xx rápido.

## 2. Workers AI — ✅ MODELOS ELEGIDOS CON BAKE-OFF

Criterios: (1) protocolo de captura obedecido en español, (2) latencia <3s,
(3) costo en neurons (free tier = 10,000/día), (4) sin fricción legal, (5) catálogo real.

| Rol | Modelo | Resultado |
|---|---|---|
| 🧠 Cerebro (default) | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | 4/4 casos, 1.2-1.9s, ~46 neurons/msg |
| 🧠 Fallback | `@cf/openai/gpt-oss-120b` | 3/3, output 3× más barato, latencia variable 1.3-8.2s |
| 🎙️ Oído | `@cf/openai/whisper-large-v3-turbo` | Transcripción casi perfecta ES, 3.5s, 46.63 neurons/min. Probado con ogg real de WhatsApp |
| 👁️ Vista | `@cf/meta/llama-3.2-11b-vision-instruct` | Lee textos/precios exactos (LLaVA no). **Requiere 'agree' de licencia Meta 1 vez por cuenta — la skill lo pregunta explícito** |

Descartados: Kimi K2.6 (12-21s, el más caro, truncó JSON), GLM-4.7-flash (razonador,
`content:null` sin manejo especial), Llama 3.1 8B (alucinó servicios, rompió el protocolo).

- Formato de respuesta de Llama 3.3: estilo OpenAI (`choices[0].message.content`).
- Presupuesto: 50 msgs/día del sandbox ≈ 2,300 neurons + Whisper/Vista → sobra dentro de 10k gratis.
- **BYOK (decisión de Luis)**: el onboarding pregunta "¿modelo gratis o tu propia API key
  (OpenAI/Anthropic)?" — via Vercel AI SDK (`workers-ai-provider` ↔ providers de pago), opt-in.
- Base64 de audio en el Worker: conversión por bloques (spread de bytes revienta el stack).

## 3. Cloudflare para el usuario del kit — ✅ $0
Todo lo que usa el kit está en el plan FREE: Workers, Workers AI (10k neurons/día),
D1, cron. Sin tarjeta. (El plan de $5 de Luis es aparte y no es requisito.)

## 4. Resend (reporte diario por correo) — ⏳ PENDIENTE
Paso opcional del kit. Se prueba cuando Luis cree la cuenta (free, en teoría sin tarjeta
y sin dominio para mandar al propio correo). No bloquea nada.

## Arquitectura confirmada para Fase 1
Worker plano + D1 + cron + Vercel AI SDK. Sin Agents SDK en v1 (anotado como evolución).
