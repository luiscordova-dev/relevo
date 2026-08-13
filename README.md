# Relevo

**De cero a un agente de WhatsApp en producción, en 30 minutos.**

Un agente real, no un eco de API: webhook firmado con HMAC, transcripción de notas de voz,
visión, captura de leads con evidencia de entrega, escalación a humano, herramientas vía
Composio, evals propias con **auto-reparación de modelo**, panel de operación incluido y
medición de costo exacta al neuron. **Cero dependencias de npm en el runtime.**

Lo construyes conversando: una skill de Claude Code te entrevista sobre el negocio,
genera el agente, lo despliega en tu Cloudflare y **no te dice "listo" hasta que sus 8
pruebas pasan con evidencia** — incluido el aviso de Telegram confirmado con `message_id`.

```bash
git clone https://github.com/USUARIO/relevo.git
cd relevo
claude
# → /crear-agente
```

> **La letra chica, de frente:** en 30 minutos está en producción y contestando con la
> información que le diste. Dejarlo fino para clientes reales pide lo de siempre: probarlo
> como cliente, completar su información y correr `/afinar` la primera semana. Los kits que
> prometen "listo al 100% sin tocar nada" es exactamente lo que esto no es.

---

## Por qué está mejor hecho que el promedio

| | |
|---|---|
| **La captura no depende de tool-calling** | El modelo emite un bloque estructurado; un parser determinista (con rescate por regex) ejecuta el guardado y el aviso. Menos magia, cero avisos fantasma |
| **Evidencia, no fe** | Un aviso "enviado" sin `message_id` de Telegram cuenta como NO entregado, y el panel lo marca. Si el aviso falla, el lead se guarda igual |
| **Evals con auto-reparación** | El agente corre 6 escenarios contra sí mismo; si su modelo no da el ancho, prueba el suplente y devuelve una acción aplicable (`cambiar-modelo` / `revisar-informacion` / `usar-llave-propia`) |
| **Seguridad de serie** | Firma HMAC del webhook validada en tiempo constante, filtro por cuenta (los webhooks de Zernio son account-wide), idempotencia por `platformMessageId`, secretos fuera del código |
| **Costo exacto, no estimado** | Workers AI devuelve `neurons` por llamada y todo se registra. Una conversación típica: ~$0.004 USD. Con llave propia (OpenAI/Anthropic) se registran tokens y se marca como estimado |
| **Un solo Worker** | Agente + panel + API + cron en un deploy. Sin build, sin `node_modules`. El panel se modifica pidiéndoselo a Claude en español |

## Las skills — operan sobre el agente desplegado, no sobre teoría

| Skill | Qué hace |
|---|---|
| `/crear-agente` | La entrevista → genera → despliega → **prueba con evidencia**. CLI-first: nadie copia API keys a mano |
| `/autopsia` | Pegas un chat que salió mal → lo busca en la D1 real → reconstruye el turno → causa raíz → arreglo mínimo → re-verifica |
| `/auditoria` | Semáforo de seguridad (llaves en código, firma, secretos) y de costos (neurons reales, modelo correcto, picos) |
| `/afinar` | Lee las conversaciones reales, encuentra lo que no supo contestar, propone el arreglo con antes/después. Los datos los pones tú: ni el mantenimiento inventa |
| `/conectar` | Composio de cero a **probado**: la conexión no está lista cuando se configuró, sino cuando el evento apareció en tu calendario real |
| `/agregar-capacidad` | Describes la capacidad en español; la escribe con el molde `local:`, le escribe su prueba y verifica que nada más se rompió |

## Qué hace el agente

Contesta 24/7 con la información del negocio · entiende **notas de voz** (Whisper) y
**fotos** (Llama Vision) · **no inventa** — si no sabe, lo dice y captura · captura leads
y **avisa por Telegram al momento** · escala a humano cuando lo piden o hay queja (y se
calla para que entres tú) · ejecuta herramientas de Composio (agenda, CRM, Slack, 1000+
apps) · panel de operación con inbox, toma de control, etiquetas, recordatorios y notas
privadas · reporte diario por correo.

## Stack

**Cloudflare Workers** (runtime) · **Workers AI** — Llama 3.3 70B por default, elegido por
bake-off contra 4 modelos, con GPT-OSS-120B de suplente y BYOK opcional (OpenAI/Anthropic)
· **D1** (datos) · **Zernio** (WhatsApp — sandbox gratis para arrancar, tu número para
producción) · **Telegram** (avisos) · **Composio** (herramientas) · **Resend** (reporte
diario, opcional).

- **[Cómo funciona por dentro](docs/como-funciona.md)** — arquitectura y decisiones
- **[Personalizar](docs/personalizar.md)** · **[Ir a producción](docs/ir-a-produccion.md)**
- **[Guía para tu cliente](GUIA.md)** — si entregas el agente a alguien no técnico, esta es su guía

## Licencia

MIT. Úsalo, véndelo, hazlo tuyo.
