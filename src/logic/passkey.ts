// Otisk prstu (nebo obličej, PIN zařízení) místo příkladu pro vstup do nastavení (Ondřej 31. 10. 2026), standard WebAuthn.
// Dva způsoby: přímo na tomhle zařízení (zámek obrazovky tabletu) a telefonem rodiče přes QR kód (Adam ho neobejde,
// i když zná PIN tabletu). Ověřuje se jen v zařízení: výzva, typ a příznak „uživatel ověřen“. Příklad zůstává záložní.
export const PASSKEY_KEY = 'schoolcraft-otisk'; // localStorage: patří zařízení
export type PassKind = 'local' | 'phone';
export interface PassState { local: string[]; phone: string[] } // id přihlašovacích klíčů (base64url)
export function parsePassState(raw: string | null): PassState {
  let j: Partial<PassState> = {};
  try { j = JSON.parse(raw || '{}') || {}; } catch { j = {}; }
  const ids = (x: unknown) => Array.isArray(x) ? x.filter(v => typeof v === 'string' && /^[A-Za-z0-9_-]{8,}$/.test(v)).slice(0, 5) : [];
  return { local: ids(j.local), phone: ids(j.phone) };
}
export const addPass = (s: PassState, kind: PassKind, id: string): PassState => ({ ...s, [kind]: [id, ...s[kind].filter(x => x !== id)].slice(0, 5) });

export const b64u = (b: ArrayBuffer | Uint8Array): string => { let s = ''; for (const x of new Uint8Array(b)) s += String.fromCharCode(x); return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); };
export function fromB64u(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
// odpověď autentizátoru: clientDataJSON s naší výzvou a správným typem, v authenticatorData příznak UV (bit 2 v bajtu 32)
export function assertionOk(clientDataJSON: ArrayBuffer, authenticatorData: ArrayBuffer, challenge: Uint8Array, type: 'webauthn.get' | 'webauthn.create' = 'webauthn.get'): boolean {
  try {
    const c = JSON.parse(new TextDecoder().decode(clientDataJSON));
    const flags = new Uint8Array(authenticatorData)[32];
    return c.type === type && c.challenge === b64u(challenge) && (flags & 0x04) !== 0;
  } catch { return false; }
}
// volby pro navigator.credentials.create: local = autentizátor zařízení, phone = telefon přes QR (hybrid)
export function createOptions(kind: PassKind, rpId: string, challenge: Uint8Array<ArrayBuffer>, userId: Uint8Array<ArrayBuffer>) {
  return {
    challenge, rp: { name: 'Schoolcraft', id: rpId },
    user: { id: userId, name: kind === 'phone' ? 'rodič (telefon)' : 'rodič', displayName: kind === 'phone' ? 'Rodič, telefon' : 'Rodič' },
    pubKeyCredParams: [{ type: 'public-key' as const, alg: -7 }, { type: 'public-key' as const, alg: -257 }],
    authenticatorSelection: { authenticatorAttachment: kind === 'phone' ? 'cross-platform' as const : 'platform' as const, userVerification: 'required' as const, residentKey: 'discouraged' as const },
    hints: kind === 'phone' ? ['hybrid'] : ['client-device'], timeout: 90000, attestation: 'none' as const,
  };
}
export function getOptions(kind: PassKind, rpId: string, challenge: Uint8Array<ArrayBuffer>, ids: string[]) {
  return {
    challenge, rpId, userVerification: 'required' as const, timeout: 90000, hints: kind === 'phone' ? ['hybrid'] : ['client-device'],
    allowCredentials: ids.map(id => ({ type: 'public-key' as const, id: fromB64u(id), transports: kind === 'phone' ? ['hybrid' as const] : ['internal' as const] })),
  };
}
