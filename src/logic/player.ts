// Hráč (Ondřej 24. 10. 2026, Schoolcraft): kdo hraje, jak ho hra oslovuje, rodina a její hlášky.
// Adam je vestavěný hráč (content/player-adam.ts), ostatní si rodič nastaví v aplikaci nebo naimportuje soubor hráče.
// Soubor hráče je jen u rodiny (export a import jako postup), do repa nepatří.
import type { Lines } from '../content/family-lines';
import { PET_KINDS, type PetKind } from '../content/pets';

// podoba v pixelové hře (world/family.js famCanvas)
export interface Look { hair: string; top: string; long?: boolean; bob?: number; grey?: string; bald?: boolean; buzz?: boolean; beard?: boolean | string; glasses?: boolean; small?: boolean; kid?: boolean }
export interface Person extends Look {
  id: string; name: string; gen: string; f: boolean; // „máma Pája“, 2. pád „mámy Páji“, žena
  own?: boolean;    // říká jen své věty, ne společné („To je můj šikovný kluk!“)
  lines?: Lines;    // vlastní hlášky (bez nich jen společné)
  birthday?: string; nameday?: string; // MM-DD: hra připomene
  role?: 'mom';     // máma připomíná jídlo, školu a spaní
}
// zvířátko: čí je (id člena rodiny, nebo 'home' = doma u hráče), co je zač a jak vypadá (content/pets.ts)
export interface Pet { id: string; name: string; what: string; kind: PetKind; owner: string; color?: string; stripes?: boolean }
export interface Friend { id: string; name: string; gen: string; friend: true }
export interface MomSlot { id: string; from: string; to: string; text: string; weekday?: boolean; weekend?: boolean }
export interface Player {
  v: 1;
  name: string;      // Adam
  voc: string;       // oslovení: Adame
  poss: string;      // přivlastnění: Adamův (název hry „Adamův důl“)
  gender: 'm' | 'f'; // „Splnil jsi“ / „Splnila jsi“
  birthday?: string; // MM-DD
  nameday?: string;  // MM-DD
  family: Person[];
  friends: Friend[];
  pets?: Pet[];      // odemykají se za splněné dnešní úkoly (logic/pets.ts)
  mom?: { slots: MomSlot[]; open: { ok: string; fail: string }; playLimitMin: number; playText: string };
  earlyBird?: { who: string; until: string; ok: string; fail: string };
  fanLines?: { ok: string[]; fail: string[]; share: number }; // věty o youtuberech a postavách z videí
}

export const PLAYER_PREFIX = 'SCHOOLCRAFT-HRAC:';

// rod hráče: g(p, 'Splnil', 'Splnila')
export const g = (p: Pick<Player, 'gender'>, m: string, f: string): string => p.gender === 'f' ? f : m;

// výchozí tvary z křestního jména (rodič je může přepsat): Adam → Adame, Adamův; Ema → Emo, Emin
export function guessForms(name: string, gender: 'm' | 'f'): { voc: string; poss: string } {
  const n = name.trim(), low = n.toLocaleLowerCase('cs');
  if (!n) return { voc: '', poss: '' };
  const ends = (re: RegExp) => re.test(low);
  if (ends(/a$/)) return { voc: n.slice(0, -1) + 'o', poss: n.slice(0, -1) + (gender === 'f' ? 'in' : 'ův') }; // Ema → Emo, Emin; Víťa → Víťo, Víťův
  if (gender === 'f') return { voc: n, poss: n + 'in' };                       // Ester → Ester, Esterin
  if (ends(/[aeiouyáéíóúůý]$/)) return { voc: n, poss: n + 'ův' };                 // Leo, Jiří
  if (ends(/ek$/)) return { voc: n.slice(0, -2) + 'ku', poss: n.slice(0, -2) + 'kův' };  // Marek → Marku, Markův
  if (ends(/(k|g|h|ch)$/)) return { voc: n + 'u', poss: n + 'ův' };           // Vojtěch → Vojtěchu
  if (ends(/[šžčřcjx]$/)) return { voc: n + 'i', poss: n + 'ův' };             // Tomáš → Tomáši, Matěj → Matěji
  if (ends(/[^aeiouyáéíóúůý]r$/)) return { voc: n.slice(0, -1) + 'ře', poss: n + 'ův' }; // Petr → Petře
  return { voc: n + 'e', poss: n + 'ův' };                                     // Adam → Adame, Jakub → Jakube
}

// nový hráč: jen jméno a rod, bez rodiny (rodič ji doplní v nastavení)
export function blankPlayer(name = '', gender: 'm' | 'f' = 'm'): Player {
  const f = guessForms(name, gender);
  return { v: 1, name: name.trim(), voc: f.voc, poss: f.poss, gender, family: [], friends: [] };
}

const isObj = (x: unknown): x is Record<string, unknown> => !!x && typeof x === 'object' && !Array.isArray(x);
const str = (x: unknown, max = 200): string => typeof x === 'string' ? x.slice(0, max) : '';
const md = (x: unknown): string | undefined => typeof x === 'string' && /^\d\d-\d\d$/.test(x) ? x : undefined;
const strs = (x: unknown, max = 200): string[] => Array.isArray(x) ? x.filter(s => typeof s === 'string').map(s => s.slice(0, max)).slice(0, 60) : [];
const COLOR = /^#[0-9a-f]{6}$/i;

