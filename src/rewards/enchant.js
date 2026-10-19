// Očarování za zvládnuté úkoly
import { persist, save } from '../save/save.ts';
import { outfitIcon, outfitItem, pickCanvas, tierOf } from '../gfx/player.js';
import { speak } from '../audio/speech.js';
import { sfx } from '../audio/sfx.js';
import { MASTERY_SETS, MATH_MAX, masteryPoints as masteryPointsL } from '../logic/mastery.ts';
import { ENCHANTS, ENCH_ORDER, PIECES, ROMAN } from '../content/enchants.ts';
import { TOOLS } from '../content/tools.ts';
import { toolCanvas, toolStageOf } from '../gfx/tools.js';
import { enchantNeed, newEnchants, nextEnchant, pieceEnchants } from '../logic/rewards.ts';
import { protectionLevels, stuckMs } from '../game/round.js';

// Pravidlo: plné vybavení (všechna očarování na maximum) má Adam až ve chvíli, kdy zvládne všechno, co hra obsahuje.
// Výpočet je v logic/mastery.ts a logic/rewards.ts. Získané odměny se nikdy neberou.
function masteryPoints() { return masteryPointsL(save.stats); }
function enchNeed(i) { return enchantNeed(i, masteryPoints().max); }
// vrátí nově získaná očarování
function checkEnchants() {
  const { pts, max } = masteryPoints(), got = newEnchants(pts, max, save.ench);
  if (got.length) { got.forEach(e => save.ench.push(e.key)); persist(); }
  return got;
}
function pieceEnch(pc) { return Object.entries(pieceEnchants(save.ench, pc)); }
function enchLevel(pc, name) { return pieceEnchants(save.ench, pc)[name] || 0; }
function pieceName(pc) { return PIECES.find(p => p[0] === pc)[1]; }
// Štěstí na krumpáči: šance 15 % za úroveň na smaragd navíc
function luckBonus() { const l = enchLevel('pick', 'Štěstí'); if (l && Math.random() < l * .15) { sfx.sparkle(); return 1; } return 0; }
function nextEnchInfo() {
  const { pts, max } = masteryPoints();
  return nextEnchant(pts, max, save.ench);
}
function renderEnchBook(box) {
  const { pts, max } = masteryPoints(), nx = nextEnchInfo();
  box.insertAdjacentHTML('beforeend', `<div class="book-head"><b>Kniha očarování</b><span>Zvládnuto ${pts} z ${max} úkolů. ${nx ? `Další očarování (${pieceName(nx.e.pc)}: ${nx.e.name} ${ROMAN[nx.e.lvl]}) za ${nx.left} ${nx.left === 1 ? 'zvládnutý úkol' : nx.left >= 2 && nx.left <= 4 ? 'zvládnuté úkoly' : 'zvládnutých úkolů'}.` : 'Máš všechno na maximum!'}</span><span>Krumpáč se po chybě zasekne na ${(stuckMs() / 1000).toFixed(2).replace(/0$/, '').replace('.', ',')} s (Ochrana ${protectionLevels()} z 16).</span><span class="book-bar"><i style="width:${Math.round(save.ench.length / ENCH_ORDER.length * 100)}%"></i></span></div>`);
  PIECES.forEach(([pc, label]) => {
    const row = document.createElement('div'); row.className = 'book-row';
    const tool = TOOLS.find(t => t.id === pc);
    const ic = pc === 'pick' ? pickCanvas(tierOf(save.total)) : tool ? toolCanvas(tool, toolStageOf(pc)) : outfitIcon(pc, outfitItem(pc)); ic.classList.add('book-icon'); row.appendChild(ic);
    const list = document.createElement('div'); list.className = 'book-list';
    list.insertAdjacentHTML('beforeend', `<b>${label[0].toUpperCase() + label.slice(1)}</b>`);
    [...ENCHANTS[pc], ['Opravování', 1]].forEach(([name, mx]) => {
      const l = enchLevel(pc, name);
      const chip = document.createElement('button'); chip.className = 'ench-chip' + (l ? ' on' : ''); chip.textContent = `${name} ${l ? ROMAN[l] : ''}${l < mx ? ` / ${ROMAN[mx]}` : ''}`.replace(/\s+/g, ' ').trim();
      const what = name === 'Ochrana' ? ' Ochrana zkracuje, jak dlouho se krumpáč po chybě zasekne.' : name === 'Štěstí' ? ' Štěstí ti občas dá smaragd navíc.' : '';
      chip.addEventListener('click', () => speak((l ? `${label}: ${name} ${l}${l < mx ? `, nejvíc ${mx}` : ', to je maximum'}.` : `${name} zatím nemáš. Zvládni další úkoly.`) + what));
      list.appendChild(chip);
    });
    row.appendChild(list); box.appendChild(row);
  });
}

export { ENCHANTS, ENCH_ORDER, MASTERY_SETS, MATH_MAX, PIECES, ROMAN, checkEnchants, enchLevel, enchNeed, luckBonus, masteryPoints, nextEnchInfo, pieceEnch, pieceName, renderEnchBook };
