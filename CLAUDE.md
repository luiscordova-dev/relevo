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

## Si pide su propio número de WhatsApp
*"Quiero conectar mi número"*, *"quiero atender clientes de verdad"*, *"pasar a
producción"* → **`/crear-agente`, Fase 9**. Los comandos verificados y los precios están
en `crear-agente/referencias/zernio.md` → *Número propio (producción)*.
**NO es `/conectar`** (esa es del playground: Composio y otros canales). Dos cosas que se
dicen antes de que gaste: **por esta ruta no hay coexistencia** — el número se muda a
Cloud API y deja la app del celular (coexistencia sí existe, pero por otra plataforma como
ManyChat; no la prometas desde el kit) — y **la compra la autoriza y la corre la persona**,
nunca tú.

## Los docs para el usuario final (`docs/`)
`docs/como-funciona.md` (arquitectura) · `docs/personalizar.md` (qué pedirle a Claude) ·
`docs/ir-a-produccion.md` (número propio, en lenguaje llano). Están enlazados desde
README y GUIA: si cambias la ruta de producción, se actualizan los tres a la vez.

## La frontera del kit (regla para TODA decisión de alcance)
**¿Es parte de "primer agente vivo"? → completo, guiado y soportado (Paso 1).**
**¿Es "operar un sistema de negocio" (citas, reportes, documentos, integraciones)? →
playground avanzado (Paso 2): visible, sin guía, sin soporte.** El camino guiado de eso
vive en la lista del workshop (https://tally.so/r/EkGZoL) — nunca prometas que "pronto
será gratis" ni lo montes como ruta guiada desde el kit.

## Las skills del kit
**Oficiales (Paso 1 — guiadas y soportadas):**
| Skill | Para qué |
|---|---|
| `/crear-agente` | Construir y desplegar un agente nuevo, de cero a probado |
| `/autopsia` | Diagnosticar una conversación que salió mal, sobre la base de datos real |
| `/auditoria` | Semáforo de seguridad y costos, con evidencia |

**Avanzadas (Paso 2 — referencia sin soporte, ver `AVANZADO.md`):**
| Skill | Referencia de |
|---|---|
| `/conectar` | Composio y canales, con las lecciones reales comentadas |
| `/cargar-conocimiento` | Reestructurar documentos para RAG |
| `/agregar-capacidad` | Capacidades propias `local:` |
| `/afinar` | Mejorar con conversaciones reales |

## Reglas de la casa
- **Evidencia, no fe**: un aviso sin `message_id` no llegó; una prueba que no corriste no pasó.
- Tras publicar, **espera ~20 s** antes de probar (propagación de Cloudflare).
- Secretos SOLO con `wrangler secret put`; jamás en archivos ni en el chat.
- Un agente = sus propios recursos (su D1, su worker). Nunca compartas los de otro.
- La **atribución del pie del panel** ("hecho con Relevo · by Luis Córdova") no se quita:
  es la única condición del kit. Todo lo demás es de la persona.
