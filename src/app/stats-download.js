// Stažení statistik z databáze Schoolcraft jako CSV (pravidla v logic/stats-export.ts, API GET /api/me/events).
// Nejdřív se odešle, co čeká ve frontě, ať je v souboru i poslední kolo.
import { save } from '../save/save.ts';
import { codeOf } from '../logic/cloud.ts';
import { dayStr } from '../logic/calendar.ts';
import { fileName, toCsv } from '../logic/stats-export.ts';
import { API, syncCloud } from './cloud.js';
import { player } from './player.js';

const MAX_PAGES = 200; // pojistka (200 000 řádků)
async function fetchStats(kind) {
  const rows = [];
  let after = 0;
  for (let i = 0; i < MAX_PAGES; i++) {
    const res = await fetch(`${API}/api/me/events?kind=${encodeURIComponent(kind)}&after=${after}`, { headers: { Authorization: `Bearer ${codeOf(save.cloud)}` } });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) throw new Error((data && data.error) || `server ${res.status}`);
    rows.push(...data.rows);
    if (!data.next) break;
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
export { downloadStats, fetchStats };
