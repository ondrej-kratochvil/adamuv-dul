import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { TTS_DAY_CHARS, TTS_DEFAULT, TTS_DEVICE, TTS_MAX, TTS_VOICES, capNum, gameText, googleBody, ttsChoice, ttsKey, ttsQuery, ttsRate } from '../../src/logic/tts';
// @ts-expect-error skript bez typů
import { WORDS_FILE, collectWords } from '../../scripts/tts-slova.mjs';

describe('přirozený hlas (logic/tts.ts)', () => {
  it('server přijme jen hlas ze seznamu a rozumně dlouhý text', () => {
    expect(ttsQuery({ text: 'Ahoj Adame!', voice: TTS_DEFAULT })).toEqual({ text: 'Ahoj Adame!', voice: TTS_DEFAULT, rate: ttsRate(false) });
    expect(ttsQuery({ text: '  ma \n  me ', voice: TTS_DEFAULT, slow: true })).toEqual({ text: 'ma me', voice: TTS_DEFAULT, rate: ttsRate(true) });
    expect(ttsQuery({ text: 'x', voice: 'cs-CZ-Studio-X' })).toBeNull();
    expect(ttsQuery({ text: '', voice: TTS_DEFAULT })).toBeNull();
    expect(ttsQuery({ text: 'a'.repeat(TTS_MAX + 1), voice: TTS_DEFAULT })).toBeNull();
    expect(ttsQuery(null)).toBeNull();
  });
  it('volba v uloženém stavu: výchozí a neznámá = hlas tabletu (Ondřej 10. 11. 2026), vybraný hlas Googlu zůstane', () => {
    expect(ttsChoice(undefined)).toBe(TTS_DEVICE);
    expect(ttsChoice('')).toBe(TTS_DEVICE);
    expect(ttsChoice('cs-CZ-Neznamy')).toBe(TTS_DEVICE);
    expect(ttsChoice(TTS_DEFAULT)).toBe(TTS_DEFAULT);
    expect(ttsChoice(TTS_DEVICE)).toBe(TTS_DEVICE);
    expect(ttsChoice(TTS_VOICES[1].id)).toBe(TTS_VOICES[1].id);
  });
  it('pomalu je pomaleji a klíč mezipaměti rozliší rychlost i hlas', () => {
    expect(ttsRate(true)).toBeLessThan(ttsRate(false));
    const q = ttsQuery({ text: 'so', voice: TTS_DEFAULT })!;
    expect(ttsKey(q)).not.toBe(ttsKey({ ...q, rate: ttsRate(true) }));
    expect(ttsKey(q)).not.toBe(ttsKey({ ...q, voice: TTS_VOICES[1].id }));
  });
  it('požadavek na Google: čeština, MP3, rychlost jen když není 1', () => {
    const q = ttsQuery({ text: 'Máma', voice: TTS_DEFAULT })!;
    expect(googleBody(q)).toEqual({ input: { text: 'Máma' }, voice: { languageCode: 'cs-CZ', name: TTS_DEFAULT }, audioConfig: { audioEncoding: 'MP3', speakingRate: q.rate } });
    expect((googleBody({ ...q, rate: 1 }).audioConfig as Record<string, unknown>).speakingRate).toBeUndefined();
  });
  it('Google čte jen věty ze hry (Honza 9. 11. 2026), volný text čte tablet', () => {
    expect(gameText('Bez jediné chyby! Máš nový diamantový krumpáč!')).toBe(true);
    expect(gameText('Ahoj Adame! Tady je hra. ma, em, a')).toBe(true);
    expect(gameText('m­a')).toBe(true);
    expect(gameText('Získal jsi 125 smaragdů.')).toBe(true);
    expect(gameText('Objednejte si levné pojištění auta')).toBe(false);
    expect(gameText('Ahoj Kvido Zbyhněvo!')).toBe(false);
  });
  it('slovník textů hry je aktuální (po změně textů: node scripts/tts-slova.mjs)', () => {
    expect(JSON.parse(readFileSync(WORDS_FILE, 'utf8'))).toEqual(collectWords());
  });
  it('strop znaků: z proměnné na serveru, jinak výchozí', () => {
    expect(capNum('5000', TTS_DAY_CHARS)).toBe(5000);
    expect(capNum(undefined, TTS_DAY_CHARS)).toBe(TTS_DAY_CHARS);
    expect(capNum('nic', TTS_DAY_CHARS)).toBe(TTS_DAY_CHARS);
  });
});
