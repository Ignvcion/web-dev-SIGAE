// Modo oscuro de SIGAE.
//
// La app tiene sus colores escritos directamente en el CSS y en los estilos de
// cada componente (no usa variables de tema), así que el modo oscuro se arma
// convirtiendo esos colores al vuelo:
//   - Reglas CSS: se genera una hoja con la versión oscura de cada color, que solo
//     aplica con <html data-tema="oscuro">.
//   - Estilos en línea (style={{...}}): se convierten mientras el modo está activo
//     y se restauran al volver al modo claro.
// Reglas de conversión (para no romper colores con identidad, como los botones azules):
//   - Fondos claros (casi blancos o pastel) → oscuros, manteniendo el tono.
//   - Textos oscuros → claros, manteniendo el tono.
//   - Bordes claros → oscuros.
//   - Lo demás (botones de color, textos blancos, la barra lateral oscura) queda igual.
import { useSyncExternalStore } from "react";

const CLAVE = "SIGAE_TEMA"; // "oscuro" | "claro"; sin valor: el del sistema
const ATRIBUTO = "data-tema";
const COLOR_BARRA = { claro: "#1e40af", oscuro: "#0f172a" };

// ── Colores ─────────────────────────────────────────────────────────────────
const cacheColores = new Map();
let sonda = null;

// Convierte cualquier color CSS a [r, g, b, a] (0-255, a 0-1), o null si no es un color fijo
function leerColor(valor) {
  if (!valor) return null;
  const v = String(valor).trim().toLowerCase();
  if (!v || v === "transparent" || v === "currentcolor" || v === "inherit" || v === "initial" ||
      v === "unset" || v === "revert" || v.includes("var(") || v.includes("gradient")) return null;
  if (cacheColores.has(v)) return cacheColores.get(v);
  let rgba = null;
  const hex = /^#([0-9a-f]{3,8})$/.exec(v);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    if (h.length === 6 || h.length === 8) {
      rgba = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16),
        h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
    }
  } else {
    const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?\s*\)$/.exec(v);
    if (m) {
      let a = m[4] === undefined ? 1 : parseFloat(m[4]);
      if (m[4] && m[4].endsWith("%")) a /= 100;
      rgba = [+m[1], +m[2], +m[3], a];
    } else if (typeof document !== "undefined") {
      // Nombres de color (white, black, ...) u otros formatos: que el navegador lo resuelva
      sonda = sonda || document.createElement("span");
      sonda.style.color = "";
      sonda.style.color = v;
      if (sonda.style.color) {
        document.body.appendChild(sonda);
        const calculado = getComputedStyle(sonda).color;
        sonda.remove();
        rgba = calculado !== v ? leerColor(calculado) : null;
      }
    }
  }
  cacheColores.set(v, rgba);
  return rgba;
}

function aHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h;
  if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return [h / 6, s, l];
}

function desdeHsl(h, s, l) {
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  return [f(0), f(8), f(4)];
}

function escribir([r, g, b], a) {
  return a < 1 ? `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})` : `rgb(${r}, ${g}, ${b})`;
}

// tipo: "fondo" | "texto" | "borde". Devuelve el color oscuro, o null si se deja igual.
export function colorOscuro(valor, tipo) {
  const rgba = leerColor(valor);
  if (!rgba || rgba[3] === 0) return null;
  const [h, s, l] = aHsl(rgba);
  // Intensidad real del color (en tonos muy claros la saturación HSL engaña)
  const croma = (Math.max(rgba[0], rgba[1], rgba[2]) - Math.min(rgba[0], rgba[1], rgba[2])) / 255;
  let nuevo = null;
  if (tipo === "fondo") {
    // Capas semitransparentes (sombras, velos, resaltes sobre botones): quedan igual
    if (rgba[3] < 0.5) return null;
    if (l > 0.85) {
      // Pastel con color (avisos, etiquetas): un tono oscuro del mismo color.
      // Neutros: gris pizarra, como la barra lateral; el blanco queda un poco más claro que
      // los grises, para mantener la jerarquía tarjeta > fondo de página.
      nuevo = croma > 0.05
        ? desdeHsl(h, Math.min(Math.max(s, 0.35), 0.55), 0.2)
        : desdeHsl(220 / 360, 0.24, 0.07 + ((l - 0.85) / 0.15) * 0.08);
    } else if (l > 0.72) {
      // Grises y colores medio claros (chips, separadores): un tono oscuro pero visible
      nuevo = croma > 0.05 ? desdeHsl(h, Math.min(s, 0.5), 0.3) : desdeHsl(220 / 360, 0.2, 0.28);
    }
  } else if (tipo === "texto" && l < 0.62) {
    nuevo = desdeHsl(h, Math.min(s, 0.85), 0.95 - l * 0.45);
  } else if (tipo === "borde" && l > 0.75) {
    nuevo = desdeHsl(h, Math.min(s, 0.3), 0.22 + (1 - l) * 0.4);
  }
  return nuevo ? escribir(nuevo, rgba[3]) : null;
}

