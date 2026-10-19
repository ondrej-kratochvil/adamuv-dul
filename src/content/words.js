// Slova
import { G } from '../core/state.js';
import { save } from '../save/save.js';
import { weightedPick } from '../levels/math.js';
import { choiceCount, inCzech, shuffle, weight } from '../levels/reading.js';

// jen z písmen, která Adam zná (samohlásky, M, L, S)
const WORDS = ['MÁMA', 'EMA', 'ELA', 'EMIL', 'LEO', 'OSA', 'OSY', 'OSEL', 'LES', 'LOS', 'ÚL', 'ÚLY', 'MASO', 'MÍSA', 'MÍSY', 'SÍLA', 'SŮL', 'SUM', 'SUMA', 'LAMA', 'LAMY', 'MALÝ', 'MALÁ', 'MALÉ', 'SÁM', 'SAMA', 'SLÁMA', 'ALE', 'MÁ', 'MÉ', 'MÍLE', 'OSLÍ'];
const NAMES = ['EMA', 'ELA', 'EMIL', 'LEO'];
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
// slova do 3 písmen, po 3 povedených kolech do 4, po 6 všechna; na výběr nejpodobnější slova (LES a LOS, MALÝ a MALÁ)
function genWords() {
  const r = save.rounds.words, maxLen = r < 3 ? 3 : r < 6 ? 4 : 9;
  const avoid = G.R.recent.slice(-4);
  const w = weightedPick(WORDS.filter(x => x.length <= maxLen && !avoid.includes(x)), x => weight('words', x));
  const others = WORDS.filter(x => x !== w).map(x => [x, lev(w, x) + Math.random() * 1.5]).sort((a, b) => a[1] - b[1]).slice(0, choiceCount('words') - 1).map(x => x[0]);
  return { answer: w, choices: shuffle([w, ...others]), say: inCzech('Slovo', w), stat: 'words:' + w, key: w };
}

export { NAMES, WORDS, genWords, lev };
