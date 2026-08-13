// 📚 Conocimiento — lo que tu agente sabe cuando ya no cabe en el prompt.
//
// Por qué existe: la información del negocio va completa en el prompt, y eso
// funciona muy bien hasta cierto tamaño. Pasado ese punto aparece un modo de
// fallo feo — el agente TIENE el dato pero contesta "no lo tengo a la mano",
// porque quedó enterrado a media lista. Aquí se le ponen enfrente solo los 3-4
// fragmentos que importan.
//
// Regla de la casa: la complejidad se paga sola cuando la información la exige.
// Con poca información esto ni se enciende.

import { negocio } from "../../negocio.js";

/** Arriba de esto, la información deja de caber cómoda en el prompt. */
export const UMBRAL_BYTES = 8000;

/** Trozos de ~800 caracteres: suficiente para un servicio con su precio y su nota. */
const TAMANO_TROZO = 800;
const SOLAPE = 120;
const MODELO_EMBED = "@cf/baai/bge-m3";

/** El índice existe (binding puesto en wrangler.jsonc). Sin él, todo sigue igual que antes. */
export const ragDisponible = (env) => !!env.KB;

export const bytes = (s) => new TextEncoder().encode(String(s || "")).length;

/** La información del negocio ya no cabe cómoda: conviene indexarla. */
export const infoEsGrande = () => bytes(negocio.informacion) > UMBRAL_BYTES;

/**
 * ¿El agente está usando RAG ahora mismo?
 * Sí cuando hay índice Y (hay documentos O la información del negocio es grande).
 */
export async function ragActivo(env) {
  if (!ragDisponible(env)) return false;
  if (env.AJUSTES && String(env.AJUSTES.cap_conocimiento ?? "1") === "0") return false;
  if (infoEsGrande()) return true;
  const r = await env.DB.prepare("SELECT COUNT(*) n FROM documentos").first().catch(() => null);
  return (r?.n || 0) > 0;
}

/**
 * Corta un texto largo en trozos que el buscador pueda encontrar.
 *
 * Dos cosas que parecen detalle y no lo son:
 *  1. El solape es un PÁRRAFO completo, nunca N caracteres. Cortar a media
 *     palabra ("s: desde $1,400…") mete ruido y el fragmento deja de parecerse
 *     a la pregunta que debería encontrarlo.
 *  2. Cada trozo arrastra el encabezado de su sección. Sin eso, un trozo que
 *     dice "Pedicure spa: $280" no sabe que habla de UÑAS, y una pregunta por
 *     "uñas" no lo encuentra.
 */
export function trocear(texto) {
  const limpio = String(texto || "").trim();
  if (!limpio) return [];

  const bloques = limpio.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const trozos = [];
  let actual = [];
  let largo = 0;
  let seccion = "";
  let yaEmpujado = null;   // el bloque que quedó como solape: no vuelve a empujarse solo

  const conSeccion = (cuerpo) =>
    seccion && !cuerpo.startsWith(seccion) ? `${seccion}\n\n${cuerpo}` : cuerpo;

  const cerrar = () => {
    if (!actual.length) return;
    const cuerpo = actual.join("\n\n");
    // Si lo único que queda es el solape heredado, ya está dentro del trozo anterior.
    if (actual.length === 1 && actual[0] === yaEmpujado) { actual = []; largo = 0; return; }
    trozos.push(conSeccion(cuerpo));

    const ultimo = actual[actual.length - 1];
    if (ultimo.length <= SOLAPE && !esEncabezado(ultimo)) {
      actual = [ultimo]; largo = ultimo.length; yaEmpujado = ultimo;
    } else {
      actual = []; largo = 0; yaEmpujado = null;
    }
  };

  for (const b of bloques) {
    if (esEncabezado(b)) {
      // Un encabezado abre sección: cierra lo anterior para no mezclar temas.
      cerrar();
      seccion = b;
      actual = []; largo = 0; yaEmpujado = null;
      continue;
    }
    if (b.length > TAMANO_TROZO) {
      cerrar();
      for (const pedazo of cortarPorOraciones(b)) trozos.push(conSeccion(pedazo));
      actual = []; largo = 0; yaEmpujado = null;
      continue;
    }
    if (largo && largo + b.length + 2 > TAMANO_TROZO) cerrar();
    actual.push(b);
    largo += b.length + 2;
  }
  cerrar();

  return trozos.filter(Boolean);
}

/** Un encabezado: línea corta, sin puntuación de cierre y sin viñeta. */
const esEncabezado = (b) =>
  !b.includes("\n") && b.length <= 60 && !/[.:;,!?]$/.test(b) && !/^[-*•\d]/.test(b);

/** Un párrafo que por sí solo pasa del tamaño: se corta por oraciones completas. */
function cortarPorOraciones(parrafo) {
  const oraciones = parrafo.match(/[^.!?]+[.!?]*\s*/g) || [parrafo];
  const salida = [];
  let actual = "";
  let anterior = "";

  for (const o of oraciones) {
    if (actual.length + o.length > TAMANO_TROZO && actual) {
      salida.push(actual.trim());
      // El solape es la última oración completa, no un corte ciego.
      actual = (anterior.length <= SOLAPE ? anterior : "") + o;
    } else {
      actual += o;
    }
    anterior = o;
  }
  if (actual.trim()) salida.push(actual.trim());
  return salida;
}

/** Convierte textos en vectores. Devuelve [] si el modelo falla: nunca lanza. */
async function embeber(env, textos) {
  if (!textos.length) return [];
  try {
    const r = await env.AI.run(MODELO_EMBED, { text: textos });
    return r?.data || [];
  } catch {
    return [];
  }
}

