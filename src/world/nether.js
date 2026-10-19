// Portál do Netheru: obsidián za každý odehraný den
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { save } from '../save/save.ts';
import { texCanvas } from '../gfx/textures.js';
import { snowFx } from './house.js';
import { speak, synth } from '../audio/speech.js';
import { show } from '../ui/screens.js';
import { fitCanvas, spr } from './farm.js';
import { setBtn } from '../ui/icons.js';

// Pravidelnost: každý den s povedeným kolem = 1 obsidián (nikdy se nebere). 10 obsidiánů = rám portálu, pak se zapálí.
// Každý další den přidá kus Netheru (NETHER_STAGES).
const PORTAL_NEED = 10;
const NETHER_STAGES = ['lávové jezero', 'netherová bradavice', 'strider na lávě', 'karmínový strom', 'zkroucený strom', 'kamarád piglin', 'ghast na obloze', 'hradba bašty', 'věž bašty', 'poklad bašty', 'blaze', 'netherová pevnost'];
const portalLit = () => save.obsidian >= PORTAL_NEED;
const netherStage = () => Math.max(0, Math.min(NETHER_STAGES.length, save.obsidian - PORTAL_NEED));
// pořadí, v jakém se obsidián skládá do rámu 4 × 5 (spodek, boky, vršek)
const FRAME = [[1, 10], [2, 10], [0, 9], [3, 9], [0, 8], [3, 8], [0, 7], [3, 7], [1, 6], [2, 6]];
function drawNether(cv) {
  const C = 16, W = 24, H = 14; cv.width = W * C; cv.height = H * C;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const cell = (t, x, y) => g.drawImage(texCanvas(t), x * C, y * C);
  const at = (name, x, row, scale = 1) => { const sp = spr(name); g.drawImage(sp, x * C, (row + 1) * C - sp.height * scale, sp.width * scale, sp.height * scale); };
  if (!portalLit()) {
    // na zemi: rám portálu se skládá z obsidiánu
    const grd = g.createLinearGradient(0, 0, 0, 11 * C); grd.addColorStop(0, '#6fb2ea'); grd.addColorStop(1, '#c6e6f8'); g.fillStyle = grd; g.fillRect(0, 0, cv.width, cv.height);
    g.fillStyle = '#ffffff'; g.fillRect(3 * C, 1.5 * C, 40, 10); g.fillRect(15 * C, C, 34, 8);
    for (let x = 0; x < W; x++) { cell('grass', x, 11); cell('dirt', x, 12); cell('dirt', x, 13); }
    FRAME.slice(0, save.obsidian).forEach(([dx, y]) => cell('obsidian', 10 + dx, y));
    g.globalAlpha = .25; FRAME.slice(save.obsidian).forEach(([dx, y]) => cell('obsidian', 10 + dx, y)); g.globalAlpha = 1;
    snowFx(g, cv.width, cv.height);
    return;
  }
  const ns = netherStage();
  const grd = g.createLinearGradient(0, 0, 0, 11 * C); grd.addColorStop(0, '#2a0a0e'); grd.addColorStop(1, '#7a2418'); g.fillStyle = grd; g.fillRect(0, 0, cv.width, cv.height);
  for (let x = 0; x < W; x++) { cell('netherrack', x, 11); cell('netherrack', x, 12); cell('netherrack', x, 13); }
  // zapálený portál
  FRAME.forEach(([dx, y]) => cell('obsidian', 18 + dx, y)); for (let y = 7; y <= 9; y++) { cell('portal', 19, y); cell('portal', 20, y); }
  if (ns >= 1) for (let x = 1; x <= 5; x++) cell('lava', x, 11);
  if (ns >= 2) { cell('soulsand', 7, 11); cell('soulsand', 8, 11); at('wart', 7, 10); at('wart', 8, 10); }
  if (ns >= 3) at('strider', 3, 10);
  const tree = (x, stem, cap) => { for (let y = 8; y <= 10; y++) cell(stem, x, y); for (let y = 6; y <= 7; y++) for (let dx = -1; dx <= 1; dx++) cell(cap, x + dx, y); cell(cap, x, 5); };
  if (ns >= 4) tree(10, 'crimsonStem', 'crimsonCap');
  if (ns >= 5) tree(14, 'warpedStem', 'warpedCap');
  if (ns >= 6) at('piglin', 16, 10);
  if (ns >= 7) at('ghast', 6, 4, 2);
  if (ns >= 8) for (let x = 0; x <= 3; x++) { cell('blackstone', x, 9); cell('blackstone', x, 10); }
  if (ns >= 9) for (let y = 5; y <= 8; y++) { cell('blackstone', 0, y); cell('blackstone', 1, y); }
  if (ns >= 10) cell('goldBlock', 2, 8);
  if (ns >= 11) at('blaze', 12, 3);
  if (ns >= 12) for (let x = 21; x <= 23; x++) for (let y = 7; y <= 10; y++) cell('netherBrick', x, y);
}
function openNether() {
  G.speechId++; if (synth) synth.cancel();
  show('nether'); $('#nether').classList.toggle('lit', portalLit()); drawNether($('#netherBig')); fitCanvas($('#netherBig'));
  const ns = netherStage(), btn = $('#btnNetherMine');
  let cap;
  if (!portalLit()) cap = `Obsidián na portál: ${save.obsidian} z ${PORTAL_NEED}. Každý den, kdy se ti povede aspoň jedno kolo, dostaneš jeden.`;
  else cap = ns < NETHER_STAGES.length ? `Portál hoří! Každý další den hraní přibude v Netheru něco nového (${ns} z ${NETHER_STAGES.length}).` : 'Celý Nether je tvůj, i s pevností!';
  $('#netherCap').textContent = cap;
  btn.hidden = !portalLit();
  if (portalLit()) { setBtn(btn, 'next', save.netherMine ? 'Kopu v Netheru' : 'Kopat v Netheru'); btn.setAttribute('aria-pressed', String(!!save.netherMine)); }
  speak(cap);
}
// kopání v Netheru: kostky a pozadí z netherových bloků
const NETHER_TEX = { dirt: 'netherrack', stone: 'blackstone', ironOre: 'quartzOre', goldOre: 'netherGoldOre', lapisOre: 'blackstone', redstoneOre: 'netherrack', diamondOre: 'ancientDebris' };
const mineTex = t => (save.netherMine && portalLit() && NETHER_TEX[t]) || t;

export { FRAME, NETHER_STAGES, NETHER_TEX, PORTAL_NEED, drawNether, mineTex, netherStage, openNether, portalLit };
