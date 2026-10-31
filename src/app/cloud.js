// Schoolcraft online: přihlášení zařízení k serveru, záloha postupu, statistiky a žebříček (server worker/index.ts).
// Hraje se i bez internetu; když server neodpoví, hra jede dál a pošle to později.
import { persist, profile, save, replaceSave } from '../save/save.ts';
import { MAIN_ID } from '../logic/profiles.ts';
import { EVENTS_BATCH, PUSH_EVERY_MS, QUEUE_MAX, backupOf, codeOf, parseCode, weekOf, weekPoints } from '../logic/cloud.ts';
import { migrate } from '../save/schema.ts';
import { dayStr } from '../logic/calendar.ts';
import { player } from './player.js';
import { FARM_START, farmStage } from '../world/farm.js';
import { portalLit } from '../world/nether.js';
import { unlockedPets } from '../logic/pets.ts';

// na schoolcraft.games relativně, odjinud (stará adresa na GitHubu, vývoj) na plnou adresu
const API = typeof location !== 'undefined' && location.hostname === 'schoolcraft.games' ? '' : 'https://schoolcraft.games';
const auth = () => ({ Authorization: `Bearer ${codeOf(save.cloud)}` });
async function call(path, opts = {}) {
  const res = await fetch(API + path, { ...opts, headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) } });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error((data && data.error) || `server ${res.status}`);
  return data;
}
const online = () => !(typeof navigator !== 'undefined' && navigator.onLine === false);
const nick = () => (save.cloud.nick || player().name || 'Hráč').slice(0, 20);
// do žebříčku jen když to rodič nechá zapnuté (save.cloud.pub)
const isPublic = () => save.cloud.on && save.cloud.pub !== false;

// postavička a co má hráč postavené (do žebříčku; žádné chyby ani statistiky)
function summary() {
  const v = save.village || {};
  return {
    outfit: { ...save.outfit }, total: save.total, house: Math.min(save.total, FARM_START), farm: farmStage(),
    village: Object.values(v).filter(x => x >= 8).length, pets: unlockedPets(player(), save.questsDone || 0).length,
    babies: (save.babies || []).length, streak: save.streak.count, cards: (save.cards || []).length, dragon: save.dragon || 0, portal: portalLit(),
  };
}
function weekNow() { const w = weekOf(dayStr()); return { week: w, weekPoints: weekPoints(save.log, save.questLog || [], w) }; }

// při odchodu ze stránky (znovunačtení, smazání profilu) neukládat: přepsalo by to, co se v zařízení mezitím změnilo
// (smazaný profil by se vrátil); poslední čas a chyba nejsou důležité, přihlášení nového hráče se ukládá vždy
const keep = () => { if (!(typeof document !== 'undefined' && document.hidden)) persist(); };
let busy = false;
// přihlásí zařízení (jednou) a pošle souhrn, zálohu a frontu statistik; force = hned (jinak nejvýš jednou za 30 s)
async function syncCloud(force = false) {
  const c = save.cloud;
  // stará adresa na GitHubu jen stěhuje (app/move.js), jinak by se hráč zaregistroval dvakrát
  if (busy || !c.on || !online() || /\.github\.io$/.test(location.hostname)) return false;
  if (!force && Date.now() - (c.last || 0) < PUSH_EVERY_MS) return false;
  busy = true;
  try {
    if (!c.id) { const r = await call('/api/players', { method: 'POST', body: JSON.stringify({ nick: nick(), public: isPublic() }) }); c.id = r.id; c.secret = r.secret; persist(); }
    // nejdřív statistiky, pak souhrn: server uzná body jen za kola, která už dostal (worker allowedPoints)
    while (c.queue.length) {
      const batch = c.queue.slice(0, EVENTS_BATCH);
      await call('/api/events', { method: 'POST', headers: auth(), body: JSON.stringify({ rows: batch }) });
      c.queue.splice(0, batch.length);
    }
    await call('/api/me', { method: 'PUT', headers: auth(), body: JSON.stringify({ nick: nick(), public: isPublic(), ...weekNow(), summary: summary(), save: backupOf(save) }) });
    c.last = Date.now(); c.error = ''; keep();
    return true;
  } catch (e) { c.error = String(e && e.message || e).slice(0, 200); keep(); return false; }
  finally { busy = false; }
}
// statistiky do fronty (stejné řádky jako do tabulky Google, app/sync.js)
function queueCloud(rows) {
  if (!save.cloud.on) return;
  save.cloud.queue.push(...rows);
  if (save.cloud.queue.length > QUEUE_MAX) save.cloud.queue.splice(0, save.cloud.queue.length - QUEUE_MAX);
}
async function leaderboard() {
  const headers = save.cloud.id ? auth() : {};
  return call('/api/leaderboard', { headers });
}
// postup z jiného zařízení podle kódu: nahradí ten na tomhle (předchozí stav zůstane jako záloha)
async function restoreFromCode(code, backupKey) {
  const c = parseCode(code); if (!c) throw new Error('kód nesedí');
  const r = await call('/api/me/save', { headers: { Authorization: `Bearer ${c.id}.${c.secret}` } });
  if (!r.save) throw new Error('na serveru zatím není uložený postup');
  try { localStorage.setItem(backupKey, JSON.stringify(save)); } catch (e) {}
  const s = migrate(r.save);
  s.cloud = { ...save.cloud, id: c.id, secret: c.secret, on: true, last: 0, queue: [], error: '' };
  s.sync = save.sync; // tabulka Google patří k zařízení
  replaceSave(s); persist();
  return s;
}
// smazat hráče ze serveru (postup v zařízení zůstane)
async function deleteCloud() {
  if (save.cloud.id) await call('/api/me', { method: 'DELETE', headers: auth() });
  save.cloud = { ...save.cloud, id: '', secret: '', on: false, queue: [], last: 0, error: '' }; persist();
}

// skupina pro žebříček (worker: /api/group) a výměna kódu hráče (/api/me/secret)
async function cloudMe() { return call('/api/me', { headers: auth() }); }
async function createGroup(name) { return call('/api/group', { method: 'POST', headers: auth(), body: JSON.stringify({ name }) }); }
async function joinGroup(code) { return call('/api/group', { method: 'PUT', headers: auth(), body: JSON.stringify({ code: code.trim().toLowerCase() }) }); }
async function leaveGroup() { return call('/api/group', { method: 'DELETE', headers: auth() }); }
async function rotateSecret() { const r = await call('/api/me/secret', { method: 'POST', headers: auth() }); save.cloud.secret = r.secret; persist(); return r; }
export { cloudMe, createGroup, joinGroup, leaveGroup, rotateSecret };
export { API, deleteCloud, leaderboard, queueCloud, restoreFromCode, summary, syncCloud };
export const isMainProfile = () => profile.id === MAIN_ID;
