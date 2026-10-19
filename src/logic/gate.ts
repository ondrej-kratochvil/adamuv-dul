// Zámek nastavení pro rodiče: násobení dvoumístného čísla jednomístným (Ondřej, 19. 10. 2026).
// Násobit se Adam v 1. třídě neučí a uhodnout číslo 72 až 171 je skoro nemožné. Příklad je pokaždé jiný.
import { rnd, type Rng } from './random';

export interface Gate { a: number; b: number; answer: number; text: string }

export function makeGate(rng: Rng = Math.random): Gate {
  const a = rnd(12, 19, rng), b = rnd(6, 9, rng);
  return { a, b, answer: a * b, text: `${a} × ${b}` };
}

// odpověď z klávesnice: jen číslice (mezery a tečky se ignorují)
export const gateOk = (g: Gate, input: string): boolean => Number(input.replace(/[\s.]/g, '')) === g.answer && /\d/.test(input);
