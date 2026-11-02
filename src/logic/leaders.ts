// Texty žebříčku (Ondřej 2. 11. 2026: „vede ty“, „1 mláďat“): čeština podle čísla a osoby, na obrazovku i pro hlas.
// Čísla se skloňují podle tvarů [1, 2 až 4, 0 a 5 a víc] (count), osoba „ty“ má vlastní tvary sloves.

// tvar podle čísla: 1 mládě, 2 mláďata, 5 mláďat (0 jako 5)
export const form = (n: number, [one, few, many]: readonly [string, string, string]): string => n === 1 ? one : n >= 2 && n <= 4 ? few : many;
export const count = (n: number, forms: readonly [string, string, string]): string => `${n} ${form(n, forms)}`;

export const POINTS = ['bod', 'body', 'bodů'] as const;
// „s 1 bodem“, „s 3 body“, „s 15 body“ (7. pád má pro 2 a víc stejný tvar)
export const withPoints = (n: number): string => `s ${n} ${n === 1 ? 'bodem' : 'body'}`;

export interface Summary { house?: number; farm?: number; village?: number; pets?: number; babies?: number; portal?: boolean; dragon?: number; streak?: number }
// odznáčky: [klíč, text na obrazovku, text pro hlas ve 4. pádě po „má“] (jen co hráč má)
export function badges(s: Summary, farmMax: number): [string, string, string][] {
  const out: [string, string, string][] = [], house = s.house || 0;
  out.push(['house', house >= 12 ? 'dům hotový' : `dům ${house}/12`, house >= 12 ? 'hotový dům' : count(house, ['díl domu', 'díly domu', 'dílů domu'])]);
  if (s.farm) out.push(['farm', `farma ${s.farm}/${farmMax}`, s.farm >= farmMax ? 'hotovou farmu' : `${count(s.farm, ['díl', 'díly', 'dílů'])} farmy`]);
  if (s.village) out.push(['village', count(s.village, ['budova ve vesnici', 'budovy ve vesnici', 'budov ve vesnici']), count(s.village, ['hotovou budovu', 'hotové budovy', 'hotových budov']) + ' ve vesnici']);
  if (s.pets) out.push(['pets', count(s.pets, ['zvířátko', 'zvířátka', 'zvířátek']), count(s.pets, ['zvířátko', 'zvířátka', 'zvířátek'])]);
  if (s.babies) out.push(['babies', count(s.babies, ['mládě', 'mláďata', 'mláďat']), count(s.babies, ['mládě', 'mláďata', 'mláďat']) + ' na farmě']);
  if (s.portal) out.push(['portal', 'portál do Netheru', 'portál do Netheru']);
  if (s.dragon) out.push(['dragon', `drak ${s.dragon}×`, s.dragon === 1 ? 'poraženého draka' : `draka poraženého ${s.dragon}krát`]);
  if ((s.streak || 0) > 1) out.push(['streak', `řada ${count(s.streak!, ['den', 'dny', 'dní'])}`, `řadu ${count(s.streak!, ['den', 'dny', 'dní'])}`]);
  return out;
}

export interface Row { nick: string; points: number; me?: boolean }
// věta po otevření žebříčku: „Vede Víťa s 15 body. Ty máš 12 bodů.“ / „Vedeš ty s 15 body.“
export function leadSpeech(rows: Row[]): string {
  const top = rows[0], me = rows.find(r => r.me);
  if (!top) return 'Žebříček je zatím prázdný.';
  if (top.points <= 0) return 'Žebříček tohoto týdne. Zatím nikdo nemá žádný bod. Zahraj si kolo a budeš první!';
  const tie = rows.filter(r => r.points === top.points);
  if (tie.length > 1 && top.points > 0) {
    const names = tie.map(r => r.me ? 'ty' : r.nick), list = names.slice(0, -1).join(', ') + ' a ' + names.at(-1);
    return `Žebříček tohoto týdne. Vedete spolu ${withPoints(top.points)}: ${list}.` + (me && me.points !== top.points ? ` Ty máš ${count(me.points, POINTS)}.` : '');
  }
  return 'Žebříček tohoto týdne. ' + (top.me ? `Vedeš ty ${withPoints(top.points)}.` : `Vede ${top.nick} ${withPoints(top.points)}.` + (me ? ` Ty máš ${count(me.points, POINTS)}.` : ''));
}
// věta po klepnutí na hráče
export function rowSpeech(r: Row, b: [string, string, string][], extra: string[]): string {
  return `${r.me ? 'Ty máš' : r.nick + ' má'} ${count(r.points, POINTS)}.` + (b.length ? ` ${r.me ? 'Máš' : 'Má'} ${list(b.map(x => x[2]))}.` : '') + (extra.length ? ` To ty ještě nemáš: ${list(extra)}.` : '');
}
// výčet s „a“ před posledním: „hotový dům, 2 zvířátka a řadu 3 dny“
export const list = (xs: string[]): string => xs.length < 2 ? xs.join('') : xs.slice(0, -1).join(', ') + ' a ' + xs.at(-1);
