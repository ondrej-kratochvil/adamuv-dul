// Dům
import { save } from '../save/save.js';
import { rng, texCanvas } from '../gfx/textures.js';

const STAGES = ['základy', 'první řada zdi', 'druhá řada zdi', 'třetí řada zdi', 'dveře', 'okno', 'střecha', 'další kus střechy', 'komín', 'strom', 'květiny', 'lucerna a druhý strom'];
const GARDEN = [[4, 'flowerY'], [14, 'flowerR'], [0, 'flowerR'], [17, 'flowerY'], [1, 'flowerY'], [3, 'flowerR'], [19, 'flowerR']];
function houseCells(stage, garden) {
  const m = new Map(); const set = (x, y, t) => m.set(x + ',' + y, t);
  if (stage >= 1) for (let x = 6; x <= 13; x++) set(x, 10, 'cobble');
  [9, 8, 7].forEach((y, i) => { if (stage >= 2 + i) for (let x = 6; x <= 13; x++) set(x, y, x === 6 || x === 13 ? 'log' : 'planks'); });
  if (stage >= 5) { set(8, 9, 'doorB'); set(8, 8, 'doorT'); }
  if (stage >= 6) { set(10, 8, 'glass'); set(11, 8, 'glass'); }
  if (stage >= 7) for (let x = 5; x <= 14; x++) set(x, 6, 'roof');
  if (stage >= 8) { for (let x = 6; x <= 13; x++) set(x, 5, 'roof'); for (let x = 7; x <= 12; x++) set(x, 4, 'roof'); }
  if (stage >= 9) { for (let x = 8; x <= 11; x++) set(x, 3, 'roof'); set(12, 3, 'brick'); set(12, 2, 'brick'); }
  const tree = cx => { for (let y = 8; y <= 10; y++) set(cx, y, 'log'); for (let y = 5; y <= 7; y++) for (let x = cx - 1; x <= cx + 1; x++) set(x, y, 'leaves'); set(cx, 4, 'leaves'); };
  if (stage >= 10) tree(2);
  if (stage >= 11) { set(15, 10, 'flowerR'); set(16, 10, 'flowerY'); }
  if (stage >= 12) { set(5, 10, 'torch'); tree(18); }
  GARDEN.slice(0, garden).forEach(([x, t]) => set(x, 10, t));
  return m;
}
function drawHouse(cv) {
  const stage = Math.min(12, save.total), garden = Math.max(0, save.total - 12);
  const C = 16, W = 20, H = 14; cv.width = W * C; cv.height = H * C;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const grd = g.createLinearGradient(0, 0, 0, 11 * C); grd.addColorStop(0, '#6fb2ea'); grd.addColorStop(1, '#c6e6f8');
  g.fillStyle = grd; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#fff3a6'; g.fillRect(16 * C, C, 24, 24);
  g.fillStyle = '#ffffff'; g.fillRect(2 * C, 1.5 * C, 40, 10); g.fillRect(2 * C + 10, 1.5 * C - 8, 22, 8); g.fillRect(12 * C, 0.8 * C, 34, 8);
  for (let x = 0; x < W; x++) { g.drawImage(texCanvas('grass'), x * C, 11 * C); g.drawImage(texCanvas('dirt'), x * C, 12 * C); g.drawImage(texCanvas('dirt'), x * C, 13 * C); }
  for (const [k, t] of houseCells(stage, garden)) { const [x, y] = k.split(',').map(Number); g.drawImage(texCanvas(seasonTex(t)), x * C, y * C); }
  snowFx(g, cv.width, cv.height);
}

// roční období: podzim barví listí, v prosinci svítí na stromech světýlka, v zimě sněží
function season() { const n = new Date(), m = n.getMonth() + 1, d = n.getDate(); if (m === 12 || (m === 1 && d <= 6)) return 'xmas'; if (m <= 2) return 'winter'; if (m >= 9 && m <= 11) return 'autumn'; return ''; }
function seasonTex(t) { const se = season(); return t === 'leaves' ? (se === 'autumn' ? 'leavesAutumn' : se === 'xmas' ? 'leavesXmas' : t) : t; }
function snowFx(g, w, h) {
  const se = season(); if (se !== 'winter' && se !== 'xmas') return;
  const img = g.getImageData(0, 0, w, h), D = img.data;
  const skyAt = y => { const t = Math.min(1, y / 176); return [0x6f + (0xc6 - 0x6f) * t, 0xb2 + (0xe6 - 0xb2) * t, 0xea + (0xf8 - 0xea) * t]; };
  // čepice sněhu na všem, co je nejvýš v daném sloupci
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) {
    const i = (y * w + x) * 4, [r, gg, b] = skyAt(y);
    const bright = D[i] > 235 && D[i + 1] > 230;
    if (!bright && Math.abs(D[i] - r) + Math.abs(D[i + 1] - gg) + Math.abs(D[i + 2] - b) > 40) { for (let k = Math.max(0, y - 2); k <= y + 1; k++) { const j = (k * w + x) * 4; D[j] = 250; D[j + 1] = 252; D[j + 2] = 255; } break; }
  }
  g.putImageData(img, 0, 0);
  g.fillStyle = '#ffffff'; const r = rng(7); for (let i = 0; i < 40; i++) g.fillRect(Math.floor(r() * w), Math.floor(r() * h * .75), 2, 2);
}

export { GARDEN, STAGES, drawHouse, houseCells, season, seasonTex, snowFx };
