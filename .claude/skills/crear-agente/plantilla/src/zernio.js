// Cliente de Zernio: descargar lo que manda el cliente y contestarle.

const API = "https://zernio.com/api/v1";

/** Descarga un adjunto (nota de voz, foto). La URL del webhook necesita la llave. */
export async function descargarAdjunto(env, url) {
  const r = await fetch(url, { headers: { Authorization: `Bearer ${env.ZERNIO_API_KEY}` } });
  if (!r.ok) throw new Error(`No pude descargar el archivo (HTTP ${r.status})`);
  return new Uint8Array(await r.arrayBuffer());
}

/**
 * Manda un mensaje de WhatsApp. Devuelve el messageId de la plataforma:
 * esa es la prueba de que salió, no una suposición.
 */
export async function responder(env, conversacionId, texto) {
  const r = await fetch(`${API}/inbox/conversations/${conversacionId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.ZERNIO_API_KEY}`,
    },
    body: JSON.stringify({ accountId: env.ZERNIO_ACCOUNT_ID, message: texto }),
  });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok || cuerpo?.success === false) {
    throw new Error(`Zernio rechazó el envío (HTTP ${r.status}): ${JSON.stringify(cuerpo).slice(0, 200)}`);
  }
  return cuerpo?.data?.messageId || null;
}

/** Marca la conversación como leída (los dos palomitas azules). Si falla, da igual. */
export async function marcarLeida(env, conversacionId) {
  try {
    await fetch(`${API}/inbox/conversations/${conversacionId}/read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.ZERNIO_API_KEY}`,
      },
      body: JSON.stringify({ accountId: env.ZERNIO_ACCOUNT_ID }),
    });
  } catch { /* cosmético */ }
}
