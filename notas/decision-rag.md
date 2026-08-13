# Decisión: ¿le metemos RAG? — SÍ, pero por umbral, no por default
**2026-08-12**

## La decisión en una frase
RAG **sí entra**, como segundo escalón automático: los agentes chicos siguen con la
información directa en el prompt (simple, cero piezas móviles), y cuando la información
crece o el dueño sube documentos, la skill enciende **Vectorize + bge-m3** — ambos
incluidos en la misma cuenta de Cloudflare, como dijiste.

## Los números que sostienen la decisión

**Hoy** la información del negocio va completa en el prompt (~1-2K tokens). Costo medido:
~46 neurons por mensaje ($0.0005). A esa escala, RAG sería complejidad gratis.

**El costo NO es la razón para RAG.** Con 20 KB de información (≈5K tokens) el prompt
sube a ~133 neurons de entrada por mensaje — sigue costando centavos. Las razones reales:

1. **La atención, no el precio.** Ya lo vimos en vivo: el modo de fallo "tenía el dato
   pero enterrado" existe (el modelo dice 'no tengo esa información' con el dato a media
   lista). Con 20+ KB eso se vuelve el modo de fallo dominante. RAG le pone enfrente solo
   los 3-4 fragmentos relevantes.
2. **El contexto es compartido.** Prompt + 12 mensajes de historial + bloque de
   herramientas + resultados de herramientas. Un negocio con catálogo grande se come el
   espacio de todo lo demás.
3. **La UX de documentos.** Un restaurante con menú PDF, una inmobiliaria con 40 fichas:
   eso no se pega en `negocio.js` — se sube como documentos, y documentos ⇒ indexación.

## Cómo se implementa (siguiente capítulo)

| Pieza | Qué |
|---|---|
| Umbral | `informacion` ≤ ~8 KB → prompt directo (como hoy). Más grande, o documentos en el panel → RAG |
| Índice | Vectorize (free tier: 5M dimensiones almacenadas, sobra para cientos de documentos) |
| Embeddings | `@cf/baai/bge-m3` (multilingüe, ya está en el catálogo de la cuenta) |
| Indexación | Al guardar un documento desde el panel → chunking + upsert; sin pasos manuales |
| Consulta | Antes de pensar: top-4 fragmentos por similitud entran al prompt como "INFORMACIÓN RELEVANTE" |
| Panel | Sección "Conocimiento": documentos editables + botón reindexar + el Radar de /afinar propone el documento que falta |
| Anti-invento | Igual que hoy: si los fragmentos no traen la respuesta, captura en vez de inventar |

## Por qué por umbral y no siempre
El kit se vende por robustez. RAG mete dos piezas más que pueden fallar (índice y
embeddings) y una clase nueva de bug (el fragmento correcto no se recupera). Un agente de
salón con 2 KB de precios no gana nada y sí arriesga. La regla: **la complejidad se paga
sola cuando la información la exige** — y la skill decide con el número, no la persona.
