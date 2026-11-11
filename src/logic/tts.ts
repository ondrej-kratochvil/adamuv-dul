// Přirozený hlas Google Cloud Text-to-Speech (podnět Honzy 7. 11. 2026, stejně jako v jeho aplikaci ping).
// Hra posílá text na schoolcraft.games/api/tts (worker/index.ts), server se zeptá Googlu a výsledek si uloží do mezipaměti.
// Bez internetu nebo bez klíče na serveru čte dál hlas tabletu (audio/speech.js).
// Pojistky proti útratě (Honza 9. 11. 2026): jen věty ze hry (gameText), sdílená mezipaměť v D1, denní a měsíční strop znaků, limit na IP.
import GAME_WORDS from './tts-words.json';

export interface TtsVoice { id: string; label: string }
// jen tyhle hlasy (ochrana proti drahým hlasům a cizímu použití); rodič vybírá v nastavení, karta Hlas
export const TTS_VOICES: TtsVoice[] = [
  { id: 'cs-CZ-Chirp3-HD-Kore', label: 'Kore (žena)' },
  { id: 'cs-CZ-Chirp3-HD-Aoede', label: 'Aoede (žena)' },
  { id: 'cs-CZ-Chirp3-HD-Leda', label: 'Leda (žena)' },
  { id: 'cs-CZ-Chirp3-HD-Zephyr', label: 'Zephyr (žena)' },
  { id: 'cs-CZ-Chirp3-HD-Puck', label: 'Puck (muž)' },
  { id: 'cs-CZ-Chirp3-HD-Charon', label: 'Charon (muž)' },
  { id: 'cs-CZ-Wavenet-B', label: 'Wavenet (žena, starší)' },
];
export const TTS_DEFAULT = 'cs-CZ-Chirp3-HD-Kore'; // první hlas Googlu v nabídce (výchozí je hlas tabletu, ttsChoice)
export const TTS_DEVICE = 'device';   // volba „hlas tabletu“ (bez internetu, bez serveru)
export const TTS_MAX = 300;           // znaků v jedné promluvě (nejdelší hlášky hry mají kolem 200)

export const validVoice = (v: unknown): v is string => typeof v === 'string' && TTS_VOICES.some(x => x.id === v);
// volba v uloženém stavu: hlas Googlu, jen když ho rodič vybral; jinak hlas tabletu (Ondřej 10. 11. 2026: na Androidu
// se s hlasem Googlu slovo nebo slabika občas nepřečetla ani po opakovaném klepnutí na reproduktor)
export const ttsChoice = (v: unknown): string => validVoice(v) ? v : TTS_DEVICE;
// rychlost: přirozený hlas mluví rychleji než hlas tabletu, pro prvňáka trochu zpomalit (pomalu = nastavení rodiče)
export const ttsRate = (slow: boolean): number => slow ? 0.75 : 0.92;

// věta ze hry: každé slovo delší než 3 písmena je ve slovníku textů hry (scripts/tts-slova.mjs), čísla smí;
// jiný volný text (cizí použití serveru) čte hlas tabletu
const WORDS = new Set<string>(GAME_WORDS as string[]);
// Jedno slovo mimo slovník (nejvýš NAME_MAX písmen) projde: jméno dítěte v pozdravu a pochvale („Výborně, Terko!“), ať hra
// mluví jedním hlasem (Ondřej 11. 11. 2026: věty se jménem četl tablet, hlasy se střídaly a ukázka v nastavení zněla pořád stejně).
export const NAME_MAX = 15;
export function gameText(text: string): boolean {
  const unknown = (text.toLocaleLowerCase('cs').match(/\p{L}+/gu) || []).filter(w => w.length > 3 && !WORDS.has(w));
  return unknown.length === 0 || (unknown.length === 1 && unknown[0].length <= NAME_MAX);
}

// Krátké hlásky (písmeno, slabika) čte Wavenet: hlasy Chirp 3 HD u nich často vrátí ticho (měřeno 11. 11. 2026: „o“, „ma“,
// „Pe.“ skoro bez zvuku, u stejné slabiky pokaždé jinak; Wavenet přečetl všechny). Ondřej 11. 11. 2026: hlásky Wavenetem.
export const SHORT_VOICE = 'cs-CZ-Wavenet-B';
export const isShortSay = (text: string): boolean => /^\p{L}{1,3}[.!?…]?$/u.test(text.trim());
export const voiceFor = (text: string, voice: string): string => voice.startsWith('cs-CZ-Chirp3') && isShortSay(text) ? SHORT_VOICE : voice;
// ticho: střední hlasitost pod SILENT_RMS (vzorek každého 16. bodu), pak hlásku řekne tablet
export const SILENT_RMS = 0.01;
export function isSilent(samples: ArrayLike<number>): boolean {
  let s = 0, n = 0;
  for (let i = 0; i < samples.length; i += 16) { s += samples[i] * samples[i]; n++; }
  return n > 0 && Math.sqrt(s / n) < SILENT_RMS;
}

// strop znaků poslaných Googlu (worker/index.ts, proměnné TTS_DAY_CHARS a TTS_MONTH_CHARS ve wrangler.jsonc); po něm hlas tabletu
export const TTS_DAY_CHARS = 100000;
export const TTS_MONTH_CHARS = 1000000;
export const capNum = (v: unknown, def: number): number => { const n = Number(v); return Number.isFinite(n) && n >= 0 ? Math.floor(n) : def; };

export interface TtsQuery { text: string; voice: string; rate: number }
// kontrola požadavku na serveru: text 1 až TTS_MAX znaků, hlas ze seznamu, rychlost jen normálně nebo pomalu
export function ttsQuery(b: unknown): TtsQuery | null {
  if (!b || typeof b !== 'object') return null;
  const o = b as Record<string, unknown>;
  const text = typeof o.text === 'string' ? o.text.replace(/\s+/g, ' ').trim() : '';
  if (!text || text.length > TTS_MAX || !validVoice(o.voice)) return null;
  return { text, voice: o.voice, rate: ttsRate(o.slow === true) };
}
// tělo požadavku na Google (v1 text:synthesize); bez rychlosti, když ji hlas odmítne (rate = 1)
export function googleBody(q: TtsQuery): Record<string, unknown> {
  const audioConfig: Record<string, unknown> = { audioEncoding: 'MP3' };
  if (q.rate !== 1) audioConfig.speakingRate = q.rate;
  return { input: { text: q.text }, voice: { languageCode: 'cs-CZ', name: q.voice }, audioConfig };
}
// klíč mezipaměti (v prohlížeči i na serveru): hlas, rychlost a text
export const ttsKey = (q: TtsQuery): string => `${q.voice}|${q.rate}|${q.text}`;
