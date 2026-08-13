---
name: auditoria
description: Audita el agente desplegado y entrega un semáforo (verde/amarillo/rojo) de seguridad y de costos, con los números reales de la base de datos. Revisa llaves pegadas en código, validación de firma del webhook, secretos bien guardados, gasto real en IA, modelo correcto y picos de uso. Arregla lo que se pueda con permiso. Úsala con "/auditoria", "¿mi agente es seguro?", "audita mi agente", "¿cuánto está gastando?", "revisa la seguridad".
---

# Auditoría: seguridad y costos

Todo lo que se afirma aquí sale de **comprobar**, no de suponer. Cada punto del semáforo
lleva su evidencia al lado.

## Reglas
- Solo lectura. Los arreglos se proponen y se aplican **con permiso**, uno por uno.
- Nunca imprimas el valor de un secreto. Ni en el reporte, ni en la terminal.
- El reporte final es en lenguaje claro: el semáforo, qué significa, y qué hacer.

---

## A · Seguridad

### A1 · ¿Hay llaves pegadas en el código? — lo más grave
```bash
grep -rn -E "(sk_[a-zA-Z0-9]{20,}|Bearer [a-zA-Z0-9_-]{25,}|[0-9]{9,10}:AA[a-zA-Z0-9_-]{30,})" \
  src/ negocio.js marca.js wrangler.jsonc 2>/dev/null
```
🔴 si aparece cualquier cosa. El arreglo: moverla a secreto (`wrangler secret put`),
**revocar la llave expuesta** y generar una nueva. Si el repo tiene historial en git, dilo:
borrarla del archivo no la borra del historial.

### A2 · ¿Los secretos están donde deben?
```bash
npx wrangler secret list           # solo nombres
grep -n "API_KEY\|TOKEN\|SECRET\|CLAVE" wrangler.jsonc
```
✅ = `ZERNIO_API_KEY`, `ZERNIO_WEBHOOK_SECRET`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` y
`CLAVE_PANEL` en la lista de secretos, y en `wrangler.jsonc` **ninguno** (ahí solo va
`ZERNIO_ACCOUNT_ID`, que es identificador, no llave).

### A3 · ¿El webhook tiene candado? — el punto clave
Tres comprobaciones, las tres contra el agente vivo:
1. El secreto existe (`ZERNIO_WEBHOOK_SECRET` en la lista)
2. **Firma inválida se rechaza**: `POST /webhook/zernio` con `X-Zernio-Signature: 0000…`
   → debe dar **401**. Si da 200, cualquiera puede inyectarle mensajes al agente. 🔴
3. **Cuenta ajena se ignora**: payload firmado con `account.id` falso → 200 pero sin
   respuesta (revisa que no se agregó ningún mensaje a la base)

### A4 · Higiene
- `.secretos.local` y `.dev.vars` en `.gitignore`
- La clave del panel no anda en READMEs ni capturas
- El panel sin clave devuelve 401: `curl -o /dev/null -w "%{http_code}" <url>/panel`

## B · Costos (con la tabla `uso`, que es dato real de la API)

### B1 · Cuánto ha gastado y en qué
```bash
npx wrangler d1 execute <slug>-db --remote --json --command \
 "SELECT tipo, modelo, COUNT(*) llamadas, SUM(neurons) neurons, MIN(exacto) exacto
    FROM uso WHERE creado_en >= <hace-30-días-ms> GROUP BY tipo, modelo"
```
USD = neurons × 0.011 / 1000. Si `exacto=0` en alguna fila (llave propia), preséntalo
como estimado y dilo.

### B2 · ¿Está en el modelo correcto?
El free tier son **10,000 neurons/día**. Reglas de dedo:
- Promedio diario < 8,000 → ✅ verde, cabe en lo gratis
- Entre 8,000 y 10,000 → 🟡 va a empezar a costar; proponle `/calidad` para ver si el
  suplente (GPT-OSS-120B, salida 3× más barata) pasa igual de bien
- La tabla dice qué tipo gasta más: si `vista` domina y el negocio no necesita fotos,
  se puede apagar

### B3 · Picos y abuso
```sql
SELECT DATE(creado_en/1000,'unixepoch') dia, COUNT(*) n FROM mensajes
 WHERE rol='cliente' GROUP BY dia ORDER BY n DESC LIMIT 5
```
Un día con 5× el promedio merece pregunta. El mismo teléfono con >50 mensajes/día, también.

## El reporte

```
🛡️ SEGURIDAD
  🟢 Sin llaves en el código          (grep limpio en src/ y config)
  🟢 5 secretos donde deben           (wrangler secret list)
  🟢 Webhook con candado              (firma falsa → 401, probado)
  🟡 <lo que salga, con su evidencia y su arreglo>

💰 COSTOS (30 días, datos reales)
  Total: $0.14 USD · 12,800 neurons
  Cerebro 71% · Vista 21% · Oído 8%
  🟢 Promedio 420 neurons/día — cabe de sobra en lo gratis

QUÉ HACER (en orden):
  1. <arreglo concreto> — ¿lo aplico?
```

Cada 🔴 lleva su arreglo propuesto. Se aplican uno por uno, con confirmación, y al final
se corre la autoprueba completa para comprobar que nada se rompió.
