// Procvičování: kolo z úloh, které Adamovi nejdou (výběr v logic/practice.ts). Odměny jako za běžné kolo.
import { G } from '../core/state.js';
import { save } from '../save/save.ts';
import { ctx } from '../game/ctx.js';
import * as T from '../logic/tasks.ts';
import { PRACTICE_MIN, pickPractice, weakItems } from '../logic/practice.ts';
import { partLabel } from '../content/pictures.ts';
import { display } from './reading.js';

function practiceReady() { return weakItems(save.stats).length >= PRACTICE_MIN; }
function genPractice() {
  // seznam slabých úloh platí celé kolo (správná odpověď úlohu ze seznamu hned nevyřadí)
  if (!G.R.weak) G.R.weak = weakItems(save.stats);
  const w = pickPractice(G.R.weak, G.R.recent) || { level: 'letters', item: 'A' };
  G.R.recent.push(w.level + ':' + w.item);
  const t = T.genPracticeTask(w.level, w.item, ctx());
  return w.level === 'reading' ? { ...t, task: partLabel(t.answer, display(t.answer)) } : t;
}
const PRACTICE = { name: 'Procvičování', tex: 'bookshelf', gen: genPractice, len: 8, intro: 'Procvičování. Dám ti úkoly, které ti ještě nejdou. Dobře poslouchej a kopej do správné kostky.' };

export { PRACTICE, genPractice, practiceReady };
