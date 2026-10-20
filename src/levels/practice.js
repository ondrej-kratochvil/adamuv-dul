// Procvičování: kolo z úloh, které Adamovi nejdou (výběr v logic/practice.ts). Odměny jako za běžné kolo.
import { G } from '../core/state.js';
import { save } from '../save/save.ts';
import { ctx } from '../game/ctx.js';
import * as T from '../logic/tasks.ts';
import { PRACTICE_MIN, PRACTICE_REPEAT_MAX, pickPractice, practicePool, weakItems } from '../logic/practice.ts';
import { partLabel } from '../content/pictures.ts';
import { display } from './reading.js';

function practiceReady() { return weakItems(save.stats).length >= PRACTICE_MIN; }
function genPractice() {
  // seznam slabých úloh platí celé kolo (správná odpověď úlohu ze seznamu hned nevyřadí)
  if (!G.R.weak) G.R.weak = practicePool(save.stats);
  if (!G.R.picked) G.R.picked = [];
  // když už se všechno zopakovalo dvakrát: běžný úkol z patra, kde Adam má slabé úlohy
  const w = pickPractice(G.R.weak, G.R.picked) || { level: G.R.weak[Math.floor(Math.random() * G.R.weak.length)].level, item: '' };
  let t = T.genPracticeTask(w.level, w.item, ctx());
  // doplňková běžná úloha nesmí být ta, která už v kole byla dvakrát (generátor slabé úlohy upřednostňuje)
  for (let i = 0; !w.item && i < 12 && G.R.picked.filter(k => k === t.stat).length >= PRACTICE_REPEAT_MAX; i++) t = T.genPracticeTask(w.level, '', ctx());
  G.R.picked.push(t.stat);
  return w.level === 'reading' ? { ...t, task: partLabel(t.answer, display(t.answer)) } : t;
}
const PRACTICE = { name: 'Procvičování', tex: 'bookshelf', gen: genPractice, len: 8, intro: 'Procvičování. Dám ti úkoly, které ti ještě nejdou. Dobře poslouchej a kopej do správné kostky.' };

export { PRACTICE, genPractice, practiceReady };
