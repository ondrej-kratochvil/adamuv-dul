// Kontext pro generátory úkolů: kola, statistiky a nedávné úkoly běžícího kola.
import { G } from '../core/state.js';
import { save } from '../save/save.ts';

export function ctx() { return { rounds: save.rounds, stats: save.stats, recent: G.R ? G.R.recent : [] }; }
