// Postava a krumpáče
import { save } from '../save/save.ts';
import { heldCanvas } from './tools.js';
import { px } from './textures.js';
import { pieceEnch } from '../rewards/enchant.js';

// oblečení postavy; položky s „at“ se odemknou po tolika odehraných kolech
const OUTFIT = {
  shirt: [
    { id: 'oranzove', name: 'oranžové tričko', c: '#d2552d', d: '#b0441f' },
    { id: 'modre', name: 'modré tričko', c: '#2f7fd1', d: '#2263a8' },
    { id: 'zelene', name: 'zelené tričko', c: '#3f9b3a', d: '#2f7a2b' },
    { id: 'cervene', name: 'červené tričko', c: '#c62f2f', d: '#9c2222' },
    { id: 'zlute', name: 'žluté tričko', c: '#e0b324', d: '#b88f15' },
    { id: 'fialove', name: 'fialové tričko', c: '#7d4bc2', d: '#603899' },
    { id: 'ruzove', name: 'růžové tričko', c: '#e06aa8', d: '#bf4f8a' },
    { id: 'cerne', name: 'černé tričko', c: '#2b2b2b', d: '#151515' },
    { id: 'kimono', name: 'kimono na karate', c: '#f4f4f0', d: '#d6d6cf', belt: '#f2f2f2' },
    { id: 'zelezne', name: 'železné brnění', c: '#d8d8d8', d: '#9a9a9a', armor: true, at: 6 },
    { id: 'diamantove', name: 'diamantové brnění', c: '#5de0e6', d: '#2aa9b3', armor: true, at: 14 },
    { id: 'netheritove', name: 'netheritové brnění', c: '#4a4245', d: '#2b2628', armor: true, at: 18 },
  ],
  pants: [
    { id: 'modre', name: 'modré kalhoty', c: '#34508f', d: '#2a4074' },
    { id: 'cerne', name: 'černé kalhoty', c: '#2e2e33', d: '#1b1b1f' },
    { id: 'hnede', name: 'hnědé kalhoty', c: '#7a5230', d: '#5e3f24' },
    { id: 'zelene', name: 'zelené kalhoty', c: '#4f6b2c', d: '#3c5221' },
    { id: 'sede', name: 'šedé kalhoty', c: '#8a8a8a', d: '#6c6c6c' },
    { id: 'kimono', name: 'kalhoty od kimona', c: '#f4f4f0', d: '#d6d6cf' },
    { id: 'zelezne', name: 'železné chrániče', c: '#d0d0d0', d: '#9a9a9a', armor: true, at: 8 },
    { id: 'diamantove', name: 'diamantové chrániče', c: '#5de0e6', d: '#2aa9b3', armor: true, at: 11 },
    { id: 'netheritove', name: 'netheritové chrániče', c: '#4a4245', d: '#2b2628', armor: true, at: 19 },
  ],
  shoes: [
    { id: 'sede', name: 'šedé boty', c: '#45403a', d: '#2e2a26' },
    { id: 'hnede', name: 'hnědé boty', c: '#6b4a31', d: '#4a3322' },
    { id: 'bile', name: 'bílé boty', c: '#ececec', d: '#b5b5b5' },
    { id: 'cervene', name: 'červené boty', c: '#c62f2f', d: '#9c2222' },
    { id: 'modre', name: 'modré boty', c: '#2f7fd1', d: '#2263a8' },
    { id: 'diamantove', name: 'diamantové boty', c: '#5de0e6', d: '#2aa9b3', metal: true, at: 4 },
    { id: 'netheritove', name: 'netheritové boty', c: '#4a4245', d: '#2b2628', metal: true, at: 16 },
  ],
  hat: [
    { id: 'nic', name: 'bez čepice' },
    { id: 'ksiltovka', name: 'červená kšiltovka', c: '#c62f2f', d: '#9c2222', kind: 'cap' },
    { id: 'modraksilt', name: 'modrá kšiltovka', c: '#2f7fd1', d: '#2263a8', kind: 'cap' },
    { id: 'zelezna', name: 'železná helma', c: '#d8d8d8', d: '#9a9a9a', kind: 'helmet', at: 3 },
    { id: 'zlata', name: 'zlatá helma', c: '#f2c94c', d: '#c9a227', kind: 'helmet', at: 10 },
    { id: 'diamantova', name: 'diamantová helma', c: '#5de0e6', d: '#2aa9b3', kind: 'helmet', at: 12 },
    { id: 'netheritova', name: 'netheritová helma', c: '#4a4245', d: '#2b2628', kind: 'helmet', at: 17 },
    { id: 'drak', name: 'dračí hlava', c: '#1a1a22', d: '#2e2e3e', kind: 'dragon', boss: 1 },
    { id: 'koruna', name: 'královská koruna', c: '#f2c94c', d: '#c9a227', kind: 'crown', streak: 7 },
  ],
  // očarování (enchant): fialový třpyt na brnění, helmách, kovových botách a krumpáči
  enchant: [
    { id: 'ne', name: 'bez očarování' },
    { id: 'ano', name: 'očarování', ench: 1 },
  ],
};
Object.entries(OUTFIT).forEach(([cat, list]) => list.forEach(it => { it.cat = cat; }));
const PIECE_OF = { hat: 'hat', shirt: 'shirt', pants: 'pants', shoes: 'shoes' };
const OUTFIT_CATS = [['shirt', 'Tričko'], ['pants', 'Kalhoty'], ['shoes', 'Boty'], ['hat', 'Čepice'], ['enchant', 'Očarování']];
const isMetal = it => !!(it.armor || it.metal || it.kind === 'helmet');
const enchanted = () => outfitItem('enchant').id === 'ano';
const unlocked = it => (!it.boss || (save.dragon || 0) >= it.boss) && (!it.at || save.total >= it.at) && (!it.streak || save.streak.best >= it.streak) && (!it.ench || save.ench.length >= it.ench);
function outfitItem(cat) { const it = OUTFIT[cat].find(x => x.id === save.outfit[cat]); return it && unlocked(it) ? it : OUTFIT[cat][0]; }
function playerCanvas() {
  const c = document.createElement('canvas'); c.width = 16; c.height = 32; c.className = 'body px';
  const g = c.getContext('2d');
  const sh = outfitItem('shirt'), pa = outfitItem('pants'), so = outfitItem('shoes'), ha = outfitItem('hat');
  const ench = enchanted();
  const gl = document.createElement('canvas'); gl.width = 16; gl.height = 32; gl.className = 'glint px';
  const gg = gl.getContext('2d'); gg.fillStyle = '#c58cff';
  let glow = false;
  // R kreslí; když kus oblečení je kovový a očarovaný, zapíše stejný obdélník i do vrstvy třpytu
  const R = (x, y, w, h, col, it) => { g.fillStyle = col; g.fillRect(x, y, w, h); if (it && ench && isMetal(it) && pieceEnch(PIECE_OF[it.cat] || '').length) { gg.fillRect(x, y, w, h); glow = true; } };
  const skin = '#d9a066', hair = '#4f321d';
  R(4, 0, 8, 8, skin); R(4, 0, 8, 2, hair); R(4, 2, 1, 2, hair); R(11, 2, 1, 2, hair); R(5, 2, 1, 1, hair);
  R(5, 4, 1, 1, '#ffffff'); R(6, 4, 1, 1, '#3b5ba0'); R(9, 4, 1, 1, '#3b5ba0'); R(10, 4, 1, 1, '#ffffff');
  R(7, 6, 2, 1, '#9b5a3c'); R(6, 5, 4, 1, '#c98f58');
  R(4, 8, 8, 12, sh.c, sh); R(4, 18, 8, 2, sh.d, sh);
  R(0, 8, 4, 4, sh.c, sh); R(12, 8, 4, 4, sh.c, sh); R(0, 12, 4, 8, skin); R(12, 12, 4, 8, skin);
  if (sh.armor) { R(4, 8, 8, 1, sh.d, sh); R(4, 13, 8, 1, sh.d, sh); R(7, 9, 2, 4, sh.d, sh); R(0, 11, 4, 1, sh.d, sh); R(12, 11, 4, 1, sh.d, sh); }
  else R(7, 8, 2, 2, skin);
  if (sh.belt) { R(6, 8, 1, 5, sh.d); R(9, 8, 1, 5, sh.d); R(4, 17, 8, 1, '#161616'); R(7, 18, 1, 2, '#161616'); } // klopy a černý pás
  R(4, 20, 8, 9, pa.c, pa); R(7, 22, 1, 7, pa.d, pa);
  if (pa.armor) { R(4, 20, 8, 1, pa.d, pa); R(4, 25, 3, 1, pa.d, pa); R(8, 25, 4, 1, pa.d, pa); }
  R(4, 29, 8, 3, so.c, so); R(4, 31, 8, 1, so.d, so); R(7, 29, 2, 3, 'rgba(0,0,0,.18)');
  if (ha.kind === 'cap') { R(4, 0, 8, 2, ha.c); R(3, 2, 10, 1, ha.d); R(7, 0, 2, 1, ha.d); }
  if (ha.kind === 'dragon') { R(3, 0, 10, 3, ha.c); R(3, 3, 1, 3, ha.c); R(12, 3, 1, 3, ha.c); R(4, 0, 1, 1, ha.d); R(11, 0, 1, 1, ha.d); R(5, 2, 2, 1, '#d070ff'); R(9, 2, 2, 1, '#d070ff'); }
  if (ha.kind === 'crown') { R(4, 1, 8, 2, ha.c); R(4, 0, 1, 1, ha.c); R(7, 0, 2, 1, ha.c); R(11, 0, 1, 1, ha.c); R(7, 1, 2, 1, '#c62f2f'); R(4, 2, 8, 1, ha.d); }
  if (ha.kind === 'helmet') { R(3, 0, 10, 3, ha.c, ha); R(3, 3, 1, 3, ha.c, ha); R(12, 3, 1, 3, ha.c, ha); R(3, 2, 10, 1, ha.d, ha); R(3, 5, 1, 1, ha.d, ha); R(12, 5, 1, 1, ha.d, ha); R(4, 0, 8, 1, 'rgba(255,255,255,.35)'); }
  c.glint = glow ? gl : null;
  return c;
}
// malé ikonky do šatníku a do konce kola
function outfitIcon(cat, it) {
  const c = document.createElement('canvas'); c.width = c.height = 16; c.className = 'px';
  const g = c.getContext('2d');
  const R = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  if (cat === 'shirt' && it.belt) { R(1, 3, 14, 5, '#161616'); R(3, 3, 10, 12, '#161616'); R(2, 4, 12, 3, it.c); R(4, 4, 8, 10, it.c); R(6, 4, 1, 6, it.d); R(9, 4, 1, 6, it.d); R(4, 11, 8, 1, '#161616'); R(7, 12, 1, 2, '#161616'); return c; }
  if (cat === 'shirt') { R(1, 3, 14, 5, '#161616'); R(3, 3, 10, 12, '#161616'); R(2, 4, 12, 3, it.c); R(4, 4, 8, 10, it.c); R(4, 13, 8, 1, it.d); if (it.armor) { R(4, 8, 8, 1, it.d); R(7, 4, 2, 4, it.d); } else R(7, 4, 2, 1, '#d9a066'); }
  if (cat === 'pants') { R(3, 1, 10, 15, '#161616'); R(4, 2, 8, 4, it.c); R(4, 6, 3, 9, it.c); R(9, 6, 3, 9, it.c); g.clearRect(7, 7, 2, 9); R(4, 2, 8, 1, it.d); if (it.armor) { R(4, 9, 3, 1, it.d); R(9, 9, 3, 1, it.d); } }
  if (cat === 'shoes') { R(1, 7, 6, 7, '#161616'); R(9, 7, 6, 7, '#161616'); R(2, 8, 4, 5, it.c); R(10, 8, 4, 5, it.c); R(2, 12, 4, 1, it.d); R(10, 12, 4, 1, it.d); }
  if (cat === 'enchant') {
    const on = it.id === 'ano';
    R(2, 2, 12, 13, '#161616'); R(3, 3, 10, 11, on ? '#7d4bc2' : '#8a5a2e'); R(3, 3, 2, 11, on ? '#5a3290' : '#6b4424'); R(6, 5, 5, 1, '#e8dcc0'); R(6, 7, 5, 1, '#e8dcc0');
    if (on) [[7, 10], [10, 9], [12, 3], [1, 6], [9, 12], [5, 1]].forEach(([x, y]) => R(x, y, 1, 1, '#f1dcff'));
  }
  if (cat === 'hat') {
    if (!it.kind) { R(4, 4, 8, 8, '#d9a066'); R(4, 4, 8, 2, '#4f321d'); R(5, 8, 1, 1, '#3b5ba0'); R(10, 8, 1, 1, '#3b5ba0'); R(7, 10, 2, 1, '#9b5a3c'); }
    if (it.kind === 'cap') { R(3, 5, 10, 6, '#161616'); R(4, 6, 8, 4, it.c); R(2, 10, 12, 3, '#161616'); R(3, 10, 10, 2, it.d); }
    if (it.kind === 'dragon') { R(2, 4, 12, 9, '#161616'); R(3, 5, 10, 7, it.c); R(3, 3, 2, 2, it.d); R(11, 3, 2, 2, it.d); R(5, 7, 2, 1, '#d070ff'); R(9, 7, 2, 1, '#d070ff'); R(5, 10, 6, 1, '#4a4a5a'); }
    if (it.kind === 'crown') { R(3, 7, 10, 5, it.c); R(3, 4, 2, 3, it.c); R(7, 3, 2, 4, it.c); R(11, 4, 2, 3, it.c); R(7, 8, 2, 2, '#c62f2f'); R(4, 9, 1, 1, '#2f7fd1'); R(11, 9, 1, 1, '#2f7fd1'); R(3, 11, 10, 1, it.d); }
    if (it.kind === 'helmet') { R(2, 3, 12, 11, '#161616'); R(3, 4, 10, 4, it.c); R(3, 8, 2, 5, it.c); R(11, 8, 2, 5, it.c); g.clearRect(5, 8, 6, 6); R(3, 7, 10, 1, it.d); }
  }
  return c;
}
const TIERS = [
  { at: 0, name: 'dřevěný', taps: 3, head: '#a37f4c', dark: '#6b4a31' },
  { at: 2, name: 'kamenný', taps: 2, head: '#9a9a9a', dark: '#5c5c5c' },
  { at: 5, name: 'železný', taps: 2, head: '#e2e2e2', dark: '#8f8f8f' },
  { at: 9, name: 'diamantový', taps: 1, head: '#5de0e6', dark: '#1f8f99' },
  { at: 20, name: 'netheritový', taps: 1, head: '#4a4245', dark: '#2b2628' },
];
function tierOf(total) { let t = TIERS[0]; TIERS.forEach(x => { if (total >= x.at) t = x; }); return t; }
const PICK_MAP = [
  '................',
  '....DDDDD.......',
  '...DHHHHHDD.....',
  '....DDDDHHHD....',
  '........KSHHD...',
  '.......KSK.HD...',
  '......KSK..HHD..',
  '.....KSK...DHD..',
  '....KSK.....HD..',
  '...KSK......HD..',
  '..KSK.......DD..',
  '.KSK............',
  '.KK.............',
  '................',
  '................',
  '................',
];
function pickCanvas(tier, cls) {
  const c = document.createElement('canvas'); c.width = c.height = 16; c.className = ((cls || '') + ' px' + (enchanted() && pieceEnch('pick').length ? ' ench' : '')).trim();
  const g = c.getContext('2d');
  const col = { H: tier.head, D: tier.dark, S: '#8a6440', K: '#4a3322' };
  PICK_MAP.forEach((row, y) => [...row].forEach((ch, x) => { if (col[ch]) px(g, x, y, col[ch]); }));
  return c;
}
function mountPlayer(el) {
  el.innerHTML = '';
  const body = playerCanvas(); el.appendChild(body); if (body.glint) el.appendChild(body.glint);
  el.appendChild(heldCanvas('tool'));
}

export { OUTFIT, OUTFIT_CATS, PICK_MAP, PIECE_OF, TIERS, enchanted, isMetal, mountPlayer, outfitIcon, outfitItem, pickCanvas, playerCanvas, tierOf, unlocked };
