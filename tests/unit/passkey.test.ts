// Otisk prstu pro vstup do nastavení (src/logic/passkey.ts)
import { describe, expect, it } from 'vitest';
import { addPass, assertionOk, b64u, createOptions, fromB64u, getOptions, parsePassState } from '../../src/logic/passkey';

const cd = (o: object) => new TextEncoder().encode(JSON.stringify(o)).buffer as ArrayBuffer;
const auth = (flags: number) => { const a = new Uint8Array(37); a[32] = flags; return a.buffer; };

describe('otisk prstu', () => {
  it('stav: rozbitý = nic nenastaveno, jen platná id, nejvýš 5', () => {
    expect(parsePassState(null)).toEqual({ local: [], phone: [] });
    expect(parsePassState('{"local":["abcdefgh12", 5, "x"],"phone":"nic"}')).toEqual({ local: ['abcdefgh12'], phone: [] });
    let s = parsePassState(null); for (let i = 0; i < 7; i++) s = addPass(s, 'phone', 'klic000' + i);
    expect(s.phone).toHaveLength(5); expect(s.phone[0]).toBe('klic0006');
  });
  it('ověření projde jen s naší výzvou, správným typem a příznakem „uživatel ověřen“', () => {
    const ch = new Uint8Array([1, 2, 3, 4, 250]);
    expect(assertionOk(cd({ type: 'webauthn.get', challenge: b64u(ch) }), auth(0x05), ch)).toBe(true);
    expect(assertionOk(cd({ type: 'webauthn.get', challenge: b64u(ch) }), auth(0x01), ch)).toBe(false); // jen přítomnost, bez otisku
    expect(assertionOk(cd({ type: 'webauthn.get', challenge: 'jina' }), auth(0x05), ch)).toBe(false);
    expect(assertionOk(cd({ type: 'webauthn.create', challenge: b64u(ch) }), auth(0x05), ch)).toBe(false);
    expect(assertionOk(new ArrayBuffer(3), auth(0x05), ch)).toBe(false);
  });
  it('na zařízení = vestavěný autentizátor, telefon = QR kód (hybrid); vždy s ověřením uživatele', () => {
    const z = new Uint8Array(new ArrayBuffer(16));
    expect(createOptions('local', 'schoolcraft.games', z, z).authenticatorSelection).toMatchObject({ authenticatorAttachment: 'platform', userVerification: 'required' });
    const p = createOptions('phone', 'schoolcraft.games', z, z);
    expect(p.authenticatorSelection.authenticatorAttachment).toBe('cross-platform'); expect(p.hints).toEqual(['hybrid']);
    const g = getOptions('phone', 'schoolcraft.games', z, ['AQID']);
    expect(g.userVerification).toBe('required'); expect(g.allowCredentials[0].transports).toEqual(['hybrid']);
    expect([...g.allowCredentials[0].id]).toEqual([1, 2, 3]);
    expect([...fromB64u(b64u(new Uint8Array([9, 255, 0])))]).toEqual([9, 255, 0]);
  });
});
