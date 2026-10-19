// Náhoda a výběry. Všechny funkce berou generátor náhody, aby šly v testech zopakovat.
export type Rng = () => number;

export const rnd = (a: number, b: number, rng: Rng = Math.random): number => a + Math.floor(rng() * (b - a + 1));

export function range(a: number, b: number, step = 1): number[] {
  const out: number[] = [];
  for (let i = a; i <= b; i += step) out.push(i);
  return out;
}

export function shuffle<T>(a: T[], rng: Rng = Math.random): T[] {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export const pick = <T>(rng: Rng, a: readonly T[]): T => a[Math.floor(rng() * a.length)];

export function weightedPick<T>(items: readonly T[], w: (x: T) => number, rng: Rng = Math.random): T {
  const ws = items.map(w);
  let t = rng() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { t -= ws[i]; if (t <= 0) return items[i]; }
  return items[items.length - 1];
}

// generátor se semínkem (mulberry32) pro testy a pro pixelové textury
export function seeded(seed: number): Rng {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