// převede cokoli na platného hráče (soubor od jiné rodiny, starší verze); null = nepoužitelné
export function normalizePlayer(raw: unknown): Player | null {
  if (!isObj(raw) || !str(raw.name).trim()) return null;
  const gender = raw.gender === 'f' ? 'f' : 'm';
  const forms = guessForms(str(raw.name, 30), gender);
  const lines = (l: unknown) => isObj(l) ? { cheers: strs(l.cheers), enc: strs(l.enc), hello: str(l.hello), ...(l.helloMorning ? { helloMorning: str(l.helloMorning) } : {}) } : undefined;
  const family: Person[] = (Array.isArray(raw.family) ? raw.family : []).filter(isObj).filter(p => str(p.id, 24) && str(p.name, 40)).slice(0, 30).map(p => ({
    id: str(p.id, 24), name: str(p.name, 40), gen: str(p.gen, 40) || str(p.name, 40), f: !!p.f,
    hair: COLOR.test(str(p.hair)) ? str(p.hair) : '#6b4a2a', top: COLOR.test(str(p.top)) ? str(p.top) : '#3f9b3a',
    ...(p.long ? { long: true } : {}), ...(typeof p.bob === 'number' ? { bob: Math.max(4, Math.min(10, p.bob)) } : {}),
    ...(COLOR.test(str(p.grey)) ? { grey: str(p.grey) } : {}), ...(p.bald ? { bald: true } : {}), ...(p.buzz ? { buzz: true } : {}),
    ...(p.beard ? { beard: typeof p.beard === 'string' && COLOR.test(p.beard) ? p.beard : true } : {}),
    ...(p.glasses ? { glasses: true } : {}), ...(p.small ? { small: true } : {}), ...(p.kid ? { kid: true } : {}),
    ...(p.own ? { own: true } : {}), ...(lines(p.lines) ? { lines: lines(p.lines) } : {}),
    ...(md(p.birthday) ? { birthday: md(p.birthday) } : {}), ...(md(p.nameday) ? { nameday: md(p.nameday) } : {}),
    ...(p.role === 'mom' ? { role: 'mom' as const } : {}),
  }));
  const friends: Friend[] = (Array.isArray(raw.friends) ? raw.friends : []).filter(isObj).filter(p => str(p.id, 24) && str(p.name, 40)).slice(0, 30)
    .map(p => ({ id: str(p.id, 24), name: str(p.name, 40), gen: str(p.gen, 40) || str(p.name, 40), friend: true as const }));
  const out: Player = { v: 1, name: str(raw.name, 30).trim(), voc: str(raw.voc, 30).trim() || forms.voc, poss: str(raw.poss, 30).trim() || forms.poss, gender, family, friends };
  const pets: Pet[] = (Array.isArray(raw.pets) ? raw.pets : []).filter(isObj).filter(p => str(p.id, 24) && str(p.name, 30) && PET_KINDS.includes(p.kind as PetKind)).slice(0, 30)
    .map(p => ({ id: str(p.id, 24), name: str(p.name, 30), what: str(p.what, 60), kind: p.kind as PetKind, owner: str(p.owner, 24) || 'home', ...(COLOR.test(str(p.color)) ? { color: str(p.color) } : {}), ...(p.stripes ? { stripes: true } : {}) }));
  if (pets.length) out.pets = pets;
  if (md(raw.birthday)) out.birthday = md(raw.birthday);
  if (md(raw.nameday)) out.nameday = md(raw.nameday);
  if (isObj(raw.mom) && Array.isArray(raw.mom.slots) && isObj(raw.mom.open)) {
    const m = raw.mom as Record<string, unknown>, o = m.open as Record<string, unknown>;
    out.mom = { slots: (m.slots as unknown[]).filter(isObj).map(s => ({ id: str(s.id, 20), from: str(s.from, 5), to: str(s.to, 5), text: str(s.text), ...(s.weekday ? { weekday: true } : {}), ...(s.weekend ? { weekend: true } : {}) })),
      open: { ok: str(o.ok), fail: str(o.fail) }, playLimitMin: typeof m.playLimitMin === 'number' ? m.playLimitMin : 30, playText: str(m.playText) };
  }
  if (isObj(raw.earlyBird)) { const e = raw.earlyBird; out.earlyBird = { who: str(e.who, 24), until: str(e.until, 5), ok: str(e.ok), fail: str(e.fail) }; }
  if (isObj(raw.fanLines)) { const y = raw.fanLines; out.fanLines = { ok: strs(y.ok), fail: strs(y.fail), share: typeof y.share === 'number' ? Math.max(0, Math.min(1, y.share)) : .25 }; }
  return out;
}

export const exportPlayer = (p: Player): string => PLAYER_PREFIX + JSON.stringify(p);
export function importPlayer(text: string): Player | null {
  const t = text.replace(/\s*[\r\n]+\s*/g, ' ').trim();
  try { return normalizePlayer(JSON.parse(t.startsWith(PLAYER_PREFIX) ? t.slice(PLAYER_PREFIX.length) : t)); } catch { return null; }
}

// vlastní narozeniny a svátky rodiny (Adamovy Vánoce řeší kalendář zvlášť)
export interface PersonalDay { id: string; who?: string; all?: boolean; gift?: number; text: string }
export function personalDayOn(p: Player, mmdd: string): PersonalDay | null {
  if (p.birthday === mmdd) return { id: 'narozeniny', all: true, gift: 20, text: `Všechno nejlepší k narozeninám, ${p.voc}!` };
  if (p.nameday === mmdd && mmdd !== '12-24') return { id: 'svatek', all: true, gift: 5, text: `Všechno nejlepší k svátku, ${p.voc}!` };
  for (const m of p.family) {
    if (m.birthday === mmdd) return { id: `${m.id}-narozeniny`, who: m.id, text: `Dnes má narozeniny ${m.name}! Popřej ${m.f ? 'jí' : 'mu'} všechno nejlepší.` };
    if (m.nameday === mmdd) return { id: `${m.id}-svatek`, who: m.id, text: `Dnes má svátek ${m.name}! Popřej ${m.f ? 'jí' : 'mu'}.` };
  }
  return null;
}
