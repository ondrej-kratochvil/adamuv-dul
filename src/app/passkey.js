// Otisk prstu pro vstup do nastavení (pravidla logic/passkey.ts): nastavení klíče a ověření (WebAuthn)
import { PASSKEY_KEY, addPass, assertionOk, b64u, createOptions, getOptions, parsePassState } from '../logic/passkey.ts';

function passState() { try { return parsePassState(localStorage.getItem(PASSKEY_KEY)); } catch (e) { return parsePassState(null); } }
function storePass(s) { try { localStorage.setItem(PASSKEY_KEY, JSON.stringify(s)); } catch (e) { /* nic */ } }
const rnd = n => crypto.getRandomValues(new Uint8Array(new ArrayBuffer(n)));
// umí zařízení WebAuthn? local navíc potřebuje vestavěný autentizátor (otisk, obličej, PIN zařízení)
function passSupport() { return typeof window !== 'undefined' && !!window.PublicKeyCredential && !!(navigator.credentials && navigator.credentials.create); }
async function localAvailable() {
  try { return passSupport() && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable(); } catch (e) { return false; }
}
// nastavit nový klíč (rodič na kartě Hra); vrací true, nebo vyhodí chybu s důvodem
async function registerPass(kind) {
  if (!passSupport()) throw new Error('nosupport');
  const challenge = rnd(32);
  const cred = await navigator.credentials.create({ publicKey: createOptions(kind, location.hostname, challenge, rnd(16)) });
  if (!cred || !cred.response) throw new Error('cancel');
  const authData = cred.response.getAuthenticatorData ? cred.response.getAuthenticatorData() : null;
  if (authData && !assertionOk(cred.response.clientDataJSON, authData, challenge, 'webauthn.create')) throw new Error('verify');
  storePass(addPass(passState(), kind, b64u(cred.rawId)));
  return true;
}
// ověření pro vstup do nastavení
async function verifyPass(kind) {
  const ids = passState()[kind]; if (!ids.length) return false;
  const challenge = rnd(32);
  try {
    const a = await navigator.credentials.get({ publicKey: getOptions(kind, location.hostname, challenge, ids) });
    return !!a && ids.includes(b64u(a.rawId)) && assertionOk(a.response.clientDataJSON, a.response.authenticatorData, challenge);
  } catch (e) { return false; }
}
function removePass(kind) { const s = passState(); s[kind] = []; storePass(s); }
export { localAvailable, passState, passSupport, registerPass, removePass, verifyPass };
