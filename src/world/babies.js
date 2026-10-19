// Mláďata na farmě: za každý týden, kdy Adam hraje aspoň 4 dny
import { persist, save } from '../save/save.js';
import { DOG_COATS } from './farm.js';
import { dayStr } from '../rewards/streak.js';

const BABY_DAYS = 4; // kolik dní v jednom týdnu (pondělí až neděle) je potřeba na mládě
const BABIES = [
  { id: 'kure', name: 'kuřátko', x: 15.3, draw: R => { R(3, 2, 6, 6, '#f2d024'); R(9, 4, 2, 1, '#e8862a'); R(7, 3, 1, 1, '#222222'); R(4, 8, 1, 2, '#e8862a'); R(7, 8, 1, 2, '#e8862a'); } },
  { id: 'jehne', name: 'jehňátko', x: 19.9, draw: R => { R(1, 2, 8, 5, '#f4f4f4'); R(8, 1, 3, 4, '#e8d8c0'); R(9, 2, 1, 1, '#222222'); [2, 4, 6].forEach(x => R(x, 7, 1, 3, '#e8d8c0')); } },
  { id: 'tele', name: 'telátko', x: 22.6, draw: R => { R(1, 2, 8, 5, '#6a4a32'); R(3, 3, 2, 2, '#f0f0f0'); R(8, 1, 3, 4, '#6a4a32'); R(10, 3, 2, 2, '#e0b8a0'); R(9, 2, 1, 1, '#111111'); [2, 4, 7].forEach(x => R(x, 7, 1, 3, '#6a4a32')); } },
  { id: 'sele', name: 'selátko', x: 13.2, draw: R => { R(1, 3, 8, 5, '#f4b8c0'); R(8, 2, 3, 4, '#f4b8c0'); R(10, 4, 2, 2, '#e08890'); R(9, 3, 1, 1, '#222222'); R(2, 8, 1, 2, '#e08890'); R(6, 8, 1, 2, '#e08890'); } },
  { id: 'stene', name: 'štěňátko', x: 0.2, draw: R => { const k = DOG_COATS.find(c => c.id === save.dog.coat) || DOG_COATS[0]; R(1, 3, 7, 4, k.w); R(7, 1, 4, 4, k.w); R(7, 0, 1, 2, k.s); R(9, 2, 1, 1, '#222222'); R(10, 3, 1, 1, '#222222'); R(0, 2, 1, 2, k.w); R(2, 7, 1, 3, k.w); R(6, 7, 1, 3, k.w); } },
  { id: 'kote', name: 'koťátko', x: 4.7, draw: R => { R(2, 4, 6, 4, '#e8963c'); R(7, 2, 4, 4, '#e8963c'); R(7, 1, 1, 1, '#e8963c'); R(10, 1, 1, 1, '#e8963c'); R(8, 3, 1, 1, '#3c9b3a'); R(10, 3, 1, 1, '#3c9b3a'); R(0, 2, 1, 3, '#e8963c'); R(3, 8, 1, 2, '#c8762c'); R(6, 8, 1, 2, '#c8762c'); } },
  { id: 'kralik', name: 'králíček', x: 9.6, draw: R => { R(2, 4, 6, 4, '#d8d8d8'); R(7, 3, 3, 3, '#d8d8d8'); R(8, 0, 1, 3, '#d8d8d8'); R(9, 0, 1, 3, '#e8b0b8'); R(9, 4, 1, 1, '#222222'); R(1, 5, 1, 1, '#ffffff'); R(3, 8, 2, 2, '#c8c8c8'); R(6, 8, 2, 2, '#c8c8c8'); } },
  { id: 'kachne', name: 'kachňátko', x: 11.4, draw: R => { R(3, 3, 6, 5, '#f8e060'); R(7, 1, 3, 3, '#f8e060'); R(10, 2, 2, 1, '#e8862a'); R(8, 2, 1, 1, '#222222'); R(4, 8, 1, 2, '#e8862a'); R(7, 8, 1, 2, '#e8862a'); } },
];
function weekKey(ds) { const [y, m, d] = ds.split('-').map(Number); const dt = new Date(y, m - 1, d); dt.setDate(d - ((dt.getDay() + 6) % 7)); return dayStr(dt); } // pondělí daného týdne
function babyCanvas(b) { const c = document.createElement('canvas'); c.width = 12; c.height = 10; c.className = 'px'; const g = c.getContext('2d'); b.draw((x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); }); return c; }
// mláďata za týdny odehrané před touto novinkou (ze záznamu dní, nejvýš 60 dní zpět)
function initBabies() {
  save.weeks = {}; save.babies = [];
  save.streak.days.forEach(d => { const k = weekKey(d); save.weeks[k] = (save.weeks[k] || 0) + 1; });
  Object.keys(save.weeks).sort().forEach(k => { if (save.weeks[k] >= BABY_DAYS && save.babies.length < BABIES.length) save.babies.push(BABIES[save.babies.length].id); });
  persist();
}

export { BABIES, BABY_DAYS, babyCanvas, initBabies, weekKey };
