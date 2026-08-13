// El logotipo de Relevo, en SVG puro: la R con el cursor que la releva.
// Es la marca del PROYECTO (aparece en el login y el favicon) — la marca del
// negocio del cliente vive en el panel, no aquí.

export const LOGO_SVG = `<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Relevo">
  <rect width="120" height="120" rx="28" fill="#131628"/>
  <rect x="10" y="10" width="100" height="100" rx="22" fill="none" stroke="#6F00FF" stroke-width="10"/>
  <text x="60" y="87" text-anchor="middle" font-family="Poppins,'Arial Black',Arial,sans-serif" font-weight="800" font-size="76" fill="#6F00FF">R</text>
  <line x1="45" y1="57" x2="73" y2="85" stroke="#FFFFFF" stroke-width="9" stroke-linecap="round"/>
  <path d="M85 97 L79.5 79.5 L61.5 91.5 Z" fill="#FFFFFF"/>
</svg>`;

// El mismo logo como favicon (data URI). Estable: los navegadores lo cachean.
export const FAVICON =
  "data:image/svg+xml," + encodeURIComponent(LOGO_SVG.replace(/\n\s*/g, ""));
