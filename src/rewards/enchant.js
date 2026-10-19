// Očarování za zvládnuté úkoly
import { persist, save } from '../save/save.js';
import { outfitIcon, outfitItem, pickCanvas, tierOf } from '../gfx/player.js';
import { speak } from '../audio/speech.js';
import { sfx } from '../audio/sfx.js';
import { LETTERS, SYLL } from '../content/letters.js';
import { range } from '../levels/math.js';
import { GLYPHS } from '../levels/writing.js';
import { WORDS } from '../content/words.js';
import { PIC_WORDS } from '../levels/reading.js';
import { mastery } from '../app/stats.js';
import { protectionLevels, stuckMs } from '../game/round.js';

// Pravidlo: plné vybavení (všechna očarování na maximum) má Adam až ve chvíli, kdy zvládne všechno, co hra obsahuje.
// Prahy se počítají z celkového počtu úkolů, takže když přibude obsah, přibudou i odměny. Získané odměny se nikdy neberou.
const MASTERY_SETS = () => ({
  letters: LETTERS, syllables: SYLL, words: WORDS, reading: PIC_WORDS, writing: Object.keys(GLYPHS),
  numbers: [...range(0, 20), ...range(30, 100, 10)].map(String),
});
const MATH_MAX = 30; // příkladů je nekonečně, počítá se nejvýš 30 různých zvládnutých
function masteryPoints() {
  let pts = 0, max = 0;
  for (const [lv, items] of Object.entries(MASTERY_SETS())) { max += items.length; pts += items.filter(it => mastery(save.stats[lv + ':' + it]) === 'good').length; }
  const m = Object.keys(save.stats).filter(k => k.startsWith('math:') && mastery(save.stats[k]) === 'good').length;
  return { pts: pts + Math.min(MATH_MAX, m), max: max + MATH_MAX };
}
const PIECES = [['pick', 'krumpáč'], ['hat', 'helma'], ['shirt', 'brnění'], ['pants', 'chrániče'], ['shoes', 'boty']];
const ENCHANTS = {
  pick: [['Efektivita', 5], ['Štěstí', 3], ['Nezlomnost', 3]],
  hat: [['Ochrana', 4], ['Nezlomnost', 3], ['Dýchání', 3], ['Afinita k vodě', 1]],
  shirt: [['Ochrana', 4], ['Nezlomnost', 3], ['Trny', 3]],
  pants: [['Ochrana', 4], ['Nezlomnost', 3], ['Rychlé plížení', 3]],
  shoes: [['Ochrana', 4], ['Nezlomnost', 3], ['Tichý pád', 4], ['Rychlost v hlubinách', 3]],
};
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V'];
// pořadí odměn: postupně všem kusům po jedné úrovni, Opravování (nejvzácnější) až na úplný konec
const ENCH_ORDER = (() => {
  const out = [];
  for (let lvl = 1; lvl <= 5; lvl++) PIECES.forEach(([pc]) => ENCHANTS[pc].forEach(([name, max]) => { if (lvl <= max) out.push({ pc, name, lvl, key: `${pc}:${name}:${lvl}` }); }));
  PIECES.forEach(([pc]) => out.push({ pc, name: 'Opravování', lvl: 1, key: `${pc}:Opravování:1` }));
  return out;
})();
const enchNeed = i => Math.ceil((i + 1) / ENCH_ORDER.length * masteryPoints().max);
// vrátí nově získaná očarování
function checkEnchants() {
  const { pts, max } = masteryPoints(), got = [];
  ENCH_ORDER.forEach((e, i) => { if (!save.ench.includes(e.key) && pts >= Math.ceil((i + 1) / ENCH_ORDER.length * max)) { save.ench.push(e.key); got.push(e); } });
  if (got.length) persist();
  return got;
}
// nejvyšší získaná úroveň každého očarování daného kusu
function pieceEnch(pc) {
  const best = {};
  save.ench.filter(k => k.startsWith(pc + ':')).forEach(k => { const [, name, l] = k.split(':'); best[name] = Math.max(best[name] || 0, +l); });
  return Object.entries(best);
}
const enchLevel = (pc, name) => (pieceEnch(pc).find(([n]) => n === name) || [, 0])[1];
const pieceName = pc => PIECES.find(p => p[0] === pc)[1];
// Štěstí na krumpáči: šance 15 % za úroveň na smaragd navíc
function luckBonus() { const l = enchLevel('pick', 'Štěstí'); if (l && Math.random() < l * .15) { sfx.sparkle(); return 1; } return 0; }
function nextEnchInfo() {
  const { pts } = masteryPoints(), i = ENCH_ORDER.findIndex(e => !save.ench.includes(e.key));
  return i < 0 ? null : { e: ENCH_ORDER[i], left: Math.max(0, enchNeed(i) - pts) };
}
function renderEnchBook(box) {
  const { pts, max } = masteryPoints(), nx = nextEnchInfo();
  box.insertAdjacentHTML('beforeend', `<div class="book-head"><b>Kniha očarování</b><span>Zvládnuto ${pts} z ${max} úkolů. ${nx ? `Další očarování (${pieceName(nx.e.pc)}: ${nx.e.name} ${ROMAN[nx.e.lvl]}) za ${nx.left} ${nx.left === 1 ? 'zvládnutý úkol' : nx.left >= 2 && nx.left <= 4 ? 'zvládnuté úkoly' : 'zvládnutých úkolů'}.` : 'Máš všechno na maximum!'}</span><span>Krumpáč se po chybě zasekne na ${(stuckMs() / 1000).toFixed(2).replace(/0$/, '').replace('.', ',')} s (Ochrana ${protectionLevels()} z 16).</span><span class="book-bar"><i style="width:${Math.round(save.ench.length / ENCH_ORDER.length * 100)}%"></i></span></div>`);
  PIECES.forEach(([pc, label]) => {
    const row = document.createElement('div'); row.className = 'book-row';
    const ic = pc === 'pick' ? pickCanvas(tierOf(save.total)) : outfitIcon(pc, outfitItem(pc)); ic.classList.add('book-icon'); row.appendChild(ic);
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
