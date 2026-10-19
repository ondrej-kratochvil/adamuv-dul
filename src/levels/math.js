// Matematika
import { G } from '../core/state.js';
import { save } from '../save/save.js';
import { choiceCount, shuffle, weight } from './reading.js';

const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const range = (a, b, step = 1) => { const out = []; for (let i = a; i <= b; i += step) out.push(i); return out; };
function weightedPick(items, w) {
  const ws = items.map(w); let t = Math.random() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < items.length; i++) { t -= ws[i]; if (t <= 0) return items[i]; }
  return items[items.length - 1];
}
// správná odpověď + podobné (o jedna vedle, prohozené číslice…) + doplnit náhodnými
function pickChoices(ans, near, pool, k) {
  const out = [ans];
  for (const x of shuffle(near.filter(x => pool.includes(x) && x !== ans))) { if (out.length >= k) break; if (!out.includes(x) && Math.random() < .8) out.push(x); }
  for (const x of shuffle(pool.slice())) { if (out.length >= k) break; if (!out.includes(x)) out.push(x); }
  return shuffle(out);
}
// čísla: do 10, po 3 povedených kolech do 20, po 7 do 100
function genNumbers() {
  const r = save.rounds.numbers, max = r < 3 ? 10 : r < 7 ? 20 : 100;
  const pool = range(0, max);
  const avoid = G.R.recent.slice(-3);
  const n = weightedPick(pool.filter(x => !avoid.includes('n' + x)), x => weight('numbers', String(x)));
  const rev = n > 9 ? Number(String(n).split('').reverse().join('')) : -1;
  const near = [n - 1, n + 1, n - 10, n + 10, rev, n === 6 ? 9 : n === 9 ? 6 : -1];
  return { answer: String(n), choices: pickChoices(n, near, pool, choiceCount('numbers')).map(String), say: String(n), stat: 'numbers:' + n, key: 'n' + n };
}
// příklady: do 10, po 3 povedených kolech do 20, po 7 i celé desítky do 100
function genMath() {
  const r = save.rounds.math;
  let a, b, op, key, tens = false, tries = 0;
  do {
    op = Math.random() < .5 ? '+' : '-';
    tens = r >= 7 && Math.random() < .4;
    const max = r < 3 ? 10 : 20;
    if (tens) { if (op === '+') { a = rnd(1, 9) * 10; b = rnd(1, 10 - a / 10) * 10; } else { a = rnd(2, 10) * 10; b = rnd(1, a / 10 - 1) * 10; } }
    else if (op === '+') { a = rnd(0, max - 1); b = rnd(0, max - a); }
    else { a = rnd(1, max); b = rnd(0, a); }
    key = a + op + b;
  } while ((G.R.recent.includes(key) || ((a === 0 || b === 0) && Math.random() < .8)) && ++tries < 40);
  const ans = op === '+' ? a + b : a - b;
  const step = tens ? 10 : 1;
  const pool = tens ? range(0, 100, 10) : range(0, r < 3 ? 10 : 20);
  const near = [ans + step, ans - step, ans + 2 * step, ans - 2 * step, op === '+' ? a - b : a + b];
  return { answer: String(ans), choices: pickChoices(ans, near, pool, choiceCount('math')).map(String), say: `Kolik je ${a} ${op === '+' ? 'plus' : 'mínus'} ${b}?`, task: `${a} ${op === '+' ? '+' : '−'} ${b} = ?`, stat: 'math:' + key, key };
}

export { genMath, genNumbers, pickChoices, range, rnd, weightedPick };
