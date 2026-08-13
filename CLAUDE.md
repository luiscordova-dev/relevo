# Relevo

Este repo construye agentes de WhatsApp con Claude Code. **Es público**: aquí no van
llaves, cuentas, teléfonos ni datos de nadie.

## ⚠️ A QUIÉN LE HABLAMOS — el filtro que define todo
**Desarrolladores que trabajan con IA.** Gente que hace vibe coding, automatizaciones y
agentes; que lee código y despliega en su propia nube. NO son dueños de negocio.

Consecuencias directas, y no son opcionales:
- **El lenguaje técnico se queda**: webhook firmado, HMAC, RAG, neurons, Vectorize,
  idempotencia. Es lo que les da confianza — traducirlo a "lenguaje simple" les quita
  información y suena a producto para principiantes.
- Lo que sí se explica es el **porqué** y el **trade-off** (por qué HMAC en tiempo
  constante, por qué RAG por umbral), no el qué.
- **La única excepción**: `GUIA.md` y el panel del cliente final, que sí los ve el dueño
  del negocio del técnico. Ahí manda el lenguaje llano.

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
| `/cargar-conocimiento` | Catálogos, menús y documentos largos: Claude los reestructura, indexa y prueba |

## Reglas de la casa
- **Evidencia, no fe**: un aviso sin `message_id` no llegó; una prueba que no corriste no pasó.
- Tras publicar, **espera ~20 s** antes de probar (propagación de Cloudflare).
- Secretos SOLO con `wrangler secret put`; jamás en archivos ni en el chat.
- Un agente = sus propios recursos (su D1, su worker). Nunca compartas los de otro.
- La **atribución del pie del panel** ("hecho con Relevo · by Luis Córdova") no se quita:
  es la única condición del kit. Todo lo demás es de la persona.
