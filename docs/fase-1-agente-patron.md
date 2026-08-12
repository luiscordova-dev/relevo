# Fase 1 — El agente patrón · COMPLETADA
**2026-08-12** · Construido, desplegado y verificado contra WhatsApp real.

## Qué se construyó
La plantilla completa en `.claude/skills/crear-agente/plantilla/`, de la que la skill
genera el agente de cada persona. Sin dependencias npm: solo el runtime de Cloudflare.

| Archivo | Qué hace |
|---|---|
| `src/index.js` | Rutas + validación HMAC del webhook + filtro por cuenta + cron |
| `src/agente.js` | Orquesta: interpretar → pensar → responder → capturar → avisar |
| `src/cerebro.js` | System prompt (con ejemplos), llamada al modelo, separación de datos |
| `src/medios.js` | 🎙️ Oído (Whisper) y 👁️ Vista (Llama Vision) |
| `src/avisos.js` | 🔔 y 🔴 a Telegram, devolviendo `message_id` como evidencia |
| `src/datos.js` | D1: conversaciones, mensajes, leads, eventos |
| `src/panel.js` | Panel del dueño, responsive, con botón wa.me |
| `src/autoprueba.js` | 8 pruebas de punta a punta con evidencia |
| `src/calidad.js` | Control de calidad del cerebro **con auto-reparación** |
| `src/reporte.js` | Reporte diario por correo (Resend, opcional) |
| `negocio.js` | Lo único que el dueño edita |
| `schema.sql` | 4 tablas |

## Verificado contra el agente desplegado (no en teoría)

**Autoprueba: 8/8 ✅** — cerebro, anti-invento, oído, vista, captura+aviso,
escalación+pausa, WhatsApp conectado, calidad.

**Seguridad y robustez:**
- Firma HMAC inválida → 401 ✓
- Mensaje de otra cuenta Zernio → ignorado ✓ (los webhooks son por cuenta, no por número)
- Mensaje repetido (reintento de Zernio) → contesta una sola vez ✓
- **Si el aviso falla, el lead NO se pierde** ✓ — se guarda y se marca "Sin aviso"
- El reporte por correo sin configurar degrada limpio ✓

**Flujo real completo** (texto → nota de voz → lead → escalación):
lead `Fernanda / balayage el sábado`, motivo aparte, dos evidencias de aviso
(`aviso_id` 15, `aviso_urgente_id` 16), agente pausado 60 min, panel correcto.

## Bugs encontrados y corregidos al probar
1. **La escalación pisaba el nombre** capturado con el del perfil de WhatsApp.
2. **La escalación pisaba el interés** con el motivo → se perdía la venta.
3. **El aviso urgente no dejaba evidencia** (el COALESCE conservaba solo el primero).
4. **Avisaba de leads llamados "desconocido"** → ahora espera a tener nombre real.
5. **Español defectuoso** del modelo ("te dejo tomar tus datos").
6. **Diagnóstico equivocado**: si el modelo fallaba, mandaba a revisar Telegram.

## Decisiones nuevas de esta fase
- **Sin AI SDK ni dependencias**: llamadas directas. Menos piezas = menos fallas, y el
  BYOK (OpenAI/Anthropic) son 20 líneas. `npm install` deja de ser un paso del setup.
- **Ejemplos completos en el prompt**, no lista de reglas. Subió de fallar español y
  emitir leads "desconocido" a **24/24 (100%)** en la evaluación, con los dos modelos.
- **La captura no depende de tool-calling**: bloque JSON + parser determinista con
  rescate por regex si el modelo trunca.
- **Auto-reparación de calidad** (a petición de Luis): al terminar el onboarding el
  agente se autoevalúa; si el cerebro falla, prueba el suplente y devuelve una acción
  legible por máquina (`cambiar-modelo` / `revisar-informacion` / `usar-llave-propia`)
  para que Claude la aplique sin que el dueño toque nada. **Probado rompiéndolo a
  propósito** con un modelo chico: lo detectó (50%) y recomendó el correcto (100%).
- **Reintento en las pruebas que dependen del modelo**: tras publicar, Cloudflare tarda
  segundos en servir la versión nueva y eso generaba errores falsos y alarmantes.

## Para la Fase 2 (la skill)
- Esperar ~20s después de publicar antes de probar.
- Extraer la llave de Zernio de `apiKey.key` (no del objeto) y pipearla a `wrangler secret put`.
- `getUpdates` vacío = le dio `/start` a BotFather, no a su bot → mandarle `t.me/<su_bot>`.
- Los secretos tardan segundos en propagarse: esperar antes de probar.
