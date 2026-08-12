-- Base de datos del agente. Una por agente, nunca compartida.

CREATE TABLE IF NOT EXISTS conversaciones (
  id              TEXT PRIMARY KEY,        -- id de conversación de Zernio
  telefono        TEXT NOT NULL,
  nombre_contacto TEXT,
  -- epoch ms; si es futuro, el agente calla. PAUSA_INDEFINIDA = hasta que el
  -- dueño reactive a mano desde el panel.
  pausado_hasta   INTEGER,
  -- Cerrada = ya la atendiste y no quieres verla en la bandeja. No borra nada.
  cerrada         INTEGER NOT NULL DEFAULT 0,
  -- Recordatorio: epoch ms. Cuando llega la hora te avisa por Telegram y se limpia.
  recordatorio    INTEGER,
  -- Etiquetas separadas por coma. Simple a propósito: el dueño las inventa sobre la marcha.
  etiquetas       TEXT,
  creado_en       INTEGER NOT NULL,
  actualizado_en  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS mensajes (
  id                  INTEGER PRIMARY KEY AUTOINCREMENT,
  conversacion_id     TEXT NOT NULL,
  -- 'nota' es privada: se guarda pero NUNCA sale por WhatsApp.
  rol                 TEXT NOT NULL,       -- 'cliente' | 'agente' | 'dueño' | 'nota'
  texto               TEXT NOT NULL,
  tipo                TEXT NOT NULL DEFAULT 'texto',  -- texto | audio | imagen
  -- Clave de idempotencia: Zernio reintenta hasta 7 veces. Sin esto, un reintento
  -- hace que el agente conteste dos veces al mismo mensaje.
  platform_message_id TEXT UNIQUE,
  creado_en           INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_mensajes_conv ON mensajes (conversacion_id, id);

CREATE TABLE IF NOT EXISTS leads (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversacion_id TEXT NOT NULL UNIQUE,    -- un lead por conversación; se enriquece, no se duplica
  nombre          TEXT,
  telefono        TEXT NOT NULL,
  interes         TEXT,
  escalado        INTEGER NOT NULL DEFAULT 0,
  -- El motivo va aparte del interés: cuando alguien pide un humano no deja de
  -- querer lo que quería. Pisar 'interes' con el motivo perdía la venta.
  motivo          TEXT,
  -- EVIDENCIA: message_id que devolvió Telegram. Vacío = el aviso NO llegó.
  -- Son dos porque son dos avisos distintos y cada uno necesita su prueba.
  aviso_id        TEXT,
  aviso_urgente_id TEXT,
  creado_en       INTEGER NOT NULL,
  actualizado_en  INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS eventos (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo      TEXT NOT NULL,                 -- lead | escalacion | error | mensaje | reporte
  detalle   TEXT,
  creado_en INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_eventos_fecha ON eventos (creado_en);

-- Cuánto cuesta cada cosa que hace tu agente. Cloudflare cobra en "neurons" y su API
-- los devuelve por llamada, así que esto NO es una estimación: es el número real.
CREATE TABLE IF NOT EXISTS uso (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  conversacion_id TEXT,
  tipo            TEXT NOT NULL,      -- cerebro | oido | vista | calidad
  modelo          TEXT NOT NULL,
  tokens_entrada  INTEGER NOT NULL DEFAULT 0,
  tokens_salida   INTEGER NOT NULL DEFAULT 0,
  neurons         REAL    NOT NULL DEFAULT 0,
  -- 1 = el número viene de la API. 0 = lo calculamos nosotros (llave propia de
  -- OpenAI/Anthropic) y en el panel se muestra marcado como estimado.
  exacto          INTEGER NOT NULL DEFAULT 1,
  ms              INTEGER NOT NULL DEFAULT 0,
  creado_en       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_uso_fecha ON uso (creado_en);

-- Los ajustes que el dueño cambia desde el panel. El Worker los lee en caliente:
-- cambiar algo aquí NO obliga a volver a publicar.
CREATE TABLE IF NOT EXISTS ajustes (
  clave     TEXT PRIMARY KEY,
  valor     TEXT,
  guardado  INTEGER NOT NULL
);
