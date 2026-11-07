// Přirozený hlas Google Cloud Text-to-Speech (podnět Honzy 7. 11. 2026, stejně jako v jeho aplikaci ping).
// Hra posílá text na schoolcraft.games/api/tts (worker/index.ts), server se zeptá Googlu a výsledek si uloží do mezipaměti.
// Bez internetu nebo bez klíče na serveru čte dál hlas tabletu (audio/speech.js).

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
export const TTS_DEFAULT = 'cs-CZ-Chirp3-HD-Kore';
export const TTS_DEVICE = 'device';   // volba „hlas tabletu“ (bez internetu, bez serveru)
export const TTS_MAX = 300;           // znaků v jedné promluvě (nejdelší hlášky hry mají kolem 200)

export const validVoice = (v: unknown): v is string => typeof v === 'string' && TTS_VOICES.some(x => x.id === v);
// volba v uloženém stavu: hlas Googlu, nebo hlas tabletu; cokoli neznámého = výchozí hlas Googlu
export const ttsChoice = (v: unknown): string => v === TTS_DEVICE ? TTS_DEVICE : validVoice(v) ? v : TTS_DEFAULT;
// rychlost: přirozený hlas mluví rychleji než hlas tabletu, pro prvňáka trochu zpomalit (pomalu = nastavení rodiče)
export const ttsRate = (slow: boolean): number => slow ? 0.75 : 0.92;

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
