// Základ: výběr prvků a omezený pohyb
const $ = s => document.querySelector(s);
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

export { $, REDUCED };
