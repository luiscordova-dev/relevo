// Capacidades propias de ESTE negocio. Las escribe /agregar-capacidad.
//
// Cada una: async (env, datos, usuario) => ({ ok: true, data } | { ok: false, error })
// Regla: NUNCA lanzar. Un fallo aquí no puede dejar al cliente sin respuesta.

export const capacidades = {
  // Ejemplo (borrable): cálculo puro, sin red.
  // envio_por_zona: async (env, { codigo_postal }) => {
  //   const zona = String(codigo_postal || "").slice(0, 2);
  //   const tabla = { "44": 80, "45": 80, "46": 120 };
  //   const costo = tabla[zona];
  //   return costo
  //     ? { ok: true, data: { costo, moneda: "MXN" } }
  //     : { ok: false, error: "No hay cobertura en ese código postal" };
  // },
};
