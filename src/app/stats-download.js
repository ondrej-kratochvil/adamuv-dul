// Stažení statistik z databáze Schoolcraft jako CSV (pravidla v logic/stats-export.ts, API GET /api/me/events).
// Nejdřív se odešle, co čeká ve frontě, ať je v souboru i poslední kolo.
import { save } from '../save/save.ts';
import { codeOf } from '../logic/cloud.ts';
import { dayStr } from '../logic/calendar.ts';
import { BACKFILL_MARK, earliestStamp, fileName, oldRoundRows, toCsv } from '../logic/stats-export.ts';
import { localStamp } from '../logic/sync.ts';
import { persist, profile } from '../save/save.ts';
import { MAIN_ID } from '../logic/profiles.ts';
import { levelName } from './sync.js';
import { API, syncCloud } from './cloud.js';
import { player } from './player.js';

const MAX_PAGES = 200; // pojistka (200 000 řádků)
async function fetchStats(kind, onePage = false) {
  const rows = [];
  let after = 0;
  for (let i = 0; i < MAX_PAGES; i++) {
    const res = await fetch(`${API}/api/me/events?kind=${encodeURIComponent(kind)}&after=${after}`, { headers: { Authorization: `Bearer ${codeOf(save.cloud)}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) throw new Error((data && data.error) || `server ${res.status}`);
    rows.push(...data.rows);
    if (!data.next || onePage) break;
    after = data.next;
  }
  return rows;
}
// vrací počet řádků v souboru (0 = nic nestaženo)
async function downloadStats(kind) {
  if (!save.cloud.on) throw new Error('online vypnuté');
  await syncCloud(true).catch(() => {});
  if (!save.cloud.id) throw new Error('nepřihlášeno k serveru');
  const rows = await fetchStats(kind);
  if (!rows.length) return 0;
  const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = fileName(kind, dayStr(), save.cloud.nick || player().name || '');
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  return rows.length;
}
// kola z deníku starší než nejstarší kolo v databázi (první stránka je seřazená od nejstarších záznamů)
async function oldRounds() {
  if (!save.cloud.on) throw new Error('online vypnuté');
  await syncCloud(true).catch(() => {});
  if (!save.cloud.id) throw new Error('nepřihlášeno k serveru');
  if (save.cloud.queue.some(r => r[BACKFILL_MARK])) return { rows: [], waiting: true }; // už čekají na odeslání
  const before = earliestStamp(await fetchStats('kolo', true));
  return { rows: oldRoundRows(save.log, before, localStamp, levelName, profile.id !== MAIN_ID ? { Profil: profile.name } : {}), waiting: false };
}
// pošle starší kola (nejstarší napřed, před vším, co čeká ve frontě); vrací počet
async function sendOldRounds() {
  const { rows, waiting } = await oldRounds();
  if (waiting) return -1;
  if (!rows.length) return 0;
  save.cloud.queue.unshift(...rows); persist();
  await syncCloud(true);
  return rows.length;
}
export { downloadStats, fetchStats, oldRounds, sendOldRounds };
