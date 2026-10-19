// Stavění: plocha, kam Adam staví z kostek, které sám vykopal (logika v logic/build.ts)
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { tex, texCanvas } from '../gfx/textures.js';
import { speak, synth } from '../audio/speech.js';
import { audio, sfx, tone } from '../audio/sfx.js';
import { show } from '../ui/screens.js';
import { dogCanvas, hasDog } from './farm.js';
import { seasonTex } from './house.js';
import { BUILD_UNLOCK, PLOT_H, PLOT_W, tapCell, tapGround } from '../logic/build.ts';
import { G } from '../core/state.js';

const C = 16, ROWS = PLOT_H + 2; // plocha + tráva + hlína
const BLOCK_NAMES = {
  dirt: 'hlína', stone: 'kámen', ironOre: 'železná ruda', goldOre: 'zlatá ruda', lapisOre: 'lapis', diamondOre: 'diamantová ruda',
  redstoneOre: 'redstone', endStone: 'endový kámen', netherrack: 'netherrack', blackstone: 'černý kámen', quartzOre: 'křemenná ruda',
  netherGoldOre: 'zlato z Netheru', soulsand: 'písek duší', ancientDebris: 'prastará troska',
};
const blockName = t => BLOCK_NAMES[t] || 'kostka';
let selected = null, erase = false;

const buildOpen = () => save.total >= BUILD_UNLOCK;

function drawBuild(cv) {
  cv.width = PLOT_W * C; cv.height = ROWS * C;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const grd = g.createLinearGradient(0, 0, 0, PLOT_H * C); grd.addColorStop(0, '#6fb2ea'); grd.addColorStop(1, '#c6e6f8');
  g.fillStyle = grd; g.fillRect(0, 0, cv.width, cv.height);
  for (let x = 0; x < PLOT_W; x++) { g.drawImage(texCanvas(seasonTex('grass')), x * C, PLOT_H * C); g.drawImage(texCanvas('dirt'), x * C, (PLOT_H + 1) * C); }
  for (const [k, t] of Object.entries(save.build.placed)) { const [x, y] = k.split(',').map(Number); g.drawImage(texCanvas(t), x * C, y * C); }
  if (hasDog()) g.drawImage(dogCanvas(), (PLOT_W - 1) * C, PLOT_H * C - 12);
}
// mřížka jen na obrazovce stavění, ať Adam vidí, kam kostka padne
function drawGrid(cv) {
  const g = cv.getContext('2d'); g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1;
  for (let x = 1; x < PLOT_W; x++) { g.beginPath(); g.moveTo(x * C + .5, 0); g.lineTo(x * C + .5, PLOT_H * C); g.stroke(); }
  for (let y = 1; y < PLOT_H; y++) { g.beginPath(); g.moveTo(0, y * C + .5); g.lineTo(PLOT_W * C, y * C + .5); g.stroke(); }
}
function fitBuild() {
  const cv = $('#buildBig'); const box = cv.parentElement;
  requestAnimationFrame(() => { const s = Math.max(.5, Math.floor(Math.min(box.clientWidth / cv.width, (box.clientHeight - 8) / cv.height) * 4) / 4); cv.style.width = cv.width * s + 'px'; cv.style.height = cv.height * s + 'px'; });
}
function renderBuild() {
  const cv = $('#buildBig'); drawBuild(cv); drawGrid(cv);
  const inv = $('#buildInv'); inv.innerHTML = '';
  const types = Object.keys(save.build.blocks).filter(t => save.build.blocks[t] > 0 || selected === t);
  if (selected && !(save.build.blocks[selected] > 0) && !Object.values(save.build.placed).includes(selected)) selected = null;
  const pickaxe = document.createElement('button'); pickaxe.className = 'inv-slot' + (erase ? ' on' : ''); pickaxe.setAttribute('aria-label', 'Krumpáč: vzít kostku zpět');
  pickaxe.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="#4a3322" d="M3 13h2v-2h2V9h2V7h1v1h1v2h-1v1H9v2H7v2H5v1H3z"/><path fill="#9a9a9a" d="M4 2h6v1h2v1h1v1h1v4h-1V7h-1V6h-1V5h-1V4H8V3H4z"/></svg><b>zpět</b>';
  pickaxe.addEventListener('click', () => { audio(); erase = !erase; renderBuild(); speak(erase ? 'Krumpáč. Klepni na kostku a vezmeš ji zpátky.' : 'Stavíš.'); });
  inv.appendChild(pickaxe);
  types.forEach(t => {
    const b = document.createElement('button'); b.className = 'inv-slot' + (!erase && selected === t ? ' on' : ''); b.setAttribute('aria-label', `${blockName(t)}, ${save.build.blocks[t]}`);
    b.innerHTML = `<span class="inv-tex" style="background-image:url(${tex(t)})"></span><b>${save.build.blocks[t]}</b>`;
    b.addEventListener('click', () => { audio(); selected = t; erase = false; renderBuild(); speak(blockName(t)); });
    inv.appendChild(b);
  });
  if (!types.length) inv.insertAdjacentHTML('beforeend', '<p class="inv-empty">Kostky dostaneš za kopání. Každá vykopaná kostka přijde sem.</p>');
}
function openBuild() {
  audio(); G.speechId++; if (synth) synth.cancel();
  if (!buildOpen()) { speak('Stavět budeš moct, až dostavíš dům. Kostky, které vykopeš, si zatím schovávám.'); return; }
  if (!selected) selected = Object.keys(save.build.blocks).find(t => save.build.blocks[t] > 0) || null;
  show('build'); renderBuild(); fitBuild();
  speak('Stavění. Vyber kostku dole a klepni na trávu nebo tam, kam ji chceš dát. Krumpáčem ji vezmeš zpátky.');
}
function tapPlot(e) {
  const cv = $('#buildBig'), r = cv.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * PLOT_W), y = Math.floor((e.clientY - r.top) / r.height * ROWS);
  const res = y >= PLOT_H ? tapGround(save.build, x, selected, erase) : tapCell(save.build, x, y, selected, erase);
  if (res === 'none') {
    // nikdy potichu: vždy říct proč
    sfx.nope();
    if (erase) speak('Tady žádná kostka není.');
    else if (!selected) speak('Nejdřív dole vyber kostku.');
    else if (!(save.build.blocks[selected] > 0)) speak('Tahle kostka ti došla. Vykopej další.');
    else speak('Tady už je plno, až do nebe.');
    return;
  }
  persist(); audio();
  if (res === 'removed') tone(520, 0, .06, 'square', .05); else { tone(330, 0, .05, 'square', .06); tone(220, .04, .06, 'square', .05); }
  renderBuild();
}

export { BLOCK_NAMES, blockName, buildOpen, drawBuild, fitBuild, openBuild, renderBuild, tapPlot };
