// Vesnice: každé patro staví svou budovu podle zvládnutých úkolů
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { texCanvas } from '../gfx/textures.js';
import { seasonTex, snowFx } from './house.js';
import { speak, synth } from '../audio/speech.js';
import { audio } from '../audio/sfx.js';
import { LEVELS } from '../levels/reading.js';
import { show } from '../ui/screens.js';
import { spr } from './farm.js';
import { levelProgress } from '../logic/mastery.ts';
import { BUILDING_STAGES, buildingStage } from '../logic/rewards.ts';

const BUILDINGS = [
  { lv: 'letters', name: 'škola', in: 've škole', who: 'paní učitelka', what: 'písmen', wall: 'brick', roof: 'roofRed', icon: 'A', robe: '#7d4bc2' },
  { lv: 'syllables', name: 'pekárna', in: 'v pekárně', who: 'pan pekař', what: 'slabik', wall: 'planks', roof: 'roof', icon: 'bread', robe: '#f0f0f0', chimney: true },
  { lv: 'words', name: 'knihovna', in: 'v knihovně', who: 'paní knihovnice', what: 'slov', wall: 'bookshelf', roof: 'roof', icon: 'book', robe: '#3f6fb0' },
  { lv: 'reading', name: 'kino', in: 'v kině', who: 'pan promítač', what: 'obrázků ke čtení', wall: 'darkstone', roof: 'roofRed', icon: 'film', robe: '#c0392b' },
  { lv: 'numbers', name: 'tržiště', in: 'na tržišti', who: 'pan trhovec', what: 'čísel', wall: 'planksY', roof: 'roofBlue', icon: 'coin', robe: '#7a5230' },
  { lv: 'math', name: 'banka', in: 'v bance', who: 'pan bankéř', what: 'příkladů', wall: 'quartz', roof: 'roofBlue', icon: 'emerald', robe: '#2b2b2b' },
  { lv: 'speech', name: 'divadlo', in: 'v divadle', who: 'paní herečka', what: 'slov na poslech', wall: 'quartz', roof: 'roofRed', icon: 'mask', robe: '#9b5de5' },
  { lv: 'writing', name: 'pošta', in: 'na poště', who: 'paní pošťačka', what: 'tahů psaní', wall: 'planksY', roof: 'roofRed', icon: 'letter', robe: '#e0b324' },
];
const BLD_STAGES = ['základy', 'zeď', 'dveře', 'okna', 'střecha', 'vršek střechy', 'cedule', 'vesničan'];
const VILLAGE_BONUS = 20; // smaragdy za dokončenou budovu
function bldProgress(b) { return levelProgress(save.stats, b.lv); }
// fáze podle zvládnutí, ale nikdy méně, než už jednou stálo: odměna se nebere
function bldStage(b) { const { got, all } = bldProgress(b); return Math.max((save.village && save.village[b.lv]) || 0, buildingStage(got, all)); }
function signCanvas(icon) {
  if (icon === 'emerald') return spr('emerald');
  const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); const R = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); };
  R(1, 3, 14, 10, '#7a5a3a'); R(2, 4, 12, 8, '#e8d6b0');
  if (icon === 'A') { R(7, 5, 2, 1, '#c0392b'); R(6, 6, 1, 5, '#c0392b'); R(9, 6, 1, 5, '#c0392b'); R(7, 8, 2, 1, '#c0392b'); }
  if (icon === 'bread') { R(4, 7, 8, 3, '#c98a3a'); R(5, 6, 6, 1, '#d8a050'); R(6, 8, 1, 1, '#a86a2a'); R(9, 8, 1, 1, '#a86a2a'); }
  if (icon === 'book') { R(4, 5, 8, 6, '#2f6fb0'); R(4, 5, 1, 6, '#203a70'); R(6, 7, 4, 1, '#e8d6b0'); }
  if (icon === 'film') { R(3, 6, 10, 4, '#2b2b2b'); [4, 6, 8, 10].forEach(x => { R(x, 6, 1, 1, '#e8d6b0'); R(x, 9, 1, 1, '#e8d6b0'); }); }
  if (icon === 'coin') { R(6, 5, 4, 6, '#f2c94c'); R(5, 6, 6, 4, '#f2c94c'); R(7, 6, 2, 4, '#c9a227'); }
  if (icon === 'belt') { R(3, 7, 10, 2, '#1d1d1d'); R(7, 6, 2, 5, '#1d1d1d'); R(6, 10, 1, 2, '#1d1d1d'); R(9, 10, 1, 2, '#1d1d1d'); }
  if (icon === 'mask') { R(4, 5, 8, 6, '#f2c94c'); R(5, 7, 2, 1, '#3a2a1a'); R(9, 7, 2, 1, '#3a2a1a'); R(6, 9, 4, 1, '#c0392b'); R(5, 10, 1, 1, '#c0392b'); R(10, 10, 1, 1, '#c0392b'); }
  if (icon === 'letter') { R(4, 6, 8, 5, '#ffffff'); R(5, 7, 1, 1, '#8a8a8a'); R(6, 8, 1, 1, '#8a8a8a'); R(7, 9, 2, 1, '#8a8a8a'); R(9, 8, 1, 1, '#8a8a8a'); R(10, 7, 1, 1, '#8a8a8a'); }
  return c;
}
function villagerCanvas(robe) {
  const c = document.createElement('canvas'); c.width = 16; c.height = 32; const g = c.getContext('2d'); const R = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); };
  R(4, 0, 8, 9, '#c9946a'); R(5, 3, 6, 1, '#3a2a1a'); R(5, 4, 2, 1, '#ffffff'); R(9, 4, 2, 1, '#ffffff'); R(6, 4, 1, 1, '#2f7a3a'); R(9, 4, 1, 1, '#2f7a3a'); R(7, 5, 2, 4, '#a8744a');
  R(3, 9, 10, 21, robe); R(3, 13, 10, 3, 'rgba(0,0,0,.25)'); R(5, 30, 6, 2, '#3a2a1a');
  return c;
}
// jedna budova do mřížky 10 × 10 políček, ox = posun v políčkách
function drawBuilding(g, ox, b, stage) {
  const C = 16, cell = (t, x, y) => g.drawImage(texCanvas(seasonTex(t)), (ox + x) * C, y * C);
  if (stage >= 1) for (let x = 1; x <= 8; x++) cell('cobble', x, 8);
  [7, 6, 5].forEach((y, i) => { if (stage >= 2 + i) for (let x = 1; x <= 8; x++) cell(b.wall, x, y); });
  if (stage >= 3) { cell('doorB', 4, 7); cell('doorT', 4, 6); }
  if (stage >= 4) { cell('glass', 2, 6); cell('glass', 7, 6); }
  if (stage >= 5) for (let x = 0; x <= 9; x++) cell(b.roof, x, 4);
  if (stage >= 6) { for (let x = 1; x <= 8; x++) cell(b.roof, x, 3); for (let x = 3; x <= 6; x++) cell(b.roof, x, 2); if (b.chimney) { cell('brick', 7, 2); cell('brick', 7, 1); } }
  if (stage >= 7) g.drawImage(signCanvas(b.icon), (ox + 4) * C, 5 * C);
  if (stage >= 8) g.drawImage(villagerCanvas(b.robe), (ox + 6) * C, 9 * C - 32);
}
function skyAndGround(g, w, cols) {
  const C = 16, grd = g.createLinearGradient(0, 0, 0, 9 * C); grd.addColorStop(0, '#6fb2ea'); grd.addColorStop(1, '#c6e6f8');
  g.fillStyle = grd; g.fillRect(0, 0, w, 10 * C);
  for (let x = 0; x < cols; x++) g.drawImage(texCanvas('grass'), x * C, 9 * C);
}
function drawBuildingCard(cv, b) {
  cv.width = 160; cv.height = 160; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  skyAndGround(g, 160, 10); drawBuilding(g, 0, b, bldStage(b)); snowFx(g, 160, 160);
}
function drawVillage(cv) {
  cv.width = 160 * BUILDINGS.length; cv.height = 160; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  skyAndGround(g, cv.width, 10 * BUILDINGS.length);
  BUILDINGS.forEach((b, i) => drawBuilding(g, i * 10, b, bldStage(b)));
  snowFx(g, cv.width, cv.height);
}
// náhled na úvodní obrazovce: budovy ve dvou řadách (4 + 3), ať dlaždice není jen tenký proužek
function drawVillageThumb(cv) {
  const C = 16, W = 160 * 4, H = 448; cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const grd = g.createLinearGradient(0, 0, 0, H); grd.addColorStop(0, '#6fb2ea'); grd.addColorStop(1, '#c6e6f8');
  g.fillStyle = grd; g.fillRect(0, 0, W, H);
  [128, 288].forEach((y, row) => {
    g.save(); g.translate(row ? 80 : 0, y);
    for (let x = -5; x < 45; x++) g.drawImage(texCanvas('grass'), x * C, 9 * C);
    BUILDINGS.slice(row * 4, row * 4 + 4).forEach((b, i) => drawBuilding(g, i * 10, b, bldStage(b)));
    g.restore();
  });
  snowFx(g, W, H);
}
function openVillage() {
  G.speechId++; if (synth) synth.cancel();
  show('village');
  const done = BUILDINGS.filter(b => bldStage(b) >= 8).length;
  $('#villageCap').textContent = `Každé patro staví svou budovu. Za každý zvládnutý úkol kus stavby. Hotových budov: ${done} z ${BUILDINGS.length}.`;
  const grid = $('#villageGrid'); grid.innerHTML = '';
  BUILDINGS.forEach(b => {
    const { got, all } = bldProgress(b), st = bldStage(b);
    const el = document.createElement('button'); el.className = 'bld'; el.setAttribute('aria-label', b.name);
    const cv = document.createElement('canvas'); cv.className = 'px'; drawBuildingCard(cv, b); el.appendChild(cv);
    el.insertAdjacentHTML('beforeend', `<b>${b.name[0].toUpperCase() + b.name.slice(1)}</b><span>${LEVELS[b.lv].name}: ${got} z ${all}</span><span class="bar"><i style="width:${Math.round(got / all * 100)}%"></i></span>`);
    el.addEventListener('click', () => { audio(); speak(st >= 8 ? `Ahoj Adame! Já jsem ${b.who} a teď bydlím ${b.in}. Díky, že jsi postavil ${b.name}!` : `${b.name[0].toUpperCase() + b.name.slice(1)}. Zvládnuto ${got} z ${all} ${b.what}. Až zvládneš všechno, nastěhuje se sem ${b.who}.`); });
    grid.appendChild(el);
  });
}
// porovná stav budov s posledním uloženým; vrací, co přibylo (a připíše odměnu za dokončení)
function checkVillage(silent) {
  const out = [];
  BUILDINGS.forEach(b => {
    const st = bldStage(b), was = save.village[b.lv] || 0;
    if (st > was) { if (!silent) out.push({ b, st }); if (st >= 8 && !silent) save.emeralds += VILLAGE_BONUS; save.village[b.lv] = st; }
  });
  if (out.length || silent) persist();
  return out;
}

export { BLD_STAGES, BUILDINGS, VILLAGE_BONUS, bldProgress, bldStage, checkVillage, drawBuilding, drawBuildingCard, drawVillage, drawVillageThumb, openVillage, signCanvas, skyAndGround, villagerCanvas };
