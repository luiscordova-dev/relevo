# Contesta

**Tu WhatsApp atendido 24/7, con la información de tu negocio. En 30 minutos.**

No necesitas saber programar. Describes tu negocio en español y Claude Code te construye
un agente que contesta a tus clientes, **captura a los interesados y te avisa a tu Telegram**
en cuanto alguien quiere comprar.

> **Lo que necesitas:** 2 cuentas gratis · **cero tarjetas** · 30 minutos
> *(Ningún paso de este kit te va a pedir una tarjeta. Si alguno lo hace, es un error.)*

---

## Empieza aquí

```bash
git clone https://github.com/USUARIO/contesta.git
cd contesta
claude
```

Ya dentro de Claude Code, escribe:

```
/crear-agente
```

Eso es todo. A partir de ahí solo contestas preguntas sobre tu negocio.

📺 **[Ver el video paso a paso](#)** — 21 minutos, de cero a tu agente contestando.

---

## Qué hace tu agente

| | |
|---|---|
| 💬 **Contesta 24/7** | Con la información de tu negocio. Vive en internet, no en tu compu. |
| 🎙️ **Entiende notas de voz** | Tus clientes mandan audios. Tu agente los escucha y responde a lo que dijeron. |
| 👁️ **Ve fotos** | Le mandan una foto de un producto o una lista de precios y la entiende. |
| 🛡️ **Nunca inventa** | Si no sabe algo, lo dice y toma los datos. No se inventa precios ni promesas. |
| 🔔 **Captura interesados** | Cuando alguien muestra interés real, consigue su nombre y qué quiere. |
| 📲 **Te avisa a Telegram** | En el momento. Con su nombre, su teléfono y un botón para contestarle. |
| 🙋 **Te pasa el chat** | Si piden una persona o se quejan, te avisa y se calla para que entres tú. |
| 📥 **Tu bandeja de entrada** | Todas las conversaciones desde tu celular. Puedes tomar el control y contestar tú. |

## Qué NO hace

**No agenda citas. No cobra. No persigue clientes por su cuenta.**

Es a propósito: hace pocas cosas y las hace bien. Contesta, captura y te avisa. Si después
quieres agregarle algo, se lo pides a Claude en español.

---

## Preguntas frecuentes

**¿De verdad no necesito saber programar?**
No. Tú describes tu negocio; Claude Code escribe, publica y prueba todo. Nunca vas a
escribir un comando ni abrir un archivo de código.

**¿Cuánto cuesta?**
Nada. El agente vive en el plan gratis de Cloudflare y usa la inteligencia artificial que
viene incluida ahí. El número de WhatsApp de prueba también es gratis.

**¿Puedo usarlo con mis clientes de verdad?**
El número que te da el kit es de prueba: sirve para que veas tu agente funcionando (50
mensajes al día, un teléfono). Para atender clientes reales le conectas tu propio número
de WhatsApp — [aquí te explicamos cómo](docs/ir-a-produccion.md).

**¿Cómo le cambio cosas después?**
Le hablas normal: *"sube el precio del corte a $300"*, *"que el agente sea más formal"*,
*"agrega que cerramos el 25 de diciembre"*. [Más ideas](docs/personalizar.md).

**¿Mis datos de quién son?**
Tuyos. El agente vive en **tu** cuenta de Cloudflare, con **tus** llaves. Nadie más los ve.

**¿Y si me atoro?**
Vuelve a Claude Code y dile qué pasó. El kit trae los tropiezos comunes ya mapeados, con
la solución de cada uno.

---

## Para quien le interese lo técnico

- **[Cómo funciona por dentro](docs/como-funciona.md)** — la arquitectura en una página
- **[Personalizar tu agente](docs/personalizar.md)** — qué pedirle a Claude
- **[Pasar a producción](docs/ir-a-produccion.md)** — tu propio número de WhatsApp

Corre en un Cloudflare Worker (JavaScript, sin dependencias), con D1 para tus datos y los
modelos incluidos de Workers AI. El WhatsApp entra por Zernio y los avisos salen por
Telegram. Todo el código que se genera es tuyo y está en tu carpeta.

## Licencia

MIT — úsalo como quieras, para lo que quieras. Ver [LICENSE](LICENSE).
