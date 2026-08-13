# Relevo

Este repo construye agentes de WhatsApp con Claude Code. **Es público**: aquí no van
llaves, cuentas, teléfonos ni datos de nadie.

## Si la persona acaba de llegar
Su punto de entrada es la skill **`/crear-agente`**: entrevista sobre su negocio →
genera el agente → lo despliega en SU Cloudflare → lo prueba con evidencia. No le pidas
que corra comandos: tú los corres.

## Las skills del kit
| Skill | Para qué |
|---|---|
| `/crear-agente` | Construir y desplegar un agente nuevo, de cero a probado |
| `/autopsia` | Diagnosticar una conversación que salió mal, sobre la base de datos real |
| `/auditoria` | Semáforo de seguridad y costos, con evidencia |
| `/afinar` | Mejorar al agente con sus conversaciones reales |
| `/conectar` | Composio (calendario, CRM, Slack…) y canales — todo termina probado |
| `/agregar-capacidad` | Capacidades propias del negocio, con su prueba |

## Reglas de la casa
- **Evidencia, no fe**: un aviso sin `message_id` no llegó; una prueba que no corriste no pasó.
- Tras publicar, **espera ~20 s** antes de probar (propagación de Cloudflare).
- Secretos SOLO con `wrangler secret put`; jamás en archivos ni en el chat.
- Un agente = sus propios recursos (su D1, su worker). Nunca compartas los de otro.
- La **atribución del pie del panel** ("hecho con Relevo · by Luis Córdova") no se quita:
  es la única condición del kit. Todo lo demás es de la persona.
