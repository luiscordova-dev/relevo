---
name: autopsia
description: Le haces la autopsia a una conversación donde el agente falló. Pegas el chat (o el teléfono del cliente), lo busca en la base de datos real del agente desplegado, reconstruye el turno exacto donde se rompió, encuentra la causa (inventó un dato, no escaló, usó mal una herramienta, se quedó sin contexto), aplica el arreglo mínimo y vuelve a verificar. Úsala con "/autopsia", "mi agente contestó mal aquí", "por qué dijo esto", "el agente inventó", "no me avisó de este cliente", "falló esta conversación".
---

# Autopsia de una conversación

Depurar sobre lo que **de verdad pasó**, no sobre lo que uno cree que pasó.

## Reglas
- **Solo lectura hasta el paso 4.** Ni un cambio antes de tener la causa.
- **Una causa principal.** Si hay tres cosas mal, se arregla la que produjo el fallo y las
  otras se anotan. Arreglar todo de golpe hace imposible saber qué sirvió.
- **El arreglo más chico que funcione.** Casi siempre es `negocio.js`, no `src/`.
- **Se re-verifica.** Una autopsia sin re-verificación es una hipótesis.

---

## Paso 0 · Ubícate
Confirma que estás en la carpeta de un agente (`negocio.js` + `wrangler.jsonc`) y lee la
clave del panel de `.secretos.local`. Si hay varios agentes, pregunta cuál.

## Paso 1 · Encuentra el chat REAL
Con el teléfono, el nombre o un pedazo del texto:

```bash
npx wrangler d1 execute <slug>-db --remote --json --command \
  "SELECT c.id, c.telefono, c.nombre_contacto, l.nombre, l.interes, l.escalado,
          c.pausado_hasta, c.cerrada
     FROM conversaciones c LEFT JOIN leads l ON l.conversacion_id = c.id
    WHERE c.telefono LIKE '%<pedazo>%' ORDER BY c.actualizado_en DESC LIMIT 5"
```

Ya con el id, saca el hilo completo con tipos y tiempos:
```bash
npx wrangler d1 execute <slug>-db --remote --json --command \
  "SELECT id, rol, tipo, texto, creado_en FROM mensajes
    WHERE conversacion_id = '<id>' ORDER BY id"
```

**Si no aparece la conversación**, eso YA es el hallazgo: el mensaje nunca llegó al agente.
Salta a la sección "Cuando el mensaje ni llegó".

## Paso 2 · Aísla el turno que se rompió
Marca el mensaje del cliente y la respuesta del agente que estuvo mal. Reconstruye qué
tenía el agente enfrente en ese momento:
- Los mensajes anteriores (el historial son los últimos 12)
- Lo que dice `negocio.js` sobre ese tema — **cítalo textual**
- Si hubo herramienta: `SELECT * FROM eventos WHERE tipo='herramienta'` alrededor de esa hora

## Paso 3 · Diagnostica UNA causa

| Síntoma | Causa probable | Dónde se comprueba |
|---|---|---|
| Dijo un dato que no existe | **Inventó** | El dato NO está en `negocio.js` |
| Dijo "no tengo esa información" y sí la tenías | **No la encontró** | El dato SÍ está, pero enterrado o ambiguo |
| El cliente pidió humano y no te avisó | **No escaló** | No hay evento `escalacion` en ese rango |
| Dio el nombre y no te llegó aviso | **No capturó** | No hay `lead`, o hay `error` de Telegram |
| Contestó fuera de tema | **Perdió el contexto** | La conversación pasa de 12 mensajes |
| Prometió algo que no puede hacer | **Falta una regla** | No hay nada en `reglasExtra` que lo prohíba |
| No contestó nada | **Se cayó o está pausado** | `eventos` tipo `error`, o `pausado_hasta` futuro |

Comprueba tu hipótesis **antes** de tocar nada: reproduce el turno con el mismo historial
contra `/calidad` o con una llamada directa al modelo. Si no reproduce, la hipótesis está mal.

## Paso 4 · El arreglo mínimo (pide confirmación)

| Causa | Arreglo | Toca |
|---|---|---|
| Inventó | Agregar el dato, o una línea en `reglasExtra` que lo prohíba explícito | `negocio.js` |
| No la encontró | Reescribir esa parte más clara y con las palabras del cliente | `negocio.js` |
| No escaló | Agregar un ejemplo de ese caso en el prompt | `src/cerebro.js` |
| No capturó | Revisar el bloque de datos; si el modelo falla seguido, `/calidad` | según el diagnóstico |
| Falta regla | Una línea en `reglasExtra` | `negocio.js` |

Enséñale el **antes y después** y pide su "va" antes de publicar.

## Paso 5 · Re-verifica (no es opcional)
1. Publica y **espera 20 segundos**.
2. Vuelve a mandar el mismo mensaje que falló, con el mismo historial.
3. Corre la autoprueba completa: `POST /prueba?clave=…` — el arreglo no puede romper otra cosa.
4. Si sigue fallando, **regresa al paso 3**: la causa era otra.

## Paso 6 · El reporte
Cuatro frases, sin jerga:
> **Qué pasó:** el agente le dijo a Ana que había pastel para el mismo día.
> **Por qué:** la regla de las 48 horas estaba en el texto, pero perdida a media lista.
> **Qué hice:** la subí a `reglasExtra`, que se lee como regla dura.
> **Cómo lo comprobé:** repetí el mensaje y ahora responde bien; las 8 pruebas siguen en verde.

---

## Cuando el mensaje ni llegó
Revisa **en este orden** y para en el primero que falle:
1. `zernio whatsappsandbox:list-whats-app-sandbox-sessions` → ¿la sesión sigue `active`? (dura 7 días)
2. `zernio webhooks:get-logs` → ¿la entrega salió `success`? ¿qué código devolvió?
3. `GET /salud` → ¿`whatsapp.cuenta` en ✅? Sin `ZERNIO_ACCOUNT_ID` el agente ignora todo
4. `SELECT * FROM eventos WHERE tipo='error' ORDER BY id DESC LIMIT 5`
