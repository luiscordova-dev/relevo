# Cloudflare — donde vive el agente

Plan gratis, sin tarjeta: Workers, Workers AI (10,000 neurons/día), D1 y cron.

## Entrar
```bash
npx wrangler login      # abre el navegador; la persona solo aprueba
npx wrangler whoami     # confirma
```

## Base de datos
```bash
npx wrangler d1 create <slug>-db          # devuelve database_id → va en wrangler.jsonc
npx wrangler d1 execute <slug>-db --remote --file=schema.sql -y
```

## Secretos (nunca en archivos)
```bash
echo -n "<valor>" | npx wrangler secret put NOMBRE
npx wrangler secret list                  # solo nombres, nunca valores
```
Genera los propios con `openssl rand -hex 20` (webhook) y `openssl rand -hex 8` (clave del panel).

## Publicar
```bash
npx wrangler deploy      # imprime la URL https://<slug>.<subdominio>.workers.dev
```

## ⏱️ Espera después de publicar o de guardar un secreto
Cloudflare tarda unos segundos en servir la versión nueva. **Espera ~20 s antes de probar.**
Si pruebas de inmediato vas a ver fallos falsos que asustan al dueño sin razón.

## Modelos (incluidos, sin llave aparte)
| Para qué | Modelo |
|---|---|
| Cerebro | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` |
| Cerebro suplente | `@cf/openai/gpt-oss-120b` |
| Oído | `@cf/openai/whisper-large-v3-turbo` |
| Vista | `@cf/meta/llama-3.2-11b-vision-instruct` |

**El de Vista pide aceptar una vez la licencia de Meta**, por cuenta. Si responde
`AiError 5016`, explícale qué es (unos términos de uso de Meta, gratis, una sola vez),
pide su "sí", y manda:
```bash
curl -s -X POST "https://api.cloudflare.com/client/v4/accounts/<id>/ai/run/@cf/meta/llama-3.2-11b-vision-instruct" \
  -H "Authorization: Bearer <token>" -d '{"prompt":"agree"}'
```
o desde el Worker `env.AI.run(modelo, { prompt: "agree" })`. Confirma que responda
"Thank you for agreeing". Si no quiere aceptar, usa `@cf/llava-hf/llava-1.5-7b-hf`
(funciona sin licencia, pero lee peor el texto de las fotos).
