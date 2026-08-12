# Fase 4 — Ensayo general cronometrado · COMPLETADA
**2026-08-12** · Tercer agente construido de cero siguiendo la skill, con reloj.

## El agente de prueba
**Panadería La Espiga** (agente "Espi", tono cercano) — tercer giro distinto, para confirmar
que nada quedó pegado del salón ni del taller.

## Presupuesto de los 30 minutos

**Tiempo de máquina medido: 72 segundos.** Todo lo automatizable (generar, crear base,
guardar secretos, publicar, probar) cabe en poco más de un minuto.

Los 30 minutos son casi todos humanos:

| Paso | Minutos | Cómo se estimó |
|---|---|---|
| Entrevista del negocio | 5 | 6 preguntas, respuestas escritas |
| Cuenta Zernio + `auth:login` | 4 | estimado (Luis ya tenía cuenta) |
| **Activar el número de prueba** | **6** | **medido hoy**: creada 19:25 → activa 19:31 |
| Cuenta Cloudflare + `wrangler login` | 5 | estimado (Luis ya tenía cuenta) |
| Bot de Telegram + `/start` | 3 | con el link directo al bot; sin él, hoy costó ~15 min |
| Construir, publicar y probar | 2 | **medido**: 72 s + esperas de propagación |
| Prueba humana por WhatsApp | 5 | el guion de cliente falso |
| **Total** | **~30** | ajustado, pero alcanza |

**Honestidad sobre la medición:** los dos pasos de "crear cuenta" son estimados, no
medidos: Luis ya tenía Zernio y Cloudflare. Si alguien nunca ha abierto una terminal,
súmale unos minutos. El riesgo mayor no es la máquina, es la entrevista: si la persona
escribe mucho en la pregunta 2, se puede ir a 8-10 minutos (y vale la pena, porque de ahí
sale la calidad del agente).

## La vara, punto por punto

| | Paso | Resultado |
|---|---|---|
| 1 | Abre el repo | ✅ |
| 2 | Sigue las instrucciones sin preguntarle a nadie | ✅ la skill se bastó sola |
| 3 | En 30 min su agente contesta con SU info | ✅ 8/8, citando sus precios y respetando sus reglas |
| 4 | Se hace pasar por interesado y el aviso LLEGA | ✅ lead "Ana · pastel para el jueves", Telegram id 28 |

Calidad de las respuestas del tercer agente:
- *"¿tienen pastel para hoy?"* → aplicó su regla: **48 horas de anticipación**
- *"¿cuánto la hogaza?"* → **$95**, el precio exacto de su lista
- *"¿tienen sin gluten?"* → **no inventó**: dijo que no y ofreció tomar el dato
- En régimen estable: **3 de 3 mensajes contestados**

## El bug que encontró el ensayo (el más grave de todo el proyecto)

**La autoprueba daba LISTO ✅ a un agente incapaz de mandar un solo mensaje.**

Faltaba `ZERNIO_ACCOUNT_ID` en `wrangler.jsonc`. Consecuencias en cadena:
1. El reemplazo del valor falló **en silencio** (la plantilla traía un comentario, no un
   hueco marcado; `sed` no encuentra nada y devuelve éxito igual).
2. El agente recibía y guardaba los mensajes, pero cada envío moría con HTTP 400.
3. **Y la prueba lo dejaba pasar**, imprimiendo "número sin filtrar" como si fuera normal.

Un semáforo en verde sobre un agente muerto es peor que no tener semáforo: es justo lo que
este kit existe para no hacer.

**Los tres arreglos:**
- La plantilla ahora trae `"ZERNIO_ACCOUNT_ID": "ID-DE-TU-WHATSAPP"` — un hueco explícito
  que, si no se reemplaza, se nota.
- La autoprueba **falla** si falta o si sigue con el valor de plantilla, y explica que sin
  eso el agente no le puede contestar a nadie.
- La skill verifica que quedó puesto y el mapa de fallos lo documenta con su síntoma
  ("guarda los mensajes pero nunca contesta").

Verificado rompiéndolo a propósito: la prueba corregida lo detecta y da LISTO: False.

## Lo que se confirma otra vez
Después de publicar hay que **esperar ~20 s**. El único mensaje sin respuesta de todo el
ensayo pegó en una versión aún no propagada. Ya está en la skill y en el mapa de fallos.
