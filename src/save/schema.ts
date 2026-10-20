// Uložený postup: tvar dat, výchozí hodnoty a převod starších verzí.
// Pravidlo: každá změna tvaru = nové číslo SCHEMA a krok v migrate() + test v tests/unit/save.test.ts.
import type { Stats } from '../logic/mastery';
import type { Streak } from '../logic/streak';
import { syncDefaults, type SyncState } from '../logic/sync';

export const SCHEMA = 4; // 1 = vše do verze hry 15 (bez čísla schématu), 2 = s číslem schématu a nejvyšším stavem vesnice,
                        // 3 = doba řešení a záměny u úloh, procvičování, fronta pro tabulku Google (verze hry 27),
                        // 4 = převlékání rodiny (verze hry 28)

export interface LogEntry { t: number; d: string; level: string; clean: number; done: number; len: number; ok: boolean; quit: boolean; secs: number; rate?: number }
export interface Note { who: string; text: string; done: boolean; t?: number }

export interface SaveState {
  schema: number;
  caseMode: 'upper' | 'lower' | 'both'; slow: boolean; strict: 'mild' | 'normal' | 'strict';
  total: number; rounds: Record<string, number>; stats: Stats; log: LogEntry[];
  ench: string[]; emeralds: number; notes: Note[]; dogName: string; gifts: Record<string, number>; bday: number; lastCheer: string;
  village: Record<string, number> | null; obsidian: number | null; netherMine: boolean; cards: string[] | null;
  weeks: Record<string, number> | null; babies: string[] | null; eyes: number; dragon: number;
  seenVersion: number; gameName: string;
  dog: { collar: string; owned: string[]; coat: string };
  decor: string[]; streak: Streak;
  outfit: Record<string, string>;
  build: { blocks: Record<string, number>; placed: Record<string, string> };
  pron: Record<string, string>; // výslovnost vybraná rodičem (logic/pronounce.ts)
  recentLines: string[];        // posledních pár hlášek rodiny (aby se neopakovaly)
  momSaid: { d: string; ids: string[] }; // které připomínky mámy dnes zazněly
  practice: number;             // odehraná kola procvičování (logic/practice.ts)
  sync: SyncState;              // odesílání do tabulky Google (logic/sync.ts)
  famWear: Record<string, Record<string, string>>; // co má kdo z rodiny na sobě (logic/family-wear.ts)
  famOwned: string[];           // koupené kousky na převlékání
  [k: string]: unknown;
}

export function defaults(): SaveState {
  return {
    schema: SCHEMA,
    caseMode: 'both', slow: false, strict: 'normal', total: 0,
    rounds: { letters: 0, syllables: 0, words: 0, numbers: 0, math: 0, writing: 0, reading: 0 },
    stats: {}, log: [], ench: [], emeralds: 0, notes: [], dogName: '', gifts: {}, bday: 0, lastCheer: '',
    village: null, obsidian: null, netherMine: false, cards: null, weeks: null, babies: null, eyes: 0, dragon: 0,
    seenVersion: 0, gameName: 'Adamův důl',
    dog: { collar: 'cerveny', owned: ['cerveny'], coat: 'bily' }, decor: [],
    streak: { count: 0, best: 0, last: '', totem: 0, days: [] },
    outfit: { shirt: 'oranzove', pants: 'modre', shoes: 'sede', hat: 'nic', enchant: 'ne' },
    build: { blocks: {}, placed: {} },
    pron: {},
    recentLines: [],
    momSaid: { d: '', ids: [] },
    practice: 0,
    sync: syncDefaults(),
    famWear: {},
    famOwned: [],
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const NESTED = ['rounds', 'outfit', 'dog', 'gifts', 'streak', 'build', 'pron', 'momSaid', 'sync', 'famWear'] as const;

// převede jakákoli starší data na aktuální tvar; nic, co Adam získal, nezahodí
export function migrate(raw: unknown): SaveState {
  const d = defaults();
  if (!isObj(raw)) return d;
  const s: Record<string, unknown> = { ...raw };
  const from = typeof s.schema === 'number' ? s.schema : 1;
  // v1 -> v2: číslo schématu; vesnice si pamatuje nejvyšší dosažené fáze (už ji existující data mají)
  const out = Object.assign(d, s) as SaveState;
  for (const k of NESTED) out[k] = Object.assign(defaults()[k] as object, isObj(s[k]) ? s[k] : {}) as never;
  // v2 -> v3: nová pole (practice, sync) doplní výchozí hodnoty, statistiky úloh se jen rozšiřují (doba, záměny)
  if (!Array.isArray(out.streak.days)) out.streak.days = [];
  if (!Array.isArray(out.sync.queue)) out.sync.queue = [];
  if (typeof out.practice !== 'number') out.practice = 0;
  // v3 -> v4: převlékání rodiny začíná prázdné
  if (!Array.isArray(out.famOwned)) out.famOwned = [];
  for (const k of ['log', 'ench', 'notes', 'decor', 'recentLines', 'famOwned'] as const) if (!Array.isArray(out[k])) (out as Record<string, unknown>)[k] = [];
  if (!isObj(out.stats)) out.stats = {};
  if (from > SCHEMA) out.schema = from; // novější data ze starší hry nesnižovat
  else out.schema = SCHEMA;
  return out;
}

/* ---------- přenos postupu na jiné zařízení ---------- */
const PREFIX = 'ADAMUV-DUL-POSTUP:';
export const exportText = (s: SaveState): string => PREFIX + JSON.stringify(s);
// vrátí převedený stav, nebo null, když text není postup z této hry
export function importText(text: string): SaveState | null {
  // e-mail dlouhý řádek zalomí (i uprostřed textu, třeba „Adamův důl“); konce řádků v JSON nejsou potřeba, nahradí je mezera
  const t = text.replace(/\s*[\r\n]+\s*/g, ' ').trim();
  const json = t.startsWith(PREFIX) ? t.slice(PREFIX.length) : t;
  try {
    const raw = JSON.parse(json);
    if (!isObj(raw) || typeof raw.total !== 'number' || !isObj(raw.rounds)) return null;
    return migrate(raw);
  } catch { return null; }
}
