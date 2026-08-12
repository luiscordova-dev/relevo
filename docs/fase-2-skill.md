# Fase 2 — La skill `/crear-agente` · COMPLETADA
**2026-08-12** · Escrita y **probada construyendo un agente nuevo desde cero**.

## Qué se escribió
```
.claude/skills/crear-agente/
├── SKILL.md                  ← el guion completo, 9 fases
├── referencias/zernio.md     ← CLI, sandbox, webhooks, forma del evento
├── referencias/telegram.md   ← BotFather, chat_id, el fallo del /start
├── referencias/cloudflare.md ← wrangler, modelos, licencia de Meta, esperas
├── referencias/fallos.md     ← tabla: qué ves → qué pasó → qué haces
└── plantilla/                ← el agente (Fase 1)
```

## Principios que la skill impone
1. Una pregunta por mensaje.
2. **La persona nunca corre un comando ni abre un archivo.** Solo contesta y aprueba en su
   navegador.
3. Nada de jerga: "tu agente", "tus interesados", "publicar" — nunca worker, D1, webhook.
4. Ningún error termina en "algo salió mal": siempre cierra con la acción que sigue.
5. Nada se da por hecho: un aviso sin `message_id` no llegó.
6. Progreso en `.progreso.json` — si vuelve a medias, retoma donde se quedó.

## La prueba: un agente distinto, de otro giro
Se siguió la skill al pie para construir **Taller Rueda Libre** (mecánico, tono divertido,
agente "Beto") — deliberadamente lejos del salón de belleza del patrón.

**Autoprueba: 8/8 a la primera**, incluido el control de calidad al 100%.

Flujo real por webhook firmado:
- *"¿cuánto sale una afinación para un Jetta 2015?"* → **"desde $1,800, depende del motor.
  ¿Cuál es el tuyo?"** — respetó la `reglaExtra` de no dar precio cerrado
- *"soy Luis y quiero llevarlo el sábado"* → lead **"Luis · Afinación para Jetta 2015 el
  sábado"** + aviso a Telegram (id 21)
- El panel salió con su propio nombre, su agente y la marca al pie

Nada quedó hardcodeado del primer agente: distinto negocio, distinto tono, distintas reglas.

## Lo que la prueba destapó (y ya está corregido)
1. **El id de la cuenta de WhatsApp no está en `accounts:list`.** Ahí solo aparecen los
   números comprados; el del sandbox es de Zernio. Sale de `inbox:conversations`, y solo
   **después** de que la persona responde la verificación. La skill ahora lo pide en ese
   orden y explica por qué importa (sin él, el agente contesta mensajes ajenos).
2. **En las listas de Zernio el campo es `_id`, no `id`.**
3. **Un agente por cuenta de Zernio en sandbox** — el webhook es por cuenta. Ahora se dice
   desde el principio, no cuando ya chocó.

## Pendiente para la Fase 3
`marca.js` sigue con `nombre: "PENDIENTE"`. Falta que Luis defina el nombre comercial y el
link del pie del panel — aparece en el panel de **cada** persona que use el kit.
