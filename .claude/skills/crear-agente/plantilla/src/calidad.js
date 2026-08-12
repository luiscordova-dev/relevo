// Control de calidad del cerebro, con auto-reparación.
//
// El dueño del negocio no tiene por qué saber qué es un modelo ni por qué a veces
// contesta raro. Esto lo detecta solo, intenta arreglarlo solo, y si no puede,
// dice EXACTAMENTE qué hacer en una frase que cualquiera entiende.

import { pensar, separarDatos, construirSystemPrompt } from "./cerebro.js";

// El modelo incluido y su suplente. Si el primero falla la prueba, se prueba el otro.
export const MODELO_PRINCIPAL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
export const MODELO_SUPLENTE = "@cf/openai/gpt-oss-120b";

// Errores de español que delatan a un modelo que no da el ancho.
const ESPANOL_MALO = [
  "te dejo tomar tus datos", "estamos abierto ", "gustaría de ", "puedo de ayudar",
  "estamos cerrado ", "quieres de ",
];

// Escenarios genéricos: prueban el mecanismo, no el giro del negocio.
const ESCENARIOS = [
  {
    id: "capta al interesado",
    peso: 3, // lo más importante del kit: si esto falla, no llegan los avisos
    turnos: [
      { role: "user", content: "hola, me interesa lo que ofrecen" },
      { role: "assistant", content: "¡Hola! Con gusto te ayudo. ¿Cómo te llamas?" },
      { role: "user", content: "me llamo Rodrigo y quiero contratar el servicio esta semana" },
    ],
    valida: ({ datos }) => datos?.tipo === "lead" && !!datos?.nombre &&
      !["desconocido", "cliente", ""].includes(String(datos.nombre).toLowerCase()),
  },
  {
    id: "no avisa sin nombre",
    peso: 1,
    turnos: [{ role: "user", content: "hola, me interesa, ¿cuánto cuesta?" }],
    valida: ({ datos }) => datos?.tipo !== "lead",
  },
  {
    id: "detecta que piden un humano",
    peso: 3,
    turnos: [{ role: "user", content: "ya llevo rato esperando, quiero hablar con una persona real" }],
    valida: ({ datos }) => datos?.tipo === "humano",
  },
  {
    id: "detecta una queja",
    peso: 2,
    turnos: [{ role: "user", content: "pésimo servicio, me cobraron de más y nadie me responde" }],
    valida: ({ datos }) => datos?.tipo === "humano",
  },
  {
    id: "no inventa",
    peso: 3,
    turnos: [{
      role: "user",
      content: "¿tienen el paquete especial de 50 piezas con 90% de descuento y envío gratis a todo el mundo?",
    }],
    valida: ({ visible }) =>
      !/(sí|claro|por supuesto|efectivamente)[,! ].{0,40}(90|descuento|paquete especial|envío gratis)/i.test(visible),
  },
  {
    id: "escribe bien el español",
    peso: 2,
    turnos: [{ role: "user", content: "hola! qué horario tienen? me interesa ir" }],
    valida: ({ visible }) => !ESPANOL_MALO.some((m) => visible.toLowerCase().includes(m)),
  },
];

/** Corre los escenarios contra un modelo concreto. */
export async function evaluar(env, modelo) {
  const entorno = modelo ? { ...env, MODELO_CEREBRO: modelo } : env;
  const detalle = [];
  let puntos = 0, total = 0;

  for (const e of ESCENARIOS) {
    total += e.peso;
    try {
      const crudo = await pensar(entorno, e.turnos);
      const r = separarDatos(crudo);
      const ok = !!e.valida(r);
      if (ok) puntos += e.peso;
      detalle.push({ escenario: e.id, ok, respuesta: r.visible.slice(0, 120) });
    } catch (err) {
      detalle.push({ escenario: e.id, ok: false, error: String(err.message || err).slice(0, 140) });
    }
  }

  return { modelo: modelo || "el configurado", puntos, total, porcentaje: Math.round((puntos / total) * 100), detalle };
}

/**
 * Diagnostica y arregla lo que pueda solo.
 * Devuelve qué hay que hacer, en español que cualquiera entiende.
 */
export async function diagnosticar(env) {
  // Con llave propia no hay nada que cambiar por debajo: solo se reporta.
  const conLlavePropia = !!(env.OPENAI_API_KEY || env.ANTHROPIC_API_KEY);
  const actual = env.MODELO_CEREBRO || MODELO_PRINCIPAL;

  const primera = await evaluar(env, conLlavePropia ? null : actual);
  if (primera.porcentaje >= 90) {
    return {
      aprobado: true, accion: "ninguna",
      mensaje: `Tu agente pasó el control de calidad (${primera.porcentaje}%). Está listo.`,
      pruebas: [primera],
    };
  }

  if (conLlavePropia) {
    return {
      aprobado: false, accion: "revisar-informacion",
      mensaje: `Tu agente falló el control de calidad (${primera.porcentaje}%) con tu propia llave de IA. ` +
        `Con una IA de paga eso casi siempre significa que falta detalle en la información de tu negocio. ` +
        `Cuéntame qué te preguntan seguido y qué NO ofreces, y lo completo.`,
      pruebas: [primera],
      fallaron: primera.detalle.filter((d) => !d.ok).map((d) => d.escenario),
    };
  }

  // Arreglo automático nivel 1: probar el modelo suplente.
  const otro = actual === MODELO_PRINCIPAL ? MODELO_SUPLENTE : MODELO_PRINCIPAL;
  const segunda = await evaluar(env, otro);

  if (segunda.porcentaje >= 90 && segunda.porcentaje > primera.porcentaje) {
    return {
      aprobado: false, accion: "cambiar-modelo", modeloRecomendado: otro,
      // El mensaje es para que el dueño lo LEA, no para que lo ejecute:
      // quien aplica el cambio es Claude, leyendo el campo "accion".
      mensaje: `El cerebro que traía tu agente no dio el ancho (pasó ${primera.porcentaje}% de la ` +
        `prueba), pero hay otro incluido que sí (${segunda.porcentaje}%). Se lo cambio y lo vuelvo a ` +
        `publicar — sigue siendo gratis y no cambia nada de lo que ya configuraste.`,
      pruebas: [primera, segunda],
    };
  }

  // Nivel 2: ninguno pasa → el problema es la información o hace falta una IA más fuerte.
  const fallaron = [...new Set([...primera.detalle, ...segunda.detalle].filter((d) => !d.ok).map((d) => d.escenario))];
  return {
    aprobado: false,
    accion: fallaron.includes("no inventa") ? "revisar-informacion" : "usar-llave-propia",
    mensaje: fallaron.includes("no inventa")
      ? `Los dos cerebros incluidos se pusieron a inventar cosas (pasaron ${primera.porcentaje}% y ` +
        `${segunda.porcentaje}% de la prueba). Casi siempre es porque falta detalle en la información ` +
        `de tu negocio. Dime qué NO ofreces y qué te preguntan seguido, y lo agrego para que deje de inventar.`
      : `Los dos cerebros incluidos fallaron la prueba (${primera.porcentaje}% y ${segunda.porcentaje}%). ` +
        `Para tu caso conviene conectar tu propia IA (OpenAI o Anthropic): cuestan centavos al mes y son ` +
        `más precisas. Si prefieres no pagar nada, tu agente igual funciona, pero revisa sus respuestas ` +
        `los primeros días.`,
    pruebas: [primera, segunda],
    fallaron,
  };
}
