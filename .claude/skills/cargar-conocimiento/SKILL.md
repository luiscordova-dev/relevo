---
name: cargar-conocimiento
description: 'AVANZADO · referencia sin soporte (ver AVANZADO.md): Cargas al agente información que no cabe en su prompt — un menú completo, un catálogo, un export de base de datos, una lista de precios, un PDF de políticas. Claude la reestructura para que la búsqueda la encuentre de verdad, la indexa y comprueba con preguntas reales que se recupera. Úsala con "/cargar-conocimiento", "quiero subirle mi catálogo", "tengo un Excel con los precios", "que aprenda de este documento".'
---

# Cargar conocimiento

La información del negocio va en `negocio.js` y eso alcanza para la mayoría. Esta skill es
para cuando NO alcanza: 200 productos, un menú de 12 páginas, un export de la base de datos
del negocio.

**La regla que gobierna todo esto:** un documento mal estructurado se indexa igual de bien
que uno bueno, y falla en silencio — el agente contesta "eso no lo tengo a la mano" con el
dato adentro. El trabajo de esta skill no es subir el archivo: es **dejarlo en un estado en
el que la búsqueda lo encuentre**, y probarlo.

## Paso 0 · ¿Esto de verdad va al conocimiento?

| Lo que tiene la persona | A dónde va |
|---|---|
| 5 servicios con su precio, horario, dirección | `negocio.js` — cabe en el prompt, es más simple y más confiable |
| Catálogo de 50+ productos, menú largo, políticas extensas | Conocimiento (esta skill) |
| Datos que cambian solos (inventario, estatus de pedidos) | NO es conocimiento: es una capacidad → `/agregar-capacidad` |
| Un Excel que actualizan cada semana | Conocimiento, pero avísale que hay que volver a cargarlo al cambiar |

Si cabe en `negocio.js`, **ponlo ahí y no enciendas nada más**. La complejidad se paga sola
solo cuando la información la exige.

## Paso 1 · Enciende el índice, si hace falta

Revisa si `wrangler.jsonc` ya tiene el binding `KB`. Si no:

```bash
npx wrangler vectorize create <nombre-del-agente>-kb --dimensions=1024 --metric=cosine
```

Y agrega a `wrangler.jsonc`:
```jsonc
"vectorize": [{ "binding": "KB", "index_name": "<nombre-del-agente>-kb" }],
```

La tabla `documentos` ya está en `schema.sql`. Si la base es vieja, créala:
```bash
npx wrangler d1 execute <agente>-db --remote --file=schema.sql
```

Publica y **espera ~20 s** antes de probar.

## Paso 2 · Lee lo que te dieron y reestructúralo (aquí está el valor)

Nunca subas el archivo tal cual. Léelo, entiéndelo y **reescríbelo** con este formato:

```
NOMBRE DE LA SECCIÓN

- Cosa: precio. Detalle que importa, en la misma línea.
- Otra cosa: precio. Su detalle.

OTRA SECCIÓN

Un tema por párrafo. El párrafo se explica solo, sin depender del anterior.
```

Por qué exactamente así: el troceador corta por párrafos y **arrastra el encabezado de
sección a cada trozo**. Un trozo que dice "Pedicure spa: $280" bajo el encabezado UÑAS se
encuentra buscando "uñas"; el mismo texto sin encabezado, no.

### Qué arreglar al reescribir

| Lo que llega | Qué hacer |
|---|---|
| **CSV / export de base de datos** | Convertir cada fila en una línea legible: `- Producto X: $450. Talla M, color azul, 3 en existencia.` Nada de encabezados de columna sueltos |
| **Siglas y abreviaturas** | Resolverlas: "Trat. cap. 30min" → "Tratamiento capilar, 30 minutos". Nadie busca por la abreviatura |
| **Precios sin moneda o sin unidad** | "450" → "$450 MXN". "2" → "2 horas" |
| **Columnas técnicas** | Quitar SKUs, ids internos, timestamps, columnas vacías. Es ruido que compite con lo útil |
| **Tablas anchas** | Volverlas líneas. Una tabla de 8 columnas se trocea horrible |
| **PDF pegado** | Quitar números de página, encabezados repetidos y saltos a media palabra |
| **Todo junto sin secciones** | Agrupar por tema e inventar los encabezados que faltan. Es el arreglo de mayor impacto |
| **Un párrafo que depende del anterior** | Hacerlo autónomo: "Ese servicio dura 2 horas" → "El balayage dura 2 horas" |
| **Lo que el negocio NO hace** | Escribirlo también: "No hacemos extensiones de pestañas." Evita que el agente lo deje ambiguo |