const PROPIEDADES = [
  ["background-color", "fondo"],
  ["color", "texto"],
  ["border-top-color", "borde"],
  ["border-right-color", "borde"],
  ["border-bottom-color", "borde"],
  ["border-left-color", "borde"],
  ["outline-color", "borde"],
  ["caret-color", "texto"],
];

// ── Hoja de estilos oscura (desde las reglas CSS) ──────────────────────────
const PREFIJO = `:root[${ATRIBUTO}="oscuro"]`;

// Separa "a, b:is(c, d)" en selectores sin cortar dentro de paréntesis
function separarSelectores(texto) {
  const partes = [];
  let nivel = 0, actual = "";
  for (const c of texto) {
    if (c === "(" || c === "[") nivel++;
    else if (c === ")" || c === "]") nivel--;
    if (c === "," && nivel === 0) { partes.push(actual.trim()); actual = ""; }
    else actual += c;
  }
  if (actual.trim()) partes.push(actual.trim());
  return partes;
}

function prefijar(selector) {
  const sel = selector.trim();
  if (/^(html|:root)\b/i.test(sel)) return sel.replace(/^(html|:root)/i, `${PREFIJO}`);
  return `${PREFIJO} ${sel}`;
}

function convertirReglas(reglas, salida) {
  for (const regla of reglas) {
    if (regla.type === 1 /* estilo */) {
      // Se copian TODAS las propiedades de color de la regla (convertidas o tal cual):
      // así las reglas oscuras mantienen entre sí la misma cascada que las originales y
      // una regla más específica (p. ej. un botón activo) no queda tapada.
      const decl = [];
      for (const [prop, tipo] of PROPIEDADES) {
        const valor = regla.style.getPropertyValue(prop);
        if (!valor) continue;
        const nuevo = colorOscuro(valor, tipo);
        decl.push(`${prop}: ${nuevo || valor}${regla.style.getPropertyPriority(prop) ? " !important" : ""}`);
      }
      if (decl.length) salida.push(`${separarSelectores(regla.selectorText).map(prefijar).join(", ")} { ${decl.join("; ")} }`);
    } else if (regla.type === 4 /* @media */ || regla.type === 12 /* @supports */) {
      const interno = [];
      convertirReglas(regla.cssRules, interno);
      if (interno.length) salida.push(`${regla.type === 4 ? "@media" : "@supports"} ${regla.conditionText || regla.media?.mediaText} { ${interno.join("\n")} }`);
    }
  }
}

const BASE = `
${PREFIJO} { color-scheme: dark; background-color: #191e28; }
${PREFIJO} body { background-color: #191e28; color: #e2e8f0; }
${PREFIJO} img:not([src$=".svg"]) { filter: brightness(0.92); }
${PREFIJO} ::placeholder { color: #8391a7; }
`;

let hoja = null;

function regenerarHoja() {
  if (typeof document === "undefined") return;
  if (!hoja) {
    hoja = document.createElement("style");
    hoja.id = "sigae-tema-oscuro";
  }
  const salida = [BASE];
  for (const h of Array.from(document.styleSheets)) {
    if (h.ownerNode === hoja) continue;
    try {
      convertirReglas(h.cssRules, salida);
    } catch {
      /* hoja de otro origen o aún cargando: se reintenta cuando termine */
    }
  }
  hoja.textContent = salida.join("\n");
  // Siempre al final, para ganarle a las reglas originales
  document.head.appendChild(hoja);
}