/**
 * Indexa un documento: lo trocea, lo embebe y lo mete al índice.
 * Borra primero los trozos viejos del mismo documento para que editar no duplique.
 */
export async function indexarDocumento(env, { id, titulo, contenido, trozos: trozosPrevios = 0 }) {
  if (!ragDisponible(env)) return { ok: false, error: "No hay índice de conocimiento (binding KB)." };

  const limpieza = await borrarDelIndice(env, id, trozosPrevios);
  if (!limpieza.ok) {
    return { ok: false, error: `No se pudieron quitar los fragmentos viejos: ${limpieza.error}` };
  }
  const trozos = trocear(contenido);
  if (!trozos.length) return { ok: true, trozos: 0 };

  // Se embebe CON el título del documento delante, y se guarda el trozo limpio.
  // Con varios documentos, el título es lo que distingue "precios" del menú de
  // "precios" de la lista de mayoreo; en el prompt, en cambio, solo estorbaría.
  const paraEmbeber = trozos.map((t) => `${titulo || ""}\n\n${t}`.trim());
  const vectores = await embeber(env, paraEmbeber);
  if (vectores.length !== trozos.length) {
    return { ok: false, error: "El modelo de embeddings no devolvió todos los vectores." };
  }

  await env.KB.upsert(trozos.map((texto, i) => ({
    id: `${id}:${i}`,
    values: vectores[i],
    metadata: { doc: String(id), titulo: String(titulo || ""), texto, i },
  })));
  return { ok: true, trozos: trozos.length };
}

/**
 * Quita del índice todos los trozos de un documento.
 *
 * ⚠️ Esto tiene que funcionar de verdad. Un documento borrado del panel que
 * sigue vivo en el índice es peor que no haberlo borrado: el dueño cree que lo
 * quitó y el agente lo sigue usando. Por eso devuelve el error en vez de
 * tragárselo, y quien llama lo reporta.
 *
 * `cuantos` es el número de trozos que tenía (columna `trozos` en D1). Se le
 * suma un colchón por si el documento encogió entre versiones.
 */
export async function borrarDelIndice(env, id, cuantos = 0) {
  if (!ragDisponible(env)) return { ok: true, borrados: 0 };
  const total = Math.min(400, Math.max(Number(cuantos) || 0, 60) + 20);
  const ids = Array.from({ length: total }, (_, i) => `${id}:${i}`);
  try {
    const r = await env.KB.deleteByIds(ids);
    return { ok: true, borrados: r?.count ?? r?.mutationId ? total : total };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
}

/**
 * Los fragmentos que responden a esta pregunta. Nunca lanza: si el índice falla,
 * el agente sigue contestando con lo que tiene en el prompt.
 */
export async function buscarFragmentos(env, pregunta, k = 4) {
  if (!ragDisponible(env) || !String(pregunta || "").trim()) return [];
  if (String(env.AJUSTES?.cap_conocimiento ?? "1") === "0") return [];
  try {
    const [vector] = await embeber(env, [String(pregunta).slice(0, 1000)]);
    if (!vector) return [];
    // Se piden más de los que se usan: el filtro de abajo decide cuántos sobreviven.
    const r = await env.KB.query(vector, { topK: Math.max(k, 8), returnMetadata: "all" });
    const todos = (r?.matches || [])
      .map((m) => ({
        texto: m.metadata?.texto || "",
        titulo: m.metadata?.titulo || "",
        score: m.score ?? 0,
      }))
      .filter((f) => f.texto)
      .sort((a, b) => b.score - a.score);

    return filtrarRelevantes(todos).slice(0, k);
  } catch {
    return [];
  }
}

/**
 * Cuáles fragmentos valen la pena. Medido contra el índice real, no supuesto:
 * el fragmento correcto sale con 0.60-0.65 y los distractores con 0.41-0.55.
 *
 * Por eso NO sirve un corte fijo: a 0.4 pasa todo (una pregunta de otro giro
 * todavía recupera algo a 0.41), y a 0.6 se cae la mitad de lo bueno. Se usan
 * dos cortes juntos:
 *   - PISO: por debajo, ni el mejor resultado tiene que ver con la pregunta.
 *   - RELATIVO: quien no se acerque al mejor es ruido, y el ruido hace inventar.
 */
const PISO = 0.5;
const CERCANIA = 0.88;

export function filtrarRelevantes(ordenados) {
  if (!ordenados.length) return [];
  const mejor = ordenados[0].score;
  if (mejor < PISO) return [];
  return ordenados.filter((f) => f.score >= mejor * CERCANIA);
}

/**
 * El bloque que entra al prompt. Ojo con la última línea: sin ella, el modelo
 * rellena los huecos que dejan los fragmentos — que es justo lo que este kit
 * existe para no hacer.
 */
export function bloqueDeConocimiento(fragmentos) {
  if (!fragmentos?.length) return "";
  const lista = fragmentos
    .map((f, i) => `[${i + 1}]${f.titulo ? ` ${f.titulo}` : ""}\n${f.texto}`)
    .join("\n\n");

  return `

## INFORMACIÓN RELEVANTE PARA ESTA PREGUNTA
Esto salió de los documentos del negocio y es tan válido como lo que sabes arriba:

${lista}

Si lo de aquí no alcanza para contestar, NO lo completes de tu cabeza: dilo con
naturalidad y toma sus datos, igual que con cualquier otra cosa que no sabes.`;
}