**Confirma con la persona lo que no sepas.** Si el archivo dice "Bal. 1200 (dep largo)", no
adivines: pregunta si es "Balayage desde $1,200, depende del largo".

## Paso 3 · Súbelo

Desde el panel → **Conocimiento** → **+ Documento**, o por la API:

```bash
curl -X POST "https://<agente>.workers.dev/api/documento?clave=<CLAVE>" \
  -H "Content-Type: application/json" \
  -d @documento.json
```
donde `documento.json` es `{"titulo":"…","contenido":"…"}`.

La respuesta trae `{"indexado":true,"trozos":N}`. **Si `indexado` es `false`, el texto se
guardó pero la búsqueda NO lo va a encontrar**: lee el `error` y arréglalo antes de seguir.

Un documento bien hecho da entre 1 y 3 trozos por sección. Si un documento de 20 KB dio 2
trozos, o uno de 2 KB dio 30, algo está mal en la estructura: vuelve al paso 2.

## Paso 4 · Pruébalo. Sin esto, no terminaste

**Escribe 5 preguntas como las haría un cliente** — no como está escrito el documento. Si
el documento dice "Keratina brasileña: $1,850", la pregunta de prueba es "cuánto sale el
alisado", no "cuánto cuesta la keratina brasileña".

Incluye siempre:
- **Un dato enterrado a media lista** (no el primero ni el último)
- **Una pregunta que el documento NO responde** → tiene que capturar, no inventar
- **Un detalle fino** (una restricción, un horario especial, una excepción)

Pruébalas en el panel → Conocimiento → **Pruébalo aquí**, o por API:

```bash
curl -s -X POST "https://<agente>.workers.dev/api/probar?clave=<CLAVE>" \
  -H "Content-Type: application/json" -d '{"texto":"cuanto sale el alisado?"}'
```

Devuelve la respuesta **y los fragmentos que usó con su puntaje**. Eso es lo que te deja
diagnosticar:

| Lo que ves | Qué significa | Qué hacer |
|---|---|---|
| Contestó bien, 1-2 fragmentos con 60%+ | Está sano | Nada |
| No recuperó nada | La pregunta no se parece al texto | Reescribe esa parte con las palabras del cliente |
| Recuperó el fragmento pero contestó "no lo tengo" | El dato está enterrado dentro del trozo | Parte esa sección en párrafos más chicos |
| Recuperó 4 fragmentos de temas distintos, todos ~50% | Falta estructura | Agrega encabezados de sección |
| Inventó algo que no está | Grave | Revisa que el documento diga explícitamente lo que el negocio NO hace |

También puedes ver los fragmentos crudos:
```bash
curl -s "https://<agente>.workers.dev/api/buscar?clave=<CLAVE>&q=cuanto+sale+el+alisado&k=8"
```

## Paso 5 · Corre la autoprueba y reporta

```bash
curl -X POST "https://<agente>.workers.dev/prueba?clave=<CLAVE>"
```

Con el conocimiento encendido, la autoprueba incluye **📚 Encuentra en tus documentos**.
Tiene que salir en verde.

Reporta a la persona, con evidencia:
- Cuántos documentos, cuántos trozos
- Las 5 preguntas de prueba **con la respuesta que dio el agente** y el % de cada fuente
- Qué reestructuraste y por qué (para que la próxima carga ya venga bien)

## Cosas que muerden

- **Vectorize tarda unos segundos** en dejar disponible un documento recién indexado. Si
  pruebas de inmediato y no sale, espera y reintenta antes de diagnosticar.
- **Editar un documento reindexa todo el documento**, no solo lo que cambió. Es correcto y
  es barato.
- **Borrar desde el panel también borra del índice.** Si el borrado del índice falla, el
  documento NO se borra de la base — a propósito: un documento invisible que sigue
  contestando es peor que uno visible.
- **Los embeddings son multilingües** (`@cf/baai/bge-m3`), pero la búsqueda funciona mejor
  si el documento está en el idioma en que escriben los clientes.
- **La información de `negocio.js` sigue yendo completa en el prompt** mientras sea chica.
  Solo cuando pasa de ~8 KB el agente empieza a apoyarse en la búsqueda. El medidor de la
  sección Conocimiento te dice en cuál de los dos modos está.
