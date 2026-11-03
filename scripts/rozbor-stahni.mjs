// Stažení statistik rodinné skupiny pro rozbor (Claude, pravidelné rozbory; Ondřej 3. 11. 2026).
// Potřebuje proměnnou prostředí SCHOOLCRAFT_ADMIN_TOKEN (stejná hodnota jako tajná proměnná na GitHubu, nikdy do repa).
// Použití: node scripts/rozbor-stahni.mjs <složka mimo repo>   → hraci.json a <přezdívka>-<druh>.json
// Data o dětech do repa NIKDY (je veřejné); ukládat jen do dočasné složky.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const token = process.env.SCHOOLCRAFT_ADMIN_TOKEN, out = resolve(process.argv[2] || '');
if (!token) { console.error('Chybí SCHOOLCRAFT_ADMIN_TOKEN v prostředí.'); process.exit(1); }
if (!process.argv[2] || out.startsWith(resolve('.'))) { console.error('Zadejte složku MIMO repo (repo je veřejné).'); process.exit(1); }
mkdirSync(out, { recursive: true });
const API = process.env.SCHOOLCRAFT_API || 'https://schoolcraft.games';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function get(path) {
  for (let i = 0; i < 5; i++) {
    const res = await fetch(API + path, { headers: { Authorization: `Admin ${token}` } });
    if (res.status === 429) { await sleep(15000); continue; }
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) throw new Error(`${path}: ${res.status} ${data && data.error}`);
    await sleep(1100); // limit 60 požadavků za minutu
    return data;
  }
  throw new Error(`${path}: pořád 429`);
}
const { players } = await get('/api/admin/players');
writeFileSync(join(out, 'hraci.json'), JSON.stringify(players, null, 1));
for (const p of players) {
  if (!p.events) continue;
  const slug = String(p.nick).normalize('NFD').replace(/[^\w-]/g, '').toLowerCase() + '-' + p.id.slice(0, 4);
  for (const kind of ['kolo', 'úloha', 'hodnocení']) {
    const rows = []; let after = 0;
    do { const d = await get(`/api/admin/events?player=${p.id}&kind=${encodeURIComponent(kind)}&after=${after}`); rows.push(...d.rows); after = d.next; } while (after);
    writeFileSync(join(out, `${slug}-${kind}.json`), JSON.stringify(rows));
    console.log(`${p.nick} (${p.id.slice(0, 4)}): ${kind} ${rows.length}`);
  }
}
