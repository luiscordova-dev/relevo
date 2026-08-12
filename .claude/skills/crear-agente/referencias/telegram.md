# Telegram — los avisos al dueño

Gratis, sin tarjeta. No es una cuenta nueva: es un chat con BotFather.

## Crear el bot (lo hace la persona, 2 minutos)
Dile exactamente esto:
1. Abre Telegram y busca **@BotFather** (el de la palomita azul)
2. Mándale `/newbot`
3. Nombre: el que quiera (ej. "Avisos de mi negocio")
4. Usuario: tiene que terminar en `bot` (ej. `avisos_mi_negocio_bot`)
5. Te contesta con un código largo tipo `8123456789:AAH...` — pégamelo aquí

Cuando lo pegue: adviértele en una línea que quedó en el historial del chat y que
puede revocarlo con `/revoke` si algún día quiere, y guárdalo tú:
```bash
echo -n "<token>" | npx wrangler secret put TELEGRAM_BOT_TOKEN
```

## Sacar su chat_id (automático)
```bash
curl -s "https://api.telegram.org/bot<TOKEN>/getMe"        # confirma el bot y da su @usuario
curl -s "https://api.telegram.org/bot<TOKEN>/getUpdates"   # de aquí sale result[].message.chat.id
```

**⚠️ El fallo más común, con diferencia:** `getUpdates` devuelve `{"ok":true,"result":[]}`.
Significa que le dio `/start` a **BotFather** y no a **su** bot. No repitas "dale /start":
saca el usuario con `getMe` y mándale el link directo:
> Abre **https://t.me/<usuario_del_bot>** y presiona el botón azul INICIAR.

Reintenta cada ~15 s. Cuando aparezca:
```bash
echo -n "<chat_id>" | npx wrangler secret put TELEGRAM_CHAT_ID
```

## Lo que el agente manda
`sendMessage` con `parse_mode: HTML` y un botón `inline_keyboard` que abre `wa.me/<tel>`.
La respuesta trae `result.message_id`: **esa es la prueba de que el aviso llegó.**
Si `ok` es false, `description` dice por qué (ej. "chat not found" = nunca dio /start).
