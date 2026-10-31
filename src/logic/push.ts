// Ranní upozornění na zařízení (Ondřej 31. 10. 2026): co se pamatuje a co upozornění říká. Server: worker/push.ts.
import { DAILY_BONUS } from './daily';

export const PUSH_KEY = 'schoolcraft-upozorneni';  // localStorage: patří zařízení, ne hráči ani profilu
export const PUSH_HOURS = [5, 6, 7, 8, 9];          // stejné jako na serveru (worker/push.ts HOURS)
export const PUSH_TEXT_CACHE = 'schoolcraft-upozorneni', PUSH_TEXT_URL = '/__upozorneni'; // text pro service worker
export interface PushState { on: boolean; hour: number; endpoint: string; rank: boolean } // rank = upozornit na předběhnutí v žebříčku
export function parsePushState(raw: string | null): PushState {
  let j: Partial<PushState> = {};
  try { j = JSON.parse(raw || '{}') || {}; } catch { j = {}; }
  return { on: j.on === true, hour: PUSH_HOURS.includes(j.hour as number) ? j.hour as number : 7, endpoint: typeof j.endpoint === 'string' ? j.endpoint : '', rank: j.rank === true };
}
// text upozornění (service worker ho zobrazí, i když je hra zavřená); oslovení hráče v 5. pádě
export const pushText = (voc: string): { title: string; body: string } =>
  ({ title: 'Schoolcraft', body: `Dobré ráno, ${voc}! Čeká tě dnešní úkol za ${DAILY_BONUS} smaragdů.` });
// base64url → bajty (veřejný klíč serveru pro pushManager.subscribe)
export function keyBytes(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)), out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
