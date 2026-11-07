import { describe, expect, it } from 'vitest';
import { TTS_DEFAULT, TTS_DEVICE, TTS_MAX, TTS_VOICES, googleBody, ttsChoice, ttsKey, ttsQuery, ttsRate } from '../../src/logic/tts';

describe('přirozený hlas (logic/tts.ts)', () => {
  it('server přijme jen hlas ze seznamu a rozumně dlouhý text', () => {
    expect(ttsQuery({ text: 'Ahoj Adame!', voice: TTS_DEFAULT })).toEqual({ text: 'Ahoj Adame!', voice: TTS_DEFAULT, rate: ttsRate(false) });
    expect(ttsQuery({ text: '  ma \n  me ', voice: TTS_DEFAULT, slow: true })).toEqual({ text: 'ma me', voice: TTS_DEFAULT, rate: ttsRate(true) });
    expect(ttsQuery({ text: 'x', voice: 'cs-CZ-Studio-X' })).toBeNull();
    expect(ttsQuery({ text: '', voice: TTS_DEFAULT })).toBeNull();
    expect(ttsQuery({ text: 'a'.repeat(TTS_MAX + 1), voice: TTS_DEFAULT })).toBeNull();
    expect(ttsQuery(null)).toBeNull();
  });
  it('volba v uloženém stavu: neznámá = výchozí hlas, hlas tabletu zůstane', () => {
    expect(ttsChoice(undefined)).toBe(TTS_DEFAULT);
    expect(ttsChoice('')).toBe(TTS_DEFAULT);
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
});
