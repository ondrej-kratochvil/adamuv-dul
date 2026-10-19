// Matematika: čísla a příklady (logika v logic/tasks.ts)
import { ctx } from '../game/ctx.js';
import { genMath as genMathL, genNumbers as genNumbersL, pickChoices } from '../logic/tasks.ts';
import { range, rnd, weightedPick } from '../logic/random.ts';

function genNumbers() { return genNumbersL(ctx()); }
function genMath() { return genMathL(ctx()); }

export { genMath, genNumbers, pickChoices, range, rnd, weightedPick };
