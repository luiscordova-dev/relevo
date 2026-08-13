# 🧪 Avanzado — el playground

**Ejemplos avanzados para que explores. No son parte del paso a paso ni tienen
soporte.** Léelos, rómpelos, haz forks. Para el resultado de 30 minutos NO necesitas
tocar nada de esta carpeta: el agente funciona completo sin configurar ninguna pieza
de aquí (todo degrada con gracia).

| Pieza | Qué hace | Qué necesitaría para encender |
|---|---|---|
| `composio.js` | La puerta a 1,000+ apps: ejecuta herramientas (agendar, CRM, Slack) con auto-descubrimiento del `user_id` | `COMPOSIO_API_KEY` (dashboard, `ak_…`) |
| `conocimiento.js` | RAG sobre documentos: troceado por secciones, Vectorize + bge-m3, filtro piso+cercanía medido contra el índice real | Índice Vectorize + binding `KB` |
| `reporte.js` | El resumen del día por correo (Gmail vía Composio, o Resend) + recordatorios por cron | `CORREO_DUENO` + Composio o Resend |

También son playground: las secciones Conocimiento/Flujo/Capacidades del panel y las
skills marcadas "avanzado" (`/conectar`, `/cargar-conocimiento`, `/agregar-capacidad`,
`/afinar`). El mapa completo está en [`AVANZADO.md`](https://github.com/luiscordova-dev/relevo/blob/main/AVANZADO.md) en el repo de Relevo.

---

🎓 Si quieres aprender a crear agentes de IA y automatizaciones con Claude Code en
serio, [anótate a la lista](https://tally.so/r/EkGZoL?origen=avanzado).
