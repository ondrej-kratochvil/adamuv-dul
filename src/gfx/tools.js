// Kreslení nástrojů (meč, sekera, lopata, motyka) a výběr, co postava drží v ruce
import { save } from '../save/save.ts';
import { px } from './textures.js';
import { MATERIALS, TOOLS } from '../content/tools.ts';
import { TIERS, enchanted, pickCanvas, tierOf } from './player.js';
import { pieceEnch } from '../rewards/enchant.js';

function toolCanvas(tool, mat, cls) {
  const c = document.createElement('canvas'); c.width = c.height = 16;
  c.className = ((cls || '') + ' px' + (enchanted() && pieceEnch(tool.id).length ? ' ench' : '')).trim();
  const g = c.getContext('2d'), m = MATERIALS[mat];
  const col = { H: m.head, D: m.dark, S: '#8a6440', K: '#4a3322' };
  tool.map.forEach((row, y) => [...row].forEach((ch, x) => { if (col[ch]) px(g, x, y, col[ch]); }));
  return c;
}
const toolStageOf = id => (save.gear && save.gear.stages[id]) || 0;
// co drží postava: krumpáč (podle kol), nebo vybraný nástroj v nejlepším odemčeném materiálu
function heldCanvas(cls) {
  const t = TOOLS.find(x => x.id === (save.gear && save.gear.held));
  return t ? toolCanvas(t, toolStageOf(t.id), cls) : pickCanvas(tierOf(save.total), cls);
}
// materiály krumpáče (odemyká se podle povedených kol, viz TIERS)
const pickMaterials = () => TIERS.map(t => ({ name: `${t.name} krumpáč`, at: t.at, tier: t }));

export { heldCanvas, pickMaterials, toolCanvas, toolStageOf };
