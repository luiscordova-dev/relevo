---
name: agregar-capacidad
description: 'AVANZADO · referencia sin soporte (ver AVANZADO.md): Le agregas una capacidad nueva al agente describiéndola en español — "que consulte el estatus de un pedido", "que calcule el costo de envío por código postal", "que revise si hay inventario". Claude la escribe usando las herramientas existentes como molde, la conecta, le escribe su prueba y verifica que nada más se rompió. Úsala con "/agregar-capacidad", "quiero que mi agente pueda…", "agrégale que…", "que también haga…".'
---

# Agregar una capacidad

El agente trae captura, avisos, oído, vista y herramientas de Composio. Esta skill es para
lo que NO trae: capacidades del negocio de esta persona en particular.

## Paso 1 · Entiende qué quiere, en sus términos
Tres preguntas máximo:
1. **¿Qué debe poder hacer?** ("consultar si un pedido ya se envió")
2. **¿De dónde sale la información?** — esto decide TODO el diseño:

| La información vive en… | El camino |
|---|---|
| Una app conocida (Sheets, Notion, un CRM) | Es una herramienta de Composio → manda a `/conectar` |
| Una API propia del negocio | Función nueva en el Worker con `fetch` |
| Es un cálculo con reglas fijas (envíos por zona, precios por volumen) | Función pura, sin red |
| "En mi cabeza" / un Excel local | No es capacidad: es información → va en `negocio.js`, y `/afinar` la mantiene |

3. **¿Qué NO debe hacer?** (¿puede decir el total? ¿puede cancelar o solo consultar?)

## Paso 2 · Usa lo que ya existe como molde
El patrón ya está resuelto en `src/herramientas.js` — el loop del agente ya sabe pedir
herramientas, ejecutarlas con datos, manejar errores y componer la respuesta. Una capacidad
nueva es:

1. **La función** en `src/capacidades.js` (créalo si no existe): recibe `datos`, devuelve
   `{ ok, data }` o `{ ok: false, error }`. **Nunca lanza** — un fallo no puede tumbar la
   conversación. Y **tolerante con los nombres**: el modelo a veces manda `cp` en vez de
   `codigo_postal` — acepta las variantes obvias (`datos.codigo_postal ?? datos.cp ?? …`).
   En el campo `datos` de la herramienta, di la clave EXACTA: `'codigo_postal (5 dígitos,
   con esa clave)'`.
2. **El registro** en `negocio.js` → `herramientas`, con `tool: "local:<nombre>"`. En
   `ejecutar()` de `herramientas.js`, el prefijo `local:` enruta a `capacidades.js` en vez
   de a Composio (agrégalo la primera vez: son ~6 líneas).
3. **El `para`** bien escrito: es lo que el cerebro lee para decidir CUÁNDO usarla. "consultar
   el estatus de un pedido cuando el cliente dé su número de orden" — así de específico.

Si necesita un secreto (API key del sistema del negocio): `wrangler secret put`, jamás en
el código, y recuérdale de qué es cada secreto al final.

## Paso 3 · Escríbele su prueba ANTES de dársela al usuario
En `src/autoprueba.js`, agrega un escenario que la ejercite con un caso realista:
- El caso feliz: la pregunta del cliente dispara la capacidad y la respuesta usa el dato
- El caso roto: la fuente no responde → el agente degrada con gracia (captura y avisa),
  no inventa un resultado

## Paso 4 · Verifica el conjunto, no solo lo nuevo
1. Publica, espera 20 s.
2. Corre la autoprueba **completa**: lo nuevo en verde Y lo viejo sin romperse.
3. Prueba por el webhook real, actuando de cliente, y enseña la conversación.

## Paso 5 · Cierra en una frase
> Listo: tu agente ahora consulta pedidos. Probado con la orden 1043 (real) y con el
> sistema caído (contesta bien en ambos). Todo lo demás sigue en verde: 9/9.

## Cuándo decir que no
Dilo de frente cuando toca:
- **"Que cobre solo"** → se puede, pero con Stripe y con confirmación del dueño por cada
  cobro al principio. No se improvisa en una tarde.
- **"Que hable con la API de X"** donde X no tiene API → la verdad y las alternativas.
- **"Que haga 5 cosas"** → una por una. Cada capacidad con su prueba, si no, la tercera
  rompe la primera y nadie sabe cuándo.
