// Kontext pro generátory úkolů: kola, statistiky a nedávné úkoly běžícího kola.
import { G } from '../core/state.js';
import { save } from '../save/save.ts';
import { STAGES, stageNews, stageOf } from '../logic/stages.ts';

export function ctx() { return { rounds: save.rounds, stats: save.stats, recent: G.R ? G.R.recent : [], pron: save.pron || {}, stages: save.stages }; }

// Stupně obtížnosti (logic/stages.ts): dosažený stupeň se zapíše, aby se nezavřel. Vrací, co se nově otevřelo
// ({ lv, news } s větou pro Adama). Při startu hry se volá jen kvůli zápisu, oznamuje se až po povedeném kole.
export function updateStages() {
  const out = [];
  for (const lv of Object.keys(STAGES)) {
    const from = save.stages[lv] || 0, to = stageOf(lv, save.stats, save.stages);
    if (to > from) { save.stages[lv] = to; const news = stageNews(lv, from, to); if (news) out.push({ lv, news }); }
  }
  return out;
}
