# Plan — El panel del cliente final
**2026-08-12** · Modelado de lo que vi, con costos reales y orden de ataque.

## El encuadre que resuelve la duda

Forja tiene **dos** paneles porque vende una herramienta para *crear* bots: uno para el
creador y otro para su cliente.

**Tu kit no necesita dos.** El panel del creador **es Claude Code + la skill**: ahí se
construye, se ajusta, se depura y se extiende. El único panel que entregas es el del
cliente final — y por eso ese sí tiene que estar espectacular.

Y como la audiencia es técnica, el panel cumple doble función: es el producto **y** es la
demo de lo que el técnico puede vender.

## Decisión de arquitectura

Crecer a ~15 secciones sin `npm install`, con un router de hash y un archivo por sección.

Por qué no meter build (Vite/React), aunque el límite se relajó:
- El agente sigue siendo **un solo Worker desplegable con un comando**
- El panel se puede seguir modificando **pidiéndoselo a Claude en español** — con build,
  cada cambio de color obliga a recompilar
- Un técnico valora más "cero dependencias, leelo completo en 20 minutos" que otro Vite

Si en algún punto una sección pide de verdad un framework (el grafo del flujo es el
candidato), se resuelve con SVG a mano antes que metiendo React.

## Lo que YA está hecho
Conversaciones (con hilo, responder, pausar, cerrar, etiquetas, recordatorios, notas
privadas, buscador), Interesados, avisos por Telegram con evidencia, autoprueba de 8
puntos, control de calidad con auto-reparación, reporte diario por correo, y la capa de
herramientas de Composio (loop de agente, listo y sin probar contra una app real).

---

## FASE A · La estructura del panel (la base de todo)
Sin esto, nada de lo demás cabe.

| Qué | Notas |
|---|---|
| **Sidebar** con secciones agrupadas, colapsable | INICIO · BANDEJA · MI AGENTE · ANÁLISIS |
| **Router** por hash (`#/conversaciones`) | 30 líneas, sin librería |
| **Modo día/noche** con interruptor | Ya tenemos los tokens; falta el toggle manual |
| **Estado "Agente en línea"** en el encabezado | Sale de `/salud` |
| **Resumen** con las tarjetas de KPI | Mensajes, clientes únicos, costo del mes |

**Datos nuevos: ninguno.** Todo sale de lo que ya guardamos.

## FASE B · Medir de verdad (desbloquea Costos, Estadísticas e Insights)
El agente hoy no registra cuánto cuesta ni cuánto tarda. Es una tabla nueva y un cambio
chico en `cerebro.js`, pero **desbloquea tres secciones**.

| Qué | Cómo |
|---|---|
| **Uso por mensaje** | Tokens de entrada/salida, modelo, ms y costo estimado por turno |
| **Costos** | Total del mes, proyección, y **tope mensual**: al llegar, baja al modelo barato en vez de callarse |
| **Estadísticas** | Mensajes por día, horas pico, funnel, costo por conversación y por interesado |
| **Horas ahorradas** | Mensajes atendidos × minutos, y **cuántos fuera de horario** — el número que más vende |

## FASE C · Que el agente se analice a sí mismo (Insights y Mejoras)
Un pase de análisis (modelo barato) sobre las conversaciones cerradas.

| Qué | Valor |
|---|---|
| **Sentimiento y resolución** por conversación | Alimenta los filtros: Leads · Atención · Molestos · Contentos |
| **Radar de conocimiento** | Las preguntas que **no supo contestar**. Es la lista de tareas del dueño |
| **Ventas que quedaron abiertas** | Interesados que no cerraron, con resumen de por qué |
| **Mejoras sugeridas** | Propone la entrada de conocimiento que falta, **con evidencia**, y se aplica con un clic |

Aquí ya tenemos media máquina: `/calidad` hace exactamente este ciclo pero sobre
escenarios sintéticos. Esto lo apunta a las conversaciones reales.

## FASE D · El grafo del flujo (la sección que saca el "wow")
Una radiografía en vivo del agente: canales → buffer → cerebro → respuesta, con el modelo,
la memoria y cada herramienta como nodos, y **cuántas veces se llamó cada uno**.

- SVG a mano con posiciones fijas (son ~12 nodos, no hace falta motor de layout)
- Los números salen de la tabla de eventos, que ya existe
- Clic en un nodo → su configuración real

Es la que mejor comunica "esto no es un chatbot, es un sistema" — justo lo que engancha a
un técnico.

## FASE E · Conocimiento de verdad (RAG)
Hoy la información del negocio va completa en el prompt. Sirve, pero no escala ni permite
que el dueño suba documentos.

| Qué | Cómo |
|---|---|
| **Documentos** | Tabla en D1, editables desde el panel |
| **Búsqueda semántica** | Vectorize + `@cf/baai/bge-m3` (incluidos, ya los vi en el catálogo) |
| **Reindexar al guardar** | Un documento nuevo entra en la siguiente respuesta |
| **Radar** conectado | Lo que el agente no supo → propone el documento que falta |

## FASE F · Capacidades y Conexiones (dos pantallas de configuración)
| Qué | Notas |
|---|---|
| **Capacidades** | Tarjetas de lo que sabe hacer, con estado real: activo / conecta / apagado |
| **Conexiones** | Canales con su URL de webhook y botón de copiar; se ponen verdes al conectar |
| **Configuración** | Idioma, tono, moneda, minutos de pausa, tope de presupuesto |

## FASE G · Lo que depende de integraciones
Cada uno necesita algo externo. Van al final y solo si Composio funciona.

| Qué | De qué depende |
|---|---|
| **Citas** | Composio + calendario. Tabla, estados y exportar CSV |
| **Cobros** | Stripe (nativo o vía Composio) |
| **Tickets** | Nada externo — es la escalación con estado. **Barato, se puede adelantar** |
| **Reseñas / Encuestas** | Nada externo. **También barato** |
| **Campañas / Plantillas** | Número real de WhatsApp + plantillas aprobadas. No cabe en el sandbox |

---

## Orden que propongo

1. **A** — la estructura. Todo lo demás cuelga de aquí
2. **B** — medir. Barato y desbloquea tres secciones
3. **D** — el grafo del flujo. El mayor "wow" por hora invertida
4. **C** — que se analice solo. Cierra el ciclo de mejora
5. **F** — capacidades, conexiones y configuración
6. **G-barato** — tickets y reseñas
7. **E** — RAG con Vectorize
8. **G-caro** — citas y cobros, cuando Composio esté probado

## Lo que NO copio de lo que vi
- **Modo Masterclass** y todo lo de vender bots: eso es del negocio de Forja, no del tuyo
- **Campañas por WhatsApp**: necesita número real y plantillas aprobadas — fuera del kit
- Textos, prompts y código: cero. Solo el mapa de qué secciones tiene un panel bueno

## Lo que falta decidir
- El nombre del kit y el `marca.js` (sigue en `PENDIENTE`)
- Si el README se reescribe ya para técnicos o al final
