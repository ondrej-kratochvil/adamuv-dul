// Ranní upozornění na tomhle zařízení: souhlas, přihlášení u služby upozornění a na serveru (worker/push.ts).
// Upozornění zobrazí service worker (public/sw.js) i se zavřenou hrou; text si bere z mezipaměti (PUSH_TEXT_URL).
import { save } from '../save/save.ts';
import { codeOf } from '../logic/cloud.ts';
import { PUSH_KEY, PUSH_TEXT_CACHE, PUSH_TEXT_URL, keyBytes, parsePushState, pushText } from '../logic/push.ts';
import { API } from './cloud.js';
import { voc } from './player.js';

function pushState() { try { return parsePushState(localStorage.getItem(PUSH_KEY)); } catch (e) { return parsePushState(null); } }
function storeState(s) { try { localStorage.setItem(PUSH_KEY, JSON.stringify(s)); } catch (e) { /* nic */ } }
// proč upozornění na tomhle zařízení nejde ('' = jde)
function pushProblem() {
  if (typeof location !== 'undefined' && /\.github\.io$/.test(location.hostname)) return 'old';
  if (!('serviceWorker' in navigator) || !('Notification' in window)) return 'nosupport';
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (!('PushManager' in window)) return ios && !matchMedia('(display-mode: standalone)').matches ? 'ios' : 'nosupport';
  if (Notification.permission === 'denied') return 'denied';
  return '';
}
const ready = () => Promise.race([navigator.serviceWorker.ready, new Promise((_, no) => setTimeout(() => no(new Error('aplikace se ještě nenačetla, zkuste to za chvíli')), 8000))]);
async function api(method, body) {
  const headers = { 'Content-Type': 'application/json', ...(save.cloud && save.cloud.id ? { Authorization: `Bearer ${codeOf(save.cloud)}` } : {}) };
  const res = await fetch(API + '/api/push' + (method === 'GET' ? '/key' : ''), { method, headers, ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error((data && data.error) || `server ${res.status}`);
  return data;
}
// text pro service worker (oslovení se mění s hráčem, proto při každém startu hry)
async function writePushText() {
  try { const c = await caches.open(PUSH_TEXT_CACHE); await c.put(PUSH_TEXT_URL, new Response(JSON.stringify(pushText(voc())), { headers: { 'Content-Type': 'application/json' } })); } catch (e) { /* bez mezipaměti řekne obecný text */ }
}
// zapnout (nebo změnit hodinu): souhlas musí přijít z klepnutí rodiče
async function enablePush(hour) {
  const p = pushProblem(); if (p) throw new Error(p);
  if (await Notification.requestPermission() !== 'granted') throw new Error('denied');
  const reg = await ready(), { key } = await api('GET');
  const sub = await reg.pushManager.getSubscription() || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
  const j = sub.toJSON();
  await api('POST', { endpoint: j.endpoint, keys: j.keys, hour });
  await writePushText();
  storeState({ on: true, hour, endpoint: j.endpoint });
}
async function disablePush() {
  const s = pushState();
  try { const reg = await ready(); const sub = await reg.pushManager.getSubscription(); if (sub) await sub.unsubscribe(); } catch (e) { /* zrušení u služby jen když jde */ }
  if (s.endpoint) await api('DELETE', { endpoint: s.endpoint }).catch(() => {});
  storeState({ ...s, on: false, endpoint: '' });
}
// zkušební upozornění hned (bez serveru): ukáže, jestli tablet upozornění pustí
async function testPush() {
  const p = pushProblem(); if (p) throw new Error(p);
  if (await Notification.requestPermission() !== 'granted') throw new Error('denied');
  const reg = await ready(), t = pushText(voc());
  await reg.showNotification(t.title, { body: t.body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'denni-ukol' });
}
function initPush() { if (pushState().on) writePushText(); }
export { disablePush, enablePush, initPush, pushProblem, pushState, testPush };
