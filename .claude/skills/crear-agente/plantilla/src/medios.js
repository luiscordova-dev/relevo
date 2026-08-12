// Oído y Vista: convierte notas de voz y fotos en texto que el cerebro entiende.

import { descargarAdjunto } from "./zernio.js";

/** btoa() revienta el stack con archivos grandes: hay que ir por bloques. */
function aBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

/** 🎙️ Nota de voz → texto. */
export async function escuchar(env, url) {
  const bytes = await descargarAdjunto(env, url);
  const r = await env.AI.run(env.MODELO_OIDO || "@cf/openai/whisper-large-v3-turbo", {
    audio: aBase64(bytes),
  });
  const texto = (r?.text || "").trim();
  if (!texto) throw new Error("El audio llegó vacío o no se entendió nada");
  return texto;
}

/** 👁️ Foto → descripción. */
export async function ver(env, url) {
  const bytes = await descargarAdjunto(env, url);
  const r = await env.AI.run(env.MODELO_VISTA || "@cf/meta/llama-3.2-11b-vision-instruct", {
    prompt:
      "Un cliente mandó esta imagen por WhatsApp a un negocio. Describe en español, en 2 frases, " +
      "qué se ve. Si hay texto, números o precios, transcríbelos exactamente.",
    image: [...bytes],
    max_tokens: 300,
  });
  const texto = (r?.response || r?.description || "").trim();
  if (!texto) throw new Error("No pude interpretar la imagen");
  return texto;
}

/**
 * Convierte el mensaje que llegó en texto para el cerebro.
 * Devuelve { texto, tipo }. Si un medio falla, el agente sigue vivo y lo dice.
 */
export async function interpretarMensaje(env, mensaje) {
  const adjunto = (mensaje.attachments || [])[0];
  const texto = (mensaje.text || "").trim();

  if (!adjunto) return { texto, tipo: "texto" };

  if (adjunto.type === "audio" || adjunto.type === "voice") {
    try {
      const dicho = await escuchar(env, adjunto.url);
      return { texto: texto ? `${dicho}\n\n${texto}` : dicho, tipo: "audio" };
    } catch {
      return {
        texto: "[El cliente mandó una nota de voz que no se pudo escuchar]",
        tipo: "audio",
        falla: true,
      };
    }
  }

  if (adjunto.type === "image") {
    try {
      const visto = await ver(env, adjunto.url);
      const desc = `[El cliente mandó una foto. Se ve: ${visto}]`;
      return { texto: texto ? `${desc}\n\n${texto}` : desc, tipo: "imagen" };
    } catch {
      return {
        texto: "[El cliente mandó una foto que no se pudo abrir]",
        tipo: "imagen",
        falla: true,
      };
    }
  }

  // Video, documento, sticker, ubicación: no los procesamos, pero avisamos al cerebro
  // para que conteste algo con sentido en vez de ignorar a la persona.
  return {
    texto: texto || `[El cliente mandó un archivo de tipo "${adjunto.type}"]`,
    tipo: adjunto.type || "otro",
  };
}
