// Uložený postup: tvar dat, výchozí hodnoty a převod starších verzí.
// Pravidlo: každá změna tvaru = nové číslo SCHEMA a krok v migrate() + test v tests/unit/save.test.ts.
import type { Stats } from '../logic/mastery';
import type { Streak } from '../logic/streak';
import { syncDefaults, type SyncState } from '../logic/sync';
import type { Quest } from '../logic/daily';
import type { Player } from '../logic/player';
import { cloudDefaults, type Cloud } from '../logic/cloud';

export const SCHEMA = 11; // 1 = vše do verze hry 15 (bez čísla schématu), 2 = s číslem schématu a nejvyšším stavem vesnice,
                        // 3 = doba řešení a záměny u úloh, procvičování, fronta pro tabulku Google (verze hry 27),
                        // 4 = převlékání rodiny (verze hry 28), 5 = název a značka zařízení pro tabulku (verze hry 39),
                        // 6 = ranní karta a dnešní úkol (verze hry 51), 7 = stupně obtížnosti podle zvládnutí (verze hry 52),
                        // 8 = hráč (Schoolcraft: Adam vestavěný, ostatní z nastavení) a písmena zapnutá rodičem (verze hry 53)
                        // 9 = psací písmo v Psaní (verze hry 56), 10 = počet splněných dnešních úkolů pro zvířátka (verze hry 57),
                        // 11 = Schoolcraft online: přihlášení k serveru, dny splněných úkolů pro týdenní body (verze hry 59)

// pauses/pauseSecs: pauzy v kole (od verze 36); secs je doba bez pauz
export interface LogEntry { t: number; d: string; level: string; clean: number; done: number; len: number; ok: boolean; quit: boolean; secs: number; rate?: number; pauses?: number; pauseSecs?: number; lost?: number }
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
  gear: { held: string; stages: Record<string, number> } | null; // nástroje: co drží v ruce, nejvyšší materiál (content/tools.ts)
  daily: { d: string; quest: Quest | null; shown: boolean }; // dnešní úkol a jestli už byla ranní karta (logic/daily.ts)
  stages: Record<string, number>; // dosažené stupně obtížnosti v patrech (logic/stages.ts), nezavírají se
  cloud: Cloud;                 // přihlášení k serveru schoolcraft.games, fronta statistik (logic/cloud.ts)
  questLog: string[];           // dny splněných dnešních úkolů (týdenní body v žebříčku)
  questsDone: number;           // splněné dnešní úkoly; za každý se odemkne zvířátko (logic/pets.ts)
  cursive: boolean;             // psací písmo v patře Psaní (content/glyphs.ts CURSIVE)
  letters: string[];            // souhlásky (a Ě) zapnuté rodičem, v pořadí slabikáře (logic/letters.ts)
  player: 'adam' | Player | null; // kdo hraje: vestavěný Adam, hráč nastavený rodičem, nebo zatím nikdo (úvodní nastavení)
  [k: string]: unknown;
}

export function defaults(): SaveState {
  return {
    schema: SCHEMA,
    caseMode: 'both', slow: false, strict: 'normal', total: 0,
    rounds: { letters: 0, syllables: 0, words: 0, numbers: 0, math: 0, writing: 0, reading: 0, speech: 0 },
    stats: {}, log: [], ench: [], emeralds: 0, notes: [], dogName: '', gifts: {}, bday: 0, lastCheer: '',
    village: null, obsidian: null, netherMine: false, cards: null, weeks: null, babies: null, eyes: 0, dragon: 0,
    seenVersion: 0, gameName: 'Schoolcraft',
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
    gear: null,
    daily: { d: '', quest: null, shown: false },
    stages: {},
    player: null,
    letters: ['M', 'L', 'S'],
    cursive: false,
    questsDone: 0,
    cloud: cloudDefaults(),
    questLog: [],
  };
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const NESTED = ['rounds', 'outfit', 'dog', 'gifts', 'streak', 'build', 'pron', 'momSaid', 'sync', 'famWear', 'daily', 'stages', 'cloud'] as const;

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
  // v6 -> v7: stupně obtížnosti začínají prázdné (stages přes NESTED); hra je hned dopočítá ze zvládnutých úloh,
  //          dřívější odemykání podle počtu kol se nepřebírá (Ondřej 24. 10. 2026: postup podle toho, co Adam umí)
  // v7 -> v8: všechno do verze 52 hrál Adam (i testovací profily byly kopie jeho postupu)
  if (from < 8 && !s.player) { out.player = 'adam'; if (!s.gameName) out.gameName = 'Adamův důl'; }
  // Adam se od 24. 10. 2026 učí P (Ondřej); dřívější postup = samohlásky, M, L, S a nově P
  if (from < 8 && !Array.isArray(s.letters)) out.letters = ['M', 'L', 'S', 'P'];
  if (!Array.isArray(out.letters) || !out.letters.length) out.letters = ['M', 'L', 'S'];
  // v10 -> v11: online začíná nepřihlášené (cloud z výchozích hodnot přes NESTED), dny úkolů prázdné
  if (!Array.isArray(out.cloud.queue)) out.cloud.queue = [];
  if (!Array.isArray(out.questLog)) out.questLog = [];
  // v9 -> v10: zvířátka začínají zamčená (questsDone 0 z výchozích hodnot); dřívější splněné úkoly se nepočítají
  if (typeof out.questsDone !== 'number') out.questsDone = 0;
  // v8 -> v9 (až po určení hráče výše): psací písmo; Adam ho zapnuté má (Ondřej 24. 10. 2026: „Přidej psací písmo“), ostatní ho zapne rodič
  if (from < 9 && typeof s.cursive !== 'boolean') out.cursive = out.player === 'adam';
  // v5 -> v6: dnešní úkol začíná prázdný (daily z výchozích hodnot přes NESTED), první karta přijde při spuštění
  // v4 -> v5: sync dostane device a uid z výchozích hodnot (NESTED), hra je doplní při startu (initDevice)
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
