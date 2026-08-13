---
name: afinar
description: Hace al agente más listo aprendiendo de sus conversaciones reales. Lee los chats, las escalaciones y los errores, encuentra las preguntas que NO supo contestar o contestó mal, y propone arreglos concretos a la información del negocio con antes/después. Aplica solo con confirmación y re-verifica. Úsala con "/afinar", "mejora las respuestas", "el agente no supo contestar", "hazlo más inteligente", "aprende de las conversaciones".
---

# Afinar: el agente aprende de su propio uso

La diferencia entre un agente que se configuró una vez y uno que mejora cada semana.

## Reglas
- Solo lectura hasta tener la propuesta completa.
- Cada propuesta lleva **evidencia**: la conversación real donde se vio la falta.
- Antes/después de cada cambio, y nada se aplica sin el "va".
- Al final: publicar, esperar 20 s, y correr la autoprueba. Si baja de 8/8, se revierte.

## Paso 1 · Junta la evidencia (solo lectura)

**Los "no supe":**
```sql
SELECT conversacion_id, texto, creado_en FROM mensajes
 WHERE rol='agente' AND (texto LIKE '%no lo tengo a la mano%'
    OR texto LIKE '%no tengo esa información%' OR texto LIKE '%déjame confirmarlo%')
 ORDER BY id DESC LIMIT 30
```
Para cada uno, saca el mensaje del cliente que lo provocó (el anterior en esa conversación).

**Las escalaciones** (`eventos` tipo `escalacion`): ¿hay un tema que se repite? Ese tema
necesita o información o una regla.

**Los errores** (`eventos` tipo `error`): los técnicos van aparte — si hay de Telegram o
Zernio, eso es `/autopsia`, no afinación.

**Los intereses capturados** (`leads.interes`): lo que la gente más pide es lo que mejor
descrito debe estar en la información.

## Paso 2 · Agrupa y prioriza
Junta los "no supe" por tema (no por frase exacta). Ordena por frecuencia × cercanía a
venta: una pregunta de precio sin respuesta pesa más que una curiosidad.

Máximo **5 propuestas por ronda**. Más que eso no se revisa bien y el prompt engorda de golpe.

## Paso 3 · Propón con antes/después

Formato de cada propuesta:
> **3 clientes preguntaron si aceptan tarjeta a meses** (ej. "¿puedo pagar a 3 meses?",
> el 12/ago). El agente dijo "no lo tengo a la mano" las 3 veces.
>
> Propongo agregar a CÓMO SE PAGA:
> ```
> - Meses sin intereses: 3 meses con tarjetas participantes, en compras desde $1,500
> ```
> *(El dato me lo confirmas tú — no lo voy a inventar yo.)*

**Regla de oro: los datos los pone el dueño.** Si la respuesta correcta no se sabe, la
propuesta es la PREGUNTA al dueño, nunca un dato inventado. Esto es un kit anti-invento
hasta en su mantenimiento.

Dónde va cada tipo de arreglo:
| El agente… | El arreglo va en |
|---|---|
| No tenía el dato | `negocio.informacion` |
| Tenía el dato pero enterrado | Reescribir esa sección con las palabras que usa la gente |
| Contestó algo prohibido | `negocio.reglasExtra` |
| Suena robótico en un caso | Un ejemplo nuevo en el prompt (`src/cerebro.js`) — con más cuidado |

## Paso 4 · Aplica y verifica
1. Solo lo aprobado. 2. Publica y espera 20 s. 3. **Re-pregunta las preguntas que fallaban**
(con el webhook de prueba o `/calidad`). 4. Autoprueba completa: 8/8 o se revierte.

## Paso 5 · Reporte
> Encontré 4 huecos en 23 conversaciones. Aplicamos 3 (meses sin intereses, horario de
> festivos, envíos). El de "¿hacen facturas?" quedó pendiente de que me pases el dato.
> Verificado: las 3 preguntas ya se contestan bien y las 8 pruebas siguen en verde.

## Modo semanal
Si el dueño quiere, esto se corre como rutina: "afina mi agente cada lunes" → revisar solo
las conversaciones de los últimos 7 días. La primera ronda siempre es la más grande; las
siguientes son de mantenimiento.