// ── Estilos en línea ────────────────────────────────────────────────────────
const originales = new WeakMap(); // elemento → { prop: [original, convertido] }
let observador = null;
let aplicando = false;

function convertirElemento(el) {
  if (!el.style || !el.getAttribute("style")) return;
  let registro = originales.get(el);
  for (const [prop, tipo] of PROPIEDADES) {
    const actual = el.style.getPropertyValue(prop);
    if (!actual) continue;
    const previo = registro && registro[prop];
    if (previo && previo[1] === actual) continue; // ya convertido por nosotros
    const nuevo = colorOscuro(actual, tipo);
    if (!nuevo) { if (previo) delete registro[prop]; continue; }
    if (!registro) { registro = {}; originales.set(el, registro); }
    registro[prop] = [actual, nuevo];
    el.style.setProperty(prop, nuevo, el.style.getPropertyPriority(prop));
  }
}

function convertirArbol(raiz) {
  if (raiz.nodeType !== 1) return;
  convertirElemento(raiz);
  raiz.querySelectorAll("[style]").forEach(convertirElemento);
}

function restaurarArbol() {
  document.querySelectorAll("[style]").forEach((el) => {
    const registro = originales.get(el);
    if (!registro) return;
    for (const [prop, [original, convertido]] of Object.entries(registro)) {
      if (el.style.getPropertyValue(prop) === convertido) el.style.setProperty(prop, original);
    }
    originales.delete(el);
  });
}

function activarObservador() {
  if (observador) return;
  observador = new MutationObserver((cambios) => {
    if (aplicando) return;
    aplicando = true;
    for (const c of cambios) {
      if (c.type === "attributes") convertirElemento(c.target);
      else c.addedNodes.forEach(convertirArbol);
    }
    aplicando = false;
  });
  observador.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["style"] });
  convertirArbol(document.body);
}

function desactivarObservador() {
  if (observador) { observador.disconnect(); observador = null; }
  restaurarArbol();
}

// ── Estado y preferencia ────────────────────────────────────────────────────
const sistemaOscuro = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches;

function leerPreferencia() {
  try {
    const v = window.localStorage.getItem(CLAVE);
    return v === "oscuro" || v === "claro" ? v : null;
  } catch {
    return null;
  }
}

let temaActual = "claro";
const suscriptores = new Set();

function aplicar(tema) {
  temaActual = tema;
  const raiz = document.documentElement;
  raiz.setAttribute(ATRIBUTO, tema);
  // tema-inicial.js pinta el fondo antes de que cargue la app; desde aquí manda la hoja oscura
  raiz.style.removeProperty("background-color");
  raiz.style.removeProperty("color-scheme");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOR_BARRA[tema]);
  if (tema === "oscuro") {
    regenerarHoja();
    activarObservador();
  } else {
    desactivarObservador();
  }
  suscriptores.forEach((fn) => fn());
}

export function cambiarTema(tema) {
  try { window.localStorage.setItem(CLAVE, tema); } catch { /* sin almacenamiento: dura hasta recargar */ }
  aplicar(tema);
}

export function alternarTema() {
  cambiarTema(temaActual === "oscuro" ? "claro" : "oscuro");
}

export function useTema() {
  return useSyncExternalStore(
    (fn) => { suscriptores.add(fn); return () => suscriptores.delete(fn); },
    () => temaActual,
    () => "claro",
  );
}

export function iniciarTema() {
  if (typeof window === "undefined") return;
  aplicar(leerPreferencia() || (sistemaOscuro() ? "oscuro" : "claro"));

  // Sin elección del usuario, sigue al sistema (por ejemplo, el modo nocturno del celular)
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", (e) => {
    if (!leerPreferencia()) aplicar(e.matches ? "oscuro" : "claro");
  });

  // Hojas que terminan de cargar después (o que agrega Vite en desarrollo)
  const alCambiarHojas = () => { if (temaActual === "oscuro") regenerarHoja(); };
  new MutationObserver((cambios) => {
    const nuevas = cambios.some((c) => [...c.addedNodes].some((n) => (n.tagName === "STYLE" && n !== hoja) || n.tagName === "LINK"));
    if (nuevas) alCambiarHojas();
  }).observe(document.head, { childList: true });
  document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => l.addEventListener("load", alCambiarHojas));
  window.addEventListener("load", alCambiarHojas);
}
