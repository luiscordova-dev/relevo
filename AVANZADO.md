# 🧪 AVANZADO — el mapa del playground

**Qué es esto:** ejemplos avanzados, reales y funcionales, para que los explores.
**Qué NO es:** parte del paso a paso oficial. No tiene guía, no tiene soporte, no
promete plug-and-play. Léelo, rómpelo, haz forks.

**La regla del repo:** el [Paso 1](README.md) resuelve completo UN problema — tu primer
agente vivo en 30 minutos. Todo lo que sea *operar un sistema de negocio* (citas,
reportes, conocimiento con documentos, integraciones) vive aquí como material de
estudio. Para el resultado de 30 minutos no necesitas tocar nada de esta página: el
agente funciona completo sin configurar ninguna de estas piezas — todo degrada con
gracia.

## El código del playground

| Pieza | Dónde | Qué hace | Qué necesitaría |
|---|---|---|---|
| **Loop de herramientas** | `plantilla/src/herramientas.js` | El agente pide una herramienta con un bloque estructurado, el Worker la ejecuta, y contesta con el resultado. Con guarda anti-promesa: jamás dice "ya quedó agendado" sin haberlo hecho | — (el motor siempre está) |
| **Composio** | `plantilla/src/avanzado/composio.js` | 1,000+ apps (calendario, CRM, Slack…) con auto-descubrimiento del `user_id` — la trampa que cuesta horas está resuelta y comentada | API key `ak_` del dashboard |
| **Conocimiento (RAG)** | `plantilla/src/avanzado/conocimiento.js` | Troceado por secciones con solape por párrafo, Vectorize + bge-m3, filtro de relevancia piso+cercanía **medido contra el índice real** (los números están en los comentarios) | Índice Vectorize + binding `KB` |
| **Reporte diario** | `plantilla/src/avanzado/reporte.js` | El resumen del día por correo: Gmail vía Composio o Resend, con evidencia (id del mensaje o no salió) | `CORREO_DUENO` + una vía |
| **Panel: secciones avanzadas** | `plantilla/src/panel/secciones/` | Flujo (grafo en vivo con fichas y switches), Conocimiento (documentos + probador con fuentes y puntajes), Capacidades, Costos al neuron | — (se sirven solas) |

## Las skills del playground

Marcadas **avanzado · referencia sin soporte** — están completas y documentan lecciones
reales (esquemas de Composio, user_id, troceado de RAG), pero no son parte del setup:

| Skill | Referencia de |
|---|---|
| `/conectar` | Composio de cero a probado, tabla directo-vs-Composio, canales |
| `/cargar-conocimiento` | Reestructurar un documento crudo para que la búsqueda lo encuentre |
| `/agregar-capacidad` | Capacidades `local:` propias del negocio, con su prueba |
| `/afinar` | Mejorar el agente con sus conversaciones reales |

## Por qué el código está completo si "no es parte del kit"

Porque los secretos se regalan: aquí está la arquitectura real, con los bugs ya
mordidos y comentados, para que aprendas leyéndola. Lo que no está aquí es la ruta
guiada — el camino corto, con método y soporte, para convertir esto en un sistema
que factura.

---

🎓 **Si quieres aprender a crear agentes de IA y automatizaciones con Claude Code en
serio, [anótate a la lista →](https://tally.so/r/EkGZoL?origen=avanzado)**
