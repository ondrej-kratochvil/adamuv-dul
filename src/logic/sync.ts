// Odesílání statistik do tabulky Google (Apps Script ve tvém účtu, návod v docs/google-tabulka.md). Zavedeno 20. 10. 2026.
// Hra řádky skládá do fronty v uloženém stavu; když tablet nemá internet, počkají a odejdou později.
// Adresa skriptu se zadává v nastavení, v kódu ani v repu není (repo je veřejné).
export type SyncRow = Record<string, string | number | boolean>;
// device = název zařízení (sloupec Zařízení a list Stav zvlášť), uid = náhodná značka zařízení do ID řádků (Ondřej 21. 10. 2026:
// Adam hraje i na počítači dědy Boba se stejnou tabulkou)
export interface SyncState { url: string; queue: SyncRow[]; last: number; sent: number; error: string; seq: number; backfilled?: boolean; start?: number; device: string; uid: string }

export const QUEUE_MAX = 5000; // víc se nevejde do úložiště tabletu; nejstarší řádky odpadnou
export const BATCH = 300;      // řádků v jednom odeslání

export const syncDefaults = (): SyncState => ({ url: '', queue: [], last: 0, sent: 0, error: '', seq: 0, device: '', uid: '' });
// výchozí název zařízení, dokud ho rodič nepřejmenuje
export const defaultDeviceName = (touch: boolean): string => touch ? 'tablet' : 'počítač';
export const newUid = (rng: () => number = Math.random): string => Math.floor(rng() * 36 ** 4).toString(36).padStart(4, '0');

// platná adresa nasazeného Apps Scriptu
export const validSyncUrl = (u: string): boolean => /^https:\/\/script\.google(usercontent)?\.com\/macros\/s\/[\w-]+\/exec$/.test(u.trim());

// přidá řádky do fronty; každý dostane ID, aby tabulka při opakovaném odeslání nezapsala nic dvakrát
// start = od kdy se řádky skládají do fronty (starší kola se při prvním nastavení doplní z deníku)
export function enqueue(s: SyncState, rows: SyncRow[], now: number): void {
  if (!s.start) s.start = now;
  for (const r of rows) s.queue.push({ ID: `${s.uid ? s.uid + '-' : ''}${now.toString(36)}-${(s.seq++).toString(36)}`, ...(s.device ? { Zařízení: s.device } : {}), ...r });
  if (s.queue.length > QUEUE_MAX) s.queue.splice(0, s.queue.length - QUEUE_MAX);
}

// po úspěšném odeslání odebere odeslané řádky (podle ID, fronta mezitím mohla narůst)
// nové zařízení: pojmenovat a dát mu vlastní značku (při startu hry)
export function ensureDevice(s: SyncState, touch: boolean, rng: () => number = Math.random): void {
  if (!s.device) s.device = defaultDeviceName(touch);
  if (!s.uid) s.uid = newUid(rng);
}

// přejmenování zařízení: i řádky, které ještě čekají na odeslání, dostanou nový název (Ondřej 20. 10. 2026: při zadání
// názvu i adresy najednou odešly řádky se starým výchozím názvem)
export function renameDevice(s: SyncState, name: string): void {
  s.device = name;
  for (const r of s.queue) r.Zařízení = name;
}

export function acknowledge(s: SyncState, ids: string[], now: number): void {
  const set = new Set(ids);
  const before = s.queue.length;
  s.queue = s.queue.filter(r => !set.has(String(r.ID)));
  s.sent += before - s.queue.length; s.last = now; s.error = '';
}

// místní čas ve tvaru, kterému tabulka rozumí (2026-10-20 14:05:09)
export function localStamp(t: number): string {
  const d = new Date(t), p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}
