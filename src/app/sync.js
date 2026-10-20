// Odesílání statistik do tabulky Google (pravidla a fronta v logic/sync.ts, skript v docs/google-tabulka.gs)
import { persist, save } from '../save/save.ts';
import { BATCH, acknowledge, enqueue, ensureDevice, localStamp, validSyncUrl } from '../logic/sync.ts';
import { LEVEL_KEYS, levelProgress, masteryPoints } from '../logic/mastery.ts';
import { LEVELS } from '../levels/reading.js';

function levelName(key) { return LEVELS[key] ? LEVELS[key].name : key === 'practice' ? 'Procvičování' : key === 'boss' ? 'Ender drak' : key; }
// přidá řádky do fronty (každý s časem) a zkusí je hned poslat
function queueRows(rows) {
  const now = Date.now();
  enqueue(save.sync, rows.map(r => ({ Čas: localStamp(now), ...r })), now);
  persist();
  flushSync();
}
// list „Stav“ v tabulce: kolik má Adam zvládnuto v každém patře (přepisuje se při každém odeslání)
function stateRows() {
  const rows = LEVEL_KEYS.map(k => { const p = levelProgress(save.stats, k); return { Patro: levelName(k), Zvládnuto: p.got, Celkem: p.all, Procent: Math.round(p.got / p.all * 100), 'Odehraná kola': save.rounds[k] || 0 }; });
  const m = masteryPoints(save.stats);
  rows.push({ Patro: 'Celkem', Zvládnuto: m.pts, Celkem: m.max, Procent: Math.round(m.pts / m.max * 100), 'Odehraná kola': save.total });
  rows.push({ Patro: 'Procvičování', Zvládnuto: '', Celkem: '', Procent: '', 'Odehraná kola': save.practice || 0 });
  return { zarizeni: save.sync.device, aktualizace: localStamp(Date.now()), smaragdy: save.emeralds, rada: save.streak.count, nejdelsiRada: save.streak.best, patra: rows };
}
// při prvním nastavení tabulky pošle i kola odehraná dřív (z deníku; úlohy jednotlivě se dřív neukládaly)
// kolik starších kol by se poslalo (0 = není se na co ptát)
function backfillCount() { if (save.sync.sent || save.sync.backfilled) return 0; const start = save.sync.start || Infinity; return save.log.filter(e => e.t < start).length; }
function backfillLog() {
  if (save.sync.sent || save.sync.backfilled) return;
  const start = save.sync.start || Infinity; // novější kola už ve frontě jsou
  const rows = save.log.filter(e => e.t < start).map(e => ({ Čas: localStamp(e.t), Druh: 'kolo', Patro: levelName(e.level), 'Bez chyby': e.clean, Úloh: e.len, Hotovo: e.done, Povedené: e.ok ? 'ano' : 'ne', Odešel: e.quit ? 'ano' : 'ne', Sekundy: e.secs, ...(e.rate ? { Hodnocení: e.rate } : {}) }));
  const q = save.sync.queue, st = save.sync.start; save.sync.queue = [];
  enqueue(save.sync, rows, Date.now()); save.sync.queue.push(...q); save.sync.start = st || save.sync.start;
  save.sync.backfilled = true; persist();
}
// název a značka tohoto zařízení (tablet, počítač…); dotykové = tablet
function initDevice() { const touch = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches; ensureDevice(save.sync, touch); persist(); }
let busy = false;
async function flushSync() {
  const s = save.sync;
  if (busy || !s.url || !validSyncUrl(s.url) || !s.queue.length) return false;
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return false;
  busy = true;
  try {
    while (s.queue.length) {
      const batch = s.queue.slice(0, BATCH);
      // text/plain: prohlížeč se předem neptá (CORS), Apps Script to přijme
      const res = await fetch(s.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ rows: batch, stav: stateRows() }) });
      const data = await res.json();
      if (!data || !data.ok) throw new Error(data && data.error ? data.error : 'tabulka neodpověděla OK');
      acknowledge(s, batch.map(r => String(r.ID)), Date.now());
      persist();
    }
    return true;
  } catch (e) {
    s.error = String(e && e.message || e).slice(0, 200); persist();
    return false;
  } finally { busy = false; }
}

export { backfillCount, initDevice, backfillLog, flushSync, levelName, queueRows, stateRows };
