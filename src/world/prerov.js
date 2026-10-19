// Přerov z kostek: místa z Adamova města za nejdelší řadu dní
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { save } from '../save/save.ts';
import { pick, rng, texCanvas } from '../gfx/textures.js';
import { seasonTex, snowFx } from './house.js';
import { speak, synth } from '../audio/speech.js';
import { show } from '../ui/screens.js';
import { fitCanvas, spr } from './farm.js';
import { signCanvas } from './village.js';

// Odměna za pravidelnost; nejdelší řada se nikdy nesníží, takže postavené místo nezmizí. Jen skutečná místa, nic smyšleného.
const PREROV = [
  { at: 3, name: 'řeka Bečva' },
  { at: 5, name: 'lávka přes Bečvu' },
  { at: 7, name: 'tvoje škola Za Mlýnem' },
  { at: 10, name: 'nádraží s vlakem' },
  { at: 14, name: 'zámek s věží' },
  { at: 21, name: 'kostel' },
  { at: 30, name: 'náměstí s kašnou' },
  { at: 45, name: 'sokolovna, kde chodíš na karate' },
  { at: 60, name: 'ohňostroj nad Přerovem' },
];
const prerovStage = () => PREROV.filter(x => save.streak.best >= x.at).length;
function drawPrerov(cv) {
  const C = 16, W = 36, H = 14; cv.width = W * C; cv.height = H * C;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const st = prerovStage();
  const cell = (t, x, y) => g.drawImage(texCanvas(seasonTex(t)), x * C, y * C);
  const at = (name, x, row) => { const sp = spr(name); g.drawImage(sp, x * C, (row + 1) * C - sp.height); };
  const grd = g.createLinearGradient(0, 0, 0, 11 * C); grd.addColorStop(0, st >= 9 ? '#1a2350' : '#6fb2ea'); grd.addColorStop(1, st >= 9 ? '#4a3a70' : '#c6e6f8');
  g.fillStyle = grd; g.fillRect(0, 0, cv.width, cv.height);
  if (st < 9) { g.fillStyle = '#fff3a6'; g.fillRect(33 * C, C, 24, 24); g.fillStyle = '#ffffff'; g.fillRect(4 * C, 1.5 * C, 40, 10); g.fillRect(20 * C, C, 34, 8); }
  const river = x => st >= 1 && x >= 17 && x <= 20;
  for (let x = 0; x < W; x++) { if (river(x)) { cell('water', x, 11); cell('water', x, 12); } else { cell('grass', x, 11); cell('dirt', x, 12); } cell('dirt', x, 13); }
  if (st >= 2) { for (let x = 16; x <= 21; x++) { cell('planks', x, 10); at('fence', x, 9); } }
  if (st >= 3) { // škola
    for (let y = 6; y <= 10; y++) for (let x = 1; x <= 6; x++) cell('brick', x, y);
    [[2, 7], [5, 7], [2, 9], [5, 9]].forEach(([x, y]) => cell('glass', x, y));
    cell('doorB', 3, 10); cell('doorT', 3, 9); g.drawImage(signCanvas('A'), 4 * C, 9 * C);
    for (let x = 0; x <= 7; x++) cell('roofRed', x, 5); for (let x = 1; x <= 6; x++) cell('roofRed', x, 4);
  }
  if (st >= 4) { // nádraží
    for (let x = 22; x < W; x++) at('rail', x, 10);
    for (let y = 7; y <= 9; y++) for (let x = 29; x <= 34; x++) cell('quartz', x, y);
    for (let x = 28; x <= 35; x++) cell('roofBlue', x, 6); g.drawImage(spr('clock'), 31.5 * C, 7 * C);
    cell('glass', 30, 8); cell('glass', 34, 8);
  }
  if (st >= 5) { // zámek
    for (let y = 7; y <= 10; y++) for (let x = 10; x <= 15; x++) cell('stone', x, y);
    [10, 12, 15].forEach(x => cell('stone', x, 6));
    for (let y = 3; y <= 6; y++) cell('stone', 14, y); cell('roof', 14, 2); at('flagCz', 14, 1);
    cell('glass', 11, 8); cell('glass', 14, 8); cell('doorB', 12, 10); cell('doorT', 12, 9);
  }
  if (st >= 6) { // kostel
    for (let y = 7; y <= 10; y++) for (let x = 7; x <= 9; x++) cell('quartz', x, y);
    for (let y = 3; y <= 6; y++) cell('quartz', 8, y); cell('roof', 8, 2); at('cross', 8, 1);
    cell('glass', 8, 8); cell('doorB', 8, 10); cell('doorT', 8, 9);
  }
  if (st >= 7) at('fountain', 0, 10);
  if (st >= 8) { // sokolovna (stojí před kolejemi, kolej je jen u nádraží)
    for (let y = 7; y <= 10; y++) for (let x = 23; x <= 27; x++) cell('planksY', x, y);
    for (let x = 22; x <= 28; x++) cell('roofRed', x, 6);
    cell('doorB', 25, 10); cell('doorT', 25, 9); g.drawImage(signCanvas('belt'), 25 * C, 7 * C); cell('glass', 23, 8); cell('glass', 27, 8);
  }
  if (st >= 4) { at('wagon', 29, 10); at('loco', 31, 10); } // vlak až nakonec, ať ho nic nezakryje
  if (st >= 9) { // ohňostroj
    const r = rng(17);
    for (let k = 0; k < 6; k++) { const cx = 40 + r() * (cv.width - 80), cy = 20 + r() * 70, col = pick(r, ['#ff5a5a', '#f6cf45', '#5ad0ff', '#9b5de5', '#6bd96b']); g.fillStyle = col; for (let a = 0; a < 12; a++) { const an = a / 12 * Math.PI * 2; for (let d = 4; d <= 14; d += 5) g.fillRect(Math.round(cx + Math.cos(an) * d), Math.round(cy + Math.sin(an) * d), 2, 2); } }
  }
  snowFx(g, cv.width, cv.height);
}
function openPrerov() {
  G.speechId++; if (synth) synth.cancel();
  show('prerov'); drawPrerov($('#prerovBig')); fitCanvas($('#prerovBig'));
  const st = prerovStage(), next = PREROV[st];
  const cap = st === 0 ? `Přerov se začne stavět, až budeš hrát 3 dny v řadě. Tvoje nejdelší řada: ${save.streak.best}.` : next ? `Postaveno ${st} z ${PREROV.length}. Další: ${next.name}, až budeš hrát ${next.at} dní v řadě. Tvoje nejdelší řada: ${save.streak.best}.` : 'Celý Přerov je postavený, i s ohňostrojem!';
  $('#prerovCap').textContent = cap;
  speak(cap);
}

export { PREROV, drawPrerov, openPrerov, prerovStage };
