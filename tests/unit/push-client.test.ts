// Ranní upozornění na zařízení (src/logic/push.ts): uložený stav, text, klíč serveru.
import { describe, expect, it } from 'vitest';
import { PUSH_HOURS, keyBytes, parsePushState, pushText } from '../../src/logic/push';
import { HOURS } from '../../worker/push';
import { DAILY_BONUS } from '../../src/logic/daily';

describe('ranní upozornění: zařízení', () => {
  it('stav: rozbitý nebo prázdný = vypnuto v 7:00', () => {
    expect(parsePushState(null)).toEqual({ on: false, hour: 7, endpoint: '' });
    expect(parsePushState('nesmysl')).toEqual({ on: false, hour: 7, endpoint: '' });
    expect(parsePushState('{"on":true,"hour":6,"endpoint":"https://fcm.googleapis.com/x"}')).toEqual({ on: true, hour: 6, endpoint: 'https://fcm.googleapis.com/x' });
    expect(parsePushState('{"on":"ano","hour":3}')).toEqual({ on: false, hour: 7, endpoint: '' });
  });
  it('hodiny ve hře a na serveru jsou stejné', () => { expect(PUSH_HOURS).toEqual(HOURS); });
  it('text osloví hráče a řekne odměnu za dnešní úkol', () => {
    expect(pushText('Adame')).toEqual({ title: 'Schoolcraft', body: `Dobré ráno, Adame! Čeká tě dnešní úkol za ${DAILY_BONUS} smaragdů.` });
  });
  it('veřejný klíč serveru z base64url na bajty', () => {
    expect([...keyBytes('AQID_w')]).toEqual([1, 2, 3, 255]);
  });
});
