// Úkoly patra Mluvení: sluch (hodnotí hra), vyslovování (hodnotí rodič), cvik a foukání (nehodnotí se).
import { PAIRS, SOUNDS, SPEECH_WORDS, EXERCISES, type SpeechWord } from '../content/speech';
import { weight, type Stats } from './mastery';
import { shuffle, weightedPick, type Rng } from './random';

export type SpeechKind = 'hear' | 'say' | 'gym' | 'blow';
// složení kola: 5× sluch, 2× vyslovit s rodičem, 1× cvik nebo foukání (střídá se podle kol)
export function roundPlan(roundsPlayed: number): SpeechKind[] {
  return ['hear', 'hear', 'say', 'hear', roundsPlayed % 2 ? 'blow' : 'gym', 'hear', 'say', 'hear'];
}
// které dvojice hlásek se cvičí: stupeň 0 = R a L, každý další stupeň přidá jednu dvojici (logic/stages.ts, podle zvládnutí)
export const pairsFor = (stage: number): [string, string][] => PAIRS.slice(0, Math.max(0, stage) + 1);

const lower = (s: string) => s.toLocaleLowerCase('cs');
// slovo patří k dvojici, když obsahuje svou hlásku a neobsahuje tu druhou
export const fitsPair = (w: SpeechWord, pair: [string, string]): boolean =>
  pair.includes(w.s) && !lower(w.w).includes(lower(pair.find(x => x !== w.s)!));

export interface HearTask { answer: string; choices: string[]; say: string; stat: string; key: string; after: string }
export function genHear(stage: number, stats: Stats, recent: string[], rng: Rng = Math.random): HearTask {
  const pairs = pairsFor(stage);
  const cands = SPEECH_WORDS.filter(w => pairs.some(p => fitsPair(w, p)) && !recent.slice(-3).includes(w.w));
  const w = weightedPick(cands, x => weight(stats, 'speech', x.w), rng);
  const pair = pairs.find(p => fitsPair(w, p))!;
  return { answer: w.s, choices: shuffle([...pair], rng), say: w.w, stat: 'speech:' + w.w, key: w.w, after: `Ano, ve slově ${w.w} je ${SOUNDS[w.s].hint}.` };
}
export function genSay(stage: number, recent: string[], rng: Rng = Math.random): SpeechWord {
  const pairs = pairsFor(stage), sounds = new Set(pairs.flat());
  const cands = SPEECH_WORDS.filter(w => sounds.has(w.s) && !recent.includes(w.w));
  return cands[Math.floor(rng() * cands.length)];
}
export const genGym = (rng: Rng = Math.random) => EXERCISES[Math.floor(rng() * EXERCISES.length)];

// foukání: průměrná hlasitost z mikrofonu (0 až 1) a kolik času nad prahem je potřeba
export const BLOW_LEVEL = 0.12, BLOW_NEED_MS = 2000;
export function rms(samples: ArrayLike<number>): number {
  let s = 0; for (let i = 0; i < samples.length; i++) s += samples[i] * samples[i];
  return Math.sqrt(s / Math.max(1, samples.length));
}
// slova, ze kterých se počítá zvládnutí (jen sluch, ten je spravedlivý)
export const SPEECH_ITEMS = (): string[] => SPEECH_WORDS.map(w => w.w);
