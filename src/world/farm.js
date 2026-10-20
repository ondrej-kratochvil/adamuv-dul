// Farma, pes a smaragdy
import { G } from '../core/state.js';
import { $, REDUCED } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { texCanvas } from '../gfx/textures.js';
import { seasonTex, snowFx } from './house.js';
import { speak, synth } from '../audio/speech.js';
import { audio, sfx } from '../audio/sfx.js';
import { LOCK_SVG, show } from '../ui/screens.js';
import { TOTEM_PRICE } from '../rewards/streak.js';
import { dogName } from './family.js';
import { BABIES, babyCanvas } from './babies.js';
import { retrigger } from '../game/round.js';
import { masteryPoints } from '../rewards/enchant.js';
import { rareLeft } from '../logic/rewards.ts';
import { PIC } from '../content/pictures.ts';

const FARM_START = 12; // farma roste po dostavění domu (12 dílů)
const FARM_STAGES = ['pes', 'ohrada', 'mrkev', 'studna', 'pšenice', 'kuřata', 'ovce', 'kráva', 'strom s úlem', 'strašák'];
const farmStage = () => Math.max(0, Math.min(FARM_STAGES.length, save.total - FARM_START));
const hasDog = () => farmStage() >= 1;
const PERFECT_BONUS = 3, TREAT_PRICE = 2;
const COLLARS = [
  { id: 'cerveny', name: 'červený obojek', c: '#c62f2f', price: 0 },
  { id: 'modry', name: 'modrý obojek', c: '#2f7fd1', price: 5 },
  { id: 'zeleny', name: 'zelený obojek', c: '#3f9b3a', price: 5 },
  { id: 'zlaty', name: 'zlatý obojek', c: '#f2c94c', price: 10 },
  { id: 'diamantovy', name: 'diamantový obojek', c: '#5de0e6', price: 15 },
];
const DECOR = [
  { id: 'slunecnice', name: 'slunečnice', price: 6, sprite: 'sunflower' },
  { id: 'dyne', name: 'dýně', price: 6, sprite: 'pumpkin' },
  { id: 'prase', name: 'prasátko', price: 12, sprite: 'pig' },
  { id: 'kocka', name: 'kočka', price: 15, sprite: 'cat' },
  // z Adamova světa (vojáci a tanky, deti.md)
  { id: 'vojacek', name: 'vojáček', price: 12, sprite: 'soldier', him: true },
  { id: 'tank', name: 'tank', price: 25, sprite: 'tank', him: true },
];
// vzácné věci: smaragdy + podíl zvládnutých úkolů (need = podíl ze všech úkolů, rareNeed v logic/rewards.ts)
const RARE = [
  { id: 'lama', name: 'lama', price: 30, need: .15, sprite: 'lama' },
  { id: 'kun', name: 'kůň', price: 45, need: .3, sprite: 'horse', him: true },
  { id: 'helikoptera', name: 'helikoptéra', price: 70, need: .5, sprite: 'heli' },
  { id: 'zlatavez', name: 'zlatá věž', price: 100, need: .75, sprite: 'goldtower' },
];
const gemWord = n => n === 1 ? 'smaragd' : n >= 2 && n <= 4 ? 'smaragdy' : 'smaragdů';
// pixelové obrázky [šířka, výška, kreslení]; R(x, y, w, h, barva)
const SPRITES = {
  emerald: [16, 16, R => { const G = '#2fbf5a'; R(6, 1, 4, 1, G); R(4, 2, 8, 2, G); R(3, 4, 10, 6, G); R(4, 10, 8, 2, G); R(6, 12, 4, 2, G); R(9, 7, 3, 4, '#1f9446'); R(7, 12, 3, 1, '#1f9446'); R(5, 3, 2, 3, '#a6f5bb'); R(4, 5, 1, 3, '#a6f5bb'); }],
  bone: [16, 16, R => { const B = '#efe9dc'; R(4, 7, 8, 2, B); R(2, 5, 3, 3, B); R(2, 8, 3, 3, B); R(11, 5, 3, 3, B); R(11, 8, 3, 3, B); R(4, 9, 8, 1, '#cfc7b6'); }],
  fence: [16, 16, R => { const F = '#a37f4c', D = '#7c5f37'; R(0, 5, 16, 2, F); R(0, 10, 16, 2, F); R(0, 6, 16, 1, D); R(0, 11, 16, 1, D); R(6, 1, 4, 15, F); R(9, 1, 1, 15, D); }],
  carrot: [16, 16, R => { [[2, 9], [6, 7], [10, 9], [13, 10]].forEach(([x, y], i) => { R(x, y, 2, 14 - y, i % 2 ? '#3f8a2a' : '#4c9c33'); R(x, 14, 2, 2, '#e8862a'); }); }],
  wheat: [16, 16, R => { [1, 4, 7, 10, 13].forEach((x, i) => { R(x, 6 + (i % 2), 1, 10, '#c9a83c'); R(x, 2 + (i % 2), 2, 4, '#e8c860'); R(x + 1, 4 + (i % 2), 1, 2, '#c9a83c'); }); }],
  chicken: [16, 16, R => { const W = '#f4f4f4'; R(3, 7, 9, 6, W); R(10, 3, 4, 5, W); R(14, 5, 2, 1, '#e8a33c'); R(13, 7, 1, 2, '#d33b2f'); R(12, 4, 1, 1, '#222222'); R(4, 9, 4, 3, '#dcdcdc'); R(6, 13, 1, 3, '#e8a33c'); R(9, 13, 1, 3, '#e8a33c'); }],
  sheep: [32, 16, R => { const W = '#efefef', F = '#d9c4a8'; R(2, 3, 23, 10, W); R(6, 5, 2, 2, '#dcdcdc'); R(14, 8, 3, 2, '#dcdcdc'); R(20, 4, 2, 2, '#dcdcdc'); R(23, 1, 9, 10, W); R(25, 3, 6, 6, F); R(29, 5, 1, 1, '#222222'); R(30, 7, 1, 1, '#b08a6a'); [4, 9, 17, 21].forEach(x => R(x, 13, 3, 3, F)); }],
  cow: [32, 16, R => { const B = '#4a3524'; R(2, 3, 23, 10, B); R(6, 4, 6, 4, '#f0f0f0'); R(16, 8, 5, 4, '#f0f0f0'); R(24, 1, 8, 8, B); R(29, 5, 3, 3, '#d9b49a'); R(24, 0, 1, 2, '#e0d8c8'); R(28, 0, 1, 2, '#e0d8c8'); R(27, 3, 1, 1, '#111111'); R(12, 13, 4, 2, '#e8a0b0'); [4, 8, 18, 22].forEach(x => R(x, 13, 3, 3, B)); }],
  soldier: [16, 24, R => { const G = '#4f6b2c', D = '#3c5221'; R(5, 0, 6, 3, D); R(4, 2, 8, 1, D); R(5, 3, 6, 5, '#d9a066'); R(6, 5, 1, 1, '#222222'); R(9, 5, 1, 1, '#222222'); R(4, 8, 8, 8, G); R(4, 12, 8, 1, '#2b2b2b'); R(2, 8, 2, 7, G); R(12, 8, 2, 7, G); R(13, 3, 1, 12, '#3a2a1a'); R(5, 16, 2, 6, D); R(9, 16, 2, 6, D); R(4, 22, 3, 2, '#2b2b2b'); R(9, 22, 3, 2, '#2b2b2b'); }],
  tank: [32, 16, R => { const G = '#5a6e34', D = '#3f4f22'; R(2, 10, 28, 6, '#2b2b2b'); [4, 9, 14, 19, 24].forEach(x => R(x, 12, 3, 3, '#6c6c6c')); R(3, 6, 26, 5, G); R(3, 10, 26, 1, D); R(10, 2, 11, 5, G); R(10, 6, 11, 1, D); R(21, 3, 10, 2, D); R(13, 3, 3, 2, '#c62f2f'); }],
  lama: [16, 16, R => PIC.LAMA(R)],
  horse: [24, 16, R => { const B = '#8a5a2e', D = '#3a2414'; R(2, 5, 15, 6, B); R(3, 11, 2, 4, '#6b4424'); R(14, 11, 2, 4, '#6b4424'); R(3, 15, 2, 1, '#222222'); R(14, 15, 2, 1, '#222222'); R(16, 1, 4, 7, B); R(19, 3, 4, 3, '#7a4a24'); R(15, 0, 2, 7, D); R(0, 5, 2, 7, D); R(18, 2, 1, 1, '#111111'); R(21, 4, 1, 1, '#2a1a0a'); }],
  heli: [32, 16, R => { const G = '#5a6e34', D = '#3f4f22'; R(2, 3, 26, 1, '#333333'); R(14, 4, 2, 2, '#333333'); R(8, 6, 14, 6, G); R(8, 11, 14, 1, D); R(18, 7, 4, 3, '#bfe3f5'); R(0, 7, 8, 2, G); R(0, 4, 1, 6, '#333333'); R(11, 8, 2, 2, '#e8e8e8'); R(11, 12, 1, 2, '#333333'); R(19, 12, 1, 2, '#333333'); R(9, 14, 13, 1, '#333333'); }],
  goldtower: [16, 48, R => { for (let y = 0; y < 48; y += 16) { R(0, y, 16, 16, '#f2c94c'); R(0, y, 16, 1, '#fff1a6'); R(0, y + 15, 16, 1, '#b88a20'); R(3, y + 4, 3, 2, '#f8d860'); R(9, y + 9, 4, 2, '#e0b030'); } }],
  pig: [16, 16, R => { const P = '#f0a8b0', D = '#e08890'; R(1, 6, 12, 7, P); R(11, 4, 5, 6, P); R(14, 6, 2, 2, D); R(15, 6, 1, 1, '#a85060'); R(12, 5, 1, 1, '#222222'); R(2, 13, 2, 3, D); R(9, 13, 2, 3, D); }],
  cat: [16, 16, R => { const O = '#e8963c', D = '#c8762c'; R(4, 8, 7, 8, O); R(5, 3, 6, 5, O); R(5, 2, 1, 1, O); R(10, 2, 1, 1, O); R(6, 5, 1, 1, '#3c9b3a'); R(9, 5, 1, 1, '#3c9b3a'); R(7, 6, 2, 1, '#d06070'); R(4, 10, 7, 1, D); R(4, 13, 7, 1, D); R(11, 13, 3, 2, O); R(13, 10, 1, 3, O); }],
  beehive: [16, 16, R => { R(1, 2, 14, 13, '#d8a23a'); R(1, 5, 14, 1, '#a8781e'); R(1, 10, 14, 1, '#a8781e'); R(6, 7, 4, 2, '#3a2a10'); R(10, 11, 2, 3, '#f2c94c'); R(10, 14, 1, 1, '#f2c94c'); }],
  scarecrow: [16, 32, R => { R(7, 9, 2, 23, '#7a5e3b'); R(0, 12, 16, 2, '#7a5e3b'); R(4, 11, 8, 8, '#3f6fb0'); R(3, 19, 10, 2, '#d8b84a'); R(3, 0, 10, 9, '#e8862a'); R(7, 0, 2, 1, '#4c7a2a'); R(5, 3, 2, 2, '#3a2410'); R(9, 3, 2, 2, '#3a2410'); R(5, 6, 6, 1, '#3a2410'); }],
  sunflower: [16, 32, R => { R(7, 10, 2, 22, '#3f8a2a'); R(3, 18, 4, 2, '#4c9c33'); R(9, 23, 4, 2, '#4c9c33'); R(4, 1, 8, 10, '#f2d024'); R(3, 2, 10, 8, '#f2d024'); R(5, 3, 6, 6, '#6b4424'); }],
  eye: [16, 16, R => { R(4, 2, 8, 7, '#2a8a5a'); R(3, 3, 10, 5, '#2a8a5a'); R(6, 4, 4, 3, '#0e3a24'); R(7, 5, 2, 1, '#b8ffd0'); }],
  dragon: [32, 16, R => { const B = '#1a1a22', W = '#2e2e3e'; R(4, 6, 18, 5, B); R(0, 8, 5, 2, B); R(21, 4, 8, 5, B); R(28, 6, 4, 2, B); R(25, 5, 2, 1, '#d070ff'); R(8, 0, 6, 6, W); R(12, 1, 8, 4, W); R(6, 11, 2, 4, B); R(16, 11, 2, 4, B); [8, 12, 16].forEach(x => R(x, 5, 1, 1, '#4a4a5a')); }],
  egg: [16, 16, R => { R(5, 3, 6, 11, '#1a0e24'); R(4, 5, 8, 8, '#1a0e24'); R(6, 5, 1, 2, '#7a3aa0'); R(9, 9, 1, 1, '#7a3aa0'); R(7, 12, 2, 1, '#5a2a80'); }],
  rail: [16, 16, R => { R(0, 13, 16, 2, '#5a4030'); [1, 6, 11].forEach(x => R(x, 11, 3, 5, '#6b4a31')); R(0, 11, 16, 1, '#a0a0a0'); R(0, 14, 16, 1, '#a0a0a0'); }],
  loco: [32, 16, R => { R(2, 4, 22, 8, '#c0392b'); R(16, 0, 9, 12, '#a82e22'); R(18, 2, 5, 4, '#a9dbea'); R(5, 0, 3, 4, '#333333'); R(0, 9, 3, 3, '#333333'); [4, 12, 20].forEach(x => { R(x, 12, 4, 4, '#222222'); R(x + 1, 13, 2, 2, '#888888'); }); R(2, 8, 22, 1, '#f2c94c'); }],
  wagon: [32, 16, R => { R(1, 2, 30, 10, '#2f6fb0'); R(1, 2, 30, 1, '#4a86c8'); [4, 11, 18, 25].forEach(x => R(x, 4, 4, 4, '#a9dbea')); [5, 23].forEach(x => { R(x, 12, 4, 4, '#222222'); R(x + 1, 13, 2, 2, '#888888'); }); }],
  clock: [16, 16, R => { R(4, 3, 8, 10, '#f4f4f4'); R(3, 4, 10, 8, '#f4f4f4'); R(7, 5, 2, 4, '#222222'); R(8, 8, 3, 1, '#222222'); }],
  cross: [16, 16, R => { R(7, 2, 2, 13, '#e0c060'); R(4, 5, 8, 2, '#e0c060'); }],
  flagCz: [16, 16, R => { R(1, 1, 1, 15, '#5a4030'); R(2, 2, 12, 4, '#ffffff'); R(2, 6, 12, 4, '#d7141a'); R(2, 2, 2, 8, '#11457e'); R(4, 4, 2, 4, '#11457e'); }],
  fountain: [16, 16, R => { R(1, 10, 14, 6, '#9a9a9a'); R(1, 10, 14, 1, '#bdbdbd'); R(3, 9, 10, 2, '#5aa0e8'); R(7, 2, 2, 8, '#8ac4f8'); R(5, 4, 1, 3, '#8ac4f8'); R(10, 4, 1, 3, '#8ac4f8'); }],
  portalIcon: [16, 16, R => { R(2, 0, 12, 16, '#241638'); R(4, 2, 8, 12, '#9a4af0'); R(6, 4, 2, 3, '#c890ff'); R(8, 9, 2, 3, '#7a2ad0'); }],
  wart: [16, 16, R => { [[2, 8], [7, 6], [12, 9]].forEach(([x, y]) => { R(x, y, 3, 3, '#a0181e'); R(x + 1, y - 1, 1, 1, '#c8282e'); R(x + 1, y + 3, 1, 16 - y - 3, '#6a1014'); }); }],
  strider: [16, 16, R => { R(2, 3, 12, 7, '#b0303a'); R(2, 3, 12, 1, '#c84a50'); [3, 6, 9, 12].forEach(x => R(x, 1, 1, 2, '#e0d0b0')); R(4, 6, 2, 1, '#1a1a1a'); R(10, 6, 2, 1, '#1a1a1a'); R(4, 10, 2, 6, '#7a6a6a'); R(10, 10, 2, 6, '#7a6a6a'); }],
  piglin: [16, 16, R => { R(4, 1, 8, 7, '#e8a0a0'); R(2, 2, 2, 3, '#e8a0a0'); R(12, 2, 2, 3, '#e8a0a0'); R(6, 5, 4, 3, '#d88080'); R(6, 6, 1, 1, '#5a2a2a'); R(9, 6, 1, 1, '#5a2a2a'); R(5, 3, 1, 1, '#1a1a1a'); R(10, 3, 1, 1, '#1a1a1a'); R(4, 8, 8, 6, '#6a4a2a'); R(5, 9, 6, 1, '#f2c94c'); R(5, 14, 2, 2, '#3a2a1a'); R(9, 14, 2, 2, '#3a2a1a'); R(13, 9, 2, 5, '#f2c94c'); }],
  ghast: [16, 16, R => { R(2, 1, 12, 10, '#f0f0f0'); R(4, 4, 2, 2, '#3a3a3a'); R(10, 4, 2, 2, '#3a3a3a'); R(6, 7, 4, 2, '#3a3a3a'); [3, 6, 9, 12].forEach((x, i) => R(x, 11, 1, 3 + (i % 2) * 2, '#e0e0e0')); }],
  blaze: [16, 16, R => { R(5, 1, 6, 6, '#f2c94c'); R(6, 3, 1, 1, '#1a1a1a'); R(9, 3, 1, 1, '#1a1a1a'); R(6, 5, 4, 1, '#d08a20'); [[2, 8], [7, 9], [12, 8], [4, 12], [10, 12]].forEach(([x, y]) => R(x, y, 2, 3, '#e0a030')); }],
  campfire: [16, 16, R => { R(1, 12, 14, 2, '#6b4a31'); R(3, 14, 10, 2, '#4a3322'); R(2, 11, 3, 1, '#7a5e3b'); R(11, 11, 3, 1, '#7a5e3b'); R(4, 4, 8, 7, '#ff8a2a'); R(5, 2, 6, 3, '#ff8a2a'); R(7, 0, 2, 2, '#ff8a2a'); R(5, 6, 6, 5, '#f7c548'); R(7, 4, 2, 3, '#f7c548'); R(7, 8, 2, 3, '#fff1b0'); }],
  campfireOut: [16, 16, R => { R(1, 12, 14, 2, '#6b4a31'); R(3, 14, 10, 2, '#4a3322'); R(2, 11, 3, 1, '#7a5e3b'); R(11, 11, 3, 1, '#7a5e3b'); R(4, 10, 8, 2, '#7d7d7d'); R(6, 6, 2, 2, '#bdbdbd'); R(8, 3, 2, 2, '#d6d6d6'); R(6, 0, 2, 2, '#e6e6e6'); }],
  totem: [16, 16, R => { const G = '#f2c94c', D = '#c9a227'; R(5, 1, 6, 5, G); R(6, 3, 1, 1, '#2fbf5a'); R(9, 3, 1, 1, '#2fbf5a'); R(4, 6, 8, 6, G); R(1, 6, 3, 4, D); R(12, 6, 3, 4, D); R(5, 12, 2, 3, D); R(9, 12, 2, 3, D); R(6, 8, 4, 2, '#2fbf5a'); }],
  pumpkin: [16, 16, R => { R(1, 5, 14, 11, '#e8862a'); R(5, 5, 1, 11, '#c86a1a'); R(10, 5, 1, 11, '#c86a1a'); R(7, 2, 2, 3, '#4c7a2a'); }],
};
const sprCache = {};
function spr(name) {
  if (sprCache[name]) return sprCache[name];
  const [w, h, draw] = SPRITES[name];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'); draw((x, y, ww, hh, col) => { g.fillStyle = col; g.fillRect(x, y, ww, hh); });
  return sprCache[name] = c;
}
function sprIcon(name) { const src = spr(name); const c = document.createElement('canvas'); c.width = src.width; c.height = src.height; c.className = 'px'; c.getContext('2d').drawImage(src, 0, 0); return c; }
const DOG_COATS = [
  { id: 'bily', name: 'bílý', w: '#ece8e0', s: '#c9c2b6' },
  { id: 'hnedy', name: 'hnědý', w: '#9a6a3c', s: '#7a5230' },
  { id: 'cerny', name: 'černý', w: '#3e3e3e', s: '#262626' },
  { id: 'zlaty', name: 'zlatý', w: '#e0b06a', s: '#c08f4a' },
  { id: 'sedy', name: 'šedý', w: '#a0a0a0', s: '#7c7c7c' },
  { id: 'strakaty', name: 'strakatý', w: '#ece8e0', s: '#c9c2b6', spots: '#7a5230' },
];
// jména k výběru; SAM, LOLA a MIA si Adam už přečte sám
const DOG_NAMES = ['Sam', 'Lola', 'Mia', 'Max', 'Rex', 'Alík', 'Ben', 'Brok', 'Luna', 'Fík'];
function openDog() {
  if (!hasDog()) { audio(); speak('Pejsek k tobě přiběhne, až dostavíš dům.'); return; }
  audio(); renderDog(); $('#dogOverlay').hidden = false;
  speak(`Tvůj pejsek${dogName() ? ' ' + dogName() : ''}. Vyber mu jméno a barvu.`);
}
function renderDog() {
  const pv = $('#dogPreview'); pv.innerHTML = ''; pv.appendChild(dogCanvas());
  $('#dogTitle').textContent = dogName() || 'Tvůj pejsek';
  const names = $('#dogNames'); names.innerHTML = '';
  DOG_NAMES.forEach(n => { const b = document.createElement('button'); b.className = 'gbtn'; b.textContent = n; b.setAttribute('aria-pressed', String(dogName() === n)); b.addEventListener('click', () => { save.dogName = n; persist(); renderDog(); bark(); retrigger($('#dogPreview'), 'happy'); speak(n); }); names.appendChild(b); });
  const coats = $('#dogCoats'); coats.innerHTML = '';
  DOG_COATS.forEach(k => { const b = document.createElement('button'); b.className = 'swatch'; b.setAttribute('aria-label', k.name + ' pejsek'); b.setAttribute('aria-pressed', String((save.dog.coat || 'bily') === k.id)); const keep = save.dog.coat; save.dog.coat = k.id; b.appendChild(dogCanvas()); save.dog.coat = keep; b.addEventListener('click', () => { save.dog.coat = k.id; persist(); renderDog(); bark(); speak(`${k.name} pejsek`); }); coats.appendChild(b); });
}
function dogCanvas() {
  const col = (COLLARS.find(c => c.id === save.dog.collar) || COLLARS[0]).c;
  const c = document.createElement('canvas'); c.width = 16; c.height = 12; c.className = 'px';
  const g = c.getContext('2d'); const R = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); };
  const coat = DOG_COATS.find(k => k.id === save.dog.coat) || DOG_COATS[0];
  const w = coat.w, s = coat.s, d = '#2b2b2b';
  R(0, 2, 2, 1, w); R(1, 3, 2, 2, w);
  R(2, 4, 9, 4, w); R(2, 7, 9, 1, s);
  R(2, 8, 2, 4, w); R(4, 8, 1, 4, s); R(8, 8, 1, 4, s); R(9, 8, 2, 4, w);
  R(10, 1, 5, 5, w); R(10, 0, 2, 2, s); R(14, 3, 2, 2, '#ddd7cb'); R(15, 3, 1, 1, d); R(12, 2, 1, 1, d);
  if (coat.spots) { R(4, 4, 3, 2, coat.spots); R(8, 6, 2, 2, coat.spots); R(10, 0, 2, 2, coat.spots); R(12, 1, 2, 1, coat.spots); }
  R(10, 4, 1, 3, col); R(11, 6, 1, 1, col);
  return c;
}
function collarIcon(col) {
  const c = document.createElement('canvas'); c.width = c.height = 16; c.className = 'px';
  const g = c.getContext('2d'); const R = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); };
  R(3, 3, 10, 10, '#161616'); R(4, 4, 8, 8, col); g.clearRect(6, 6, 4, 4); R(7, 11, 2, 3, '#f2c94c');
  return c;
}
function mountDog(el) { el.innerHTML = ''; el.hidden = !hasDog(); if (hasDog()) el.appendChild(dogCanvas()); }
const HEART_SVG = '<svg class="heart" viewBox="0 0 7 6" aria-hidden="true"><path fill="#e0402e" d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z"/></svg>';
function dogHappy(el) {
  if (el.hidden) return;
  retrigger(el, 'happy');
  if (REDUCED) return;
  el.insertAdjacentHTML('beforeend', HEART_SVG);
  const h = el.lastElementChild; h.animate([{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(-120%)', opacity: 0 }], { duration: 900 }).onfinish = () => h.remove();
}
function bark() {
  const a = audio(); if (!a) return;
  [0, .18].forEach(t0 => { const o = a.createOscillator(), gn = a.createGain(); o.type = 'square'; const t = a.currentTime + t0; o.frequency.setValueAtTime(560, t); o.frequency.exponentialRampToValueAtTime(260, t + .12); gn.gain.setValueAtTime(.08, t); gn.gain.exponentialRampToValueAtTime(.0001, t + .14); o.connect(gn).connect(a.destination); o.start(t); o.stop(t + .16); });
}
function updateGems(popId) {
  ['homeGems', 'hudGems', 'shopGems', 'famGems'].forEach(id => { const el = $('#' + id); if (!el) return; el.innerHTML = ''; el.appendChild(sprIcon('emerald')); el.append(String(save.emeralds)); });
  if (popId) retrigger($('#' + popId), 'pop');
}
function drawFarm(cv) {
  const C = 16, W = 32, H = 14; cv.width = W * C; cv.height = H * C; // vpravo za ohradou místo pro tank, vojáčka a vzácné věci
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  const grd = g.createLinearGradient(0, 0, 0, 11 * C); grd.addColorStop(0, '#6fb2ea'); grd.addColorStop(1, '#c6e6f8');
  g.fillStyle = grd; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#fff3a6'; g.fillRect(21 * C, C, 24, 24);
  g.fillStyle = '#ffffff'; g.fillRect(9 * C, 1.5 * C, 40, 10); g.fillRect(9 * C + 10, 1.5 * C - 8, 22, 8); g.fillRect(15 * C, 0.8 * C, 34, 8);
  const fs = farmStage();
  const cell = (t, x, y) => g.drawImage(texCanvas(seasonTex(t)), x * C, y * C);
  for (let x = 0; x < W; x++) { cell('grass', x, 11); cell('dirt', x, 12); cell('dirt', x, 13); }
  if (fs >= 3) for (let x = 6; x <= 9; x++) cell('farmland', x, 11);
  if (fs >= 5) for (let x = 10; x <= 13; x++) cell('farmland', x, 11);
  const at = (name, x, row) => { const sp = spr(name); g.drawImage(sp, x * C, (row + 1) * C - sp.height); };
  if (fs >= 2) for (let x = 15; x <= 23; x++) at('fence', x, 10);
  if (fs >= 3) for (let x = 6; x <= 9; x++) at('carrot', x, 10);
  if (fs >= 4) { cell('cobble', 2, 10); cell('water', 3, 10); cell('cobble', 4, 10); cell('log', 2, 9); cell('log', 4, 9); for (let x = 2; x <= 4; x++) cell('roof', x, 8); }
  if (fs >= 5) for (let x = 10; x <= 13; x++) at('wheat', x, 10);
  if (fs >= 6) { at('chicken', 16, 10); at('chicken', 17, 10); }
  if (fs >= 7) at('sheep', 18, 10);
  if (fs >= 8) at('cow', 21, 10);
  if (fs >= 9) { for (let y = 8; y <= 10; y++) cell('log', 5, y); for (let y = 5; y <= 7; y++) for (let x = 4; x <= 6; x++) cell('leaves', x, y); cell('leaves', 5, 4); at('beehive', 6, 8); }
  if (fs >= 10) at('scarecrow', 14, 10);
  if (save.decor.includes('slunecnice')) at('sunflower', 0, 10);
  if (save.decor.includes('dyne')) at('pumpkin', 20, 10);
  if (save.decor.includes('prase')) at('pig', 23, 10);
  if (save.dragon) at('egg', 12, 10 - 0); // dračí vejce za poraženého draka
  if (save.decor.includes('kocka')) at('cat', 3, fs >= 4 ? 7 : 10);
  if (save.decor.includes('tank')) at('tank', 24, 10);
  if (save.decor.includes('vojacek')) at('soldier', 26, 10);
  if (save.decor.includes('kun')) at('horse', 28, 10);
  if (save.decor.includes('lama')) at('lama', 27, 10 - 0);
  if (save.decor.includes('zlatavez')) at('goldtower', 31, 10);
  if (save.decor.includes('helikoptera')) at('heli', 2, 3);
  if (fs >= 1) g.drawImage(dogCanvas(), 1 * C, 11 * C - 12);
  (save.babies || []).forEach(id => { const b = BABIES.find(x => x.id === id); if (b) g.drawImage(babyCanvas(b), Math.round(b.x * C), 11 * C - 10); });
  snowFx(g, cv.width, cv.height);
}
function fitCanvas(cv) {
  requestAnimationFrame(() => { const box = cv.parentElement; const s = Math.max(.5, Math.floor(Math.min(box.clientWidth / cv.width, (box.clientHeight - 8) / cv.height) * 4) / 4); cv.style.width = cv.width * s + 'px'; cv.style.height = cv.height * s + 'px'; });
}
function openFarm() {
  G.speechId++; if (synth) synth.cancel();
  show('farm'); drawFarm($('#farmBig'));
  const fs = farmStage();
  $('#farmCap').textContent = fs === 0 ? 'Farma začne, až dostavíš dům.' : fs < FARM_STAGES.length ? `Farma: ${fs} z ${FARM_STAGES.length} dílů` : 'Farma je hotová! Za smaragdy si do ní můžeš koupit zvířata a věci v obchodě.';
  fitCanvas($('#farmBig'));
}
let shopArmed = null;
function openShop() {
  audio(); G.speechId++; if (synth) synth.cancel();
  shopArmed = null; show('shop'); renderShop();
  speak('Obchod. Za smaragdy si můžeš koupit věci pro psa a na farmu.');
}
function renderShop() {
  updateGems(); mountDog($('#shopDog'));
  const list = $('#shopItems'); list.innerHTML = '';
  const head = t => list.insertAdjacentHTML('beforeend', `<h3 class="shop-h">${t}</h3>`);
  head('Pro psa');
  shopItem({ key: 'treat', name: 'pamlsek', price: TREAT_PRICE, icon: sprIcon('bone'), needDog: true });
  COLLARS.forEach(c => shopItem({ key: 'collar:' + c.id, name: c.name, price: c.price, icon: collarIcon(c.c), needDog: true, owned: save.dog.owned.includes(c.id), selected: save.dog.collar === c.id }));
  head('Pro tebe');
  shopItem({ key: 'totem', name: 'totem nesmrtelnosti', price: TOTEM_PRICE, icon: sprIcon('totem'), owned: save.streak.totem > 0 });
  head('Na farmu');
  DECOR.forEach(d => shopItem({ key: 'decor:' + d.id, name: d.name, price: d.price, icon: sprIcon(d.sprite), owned: save.decor.includes(d.id) }));
  head('Vzácné, za zvládnuté úkoly');
  const { pts, max } = masteryPoints();
  RARE.forEach(d => shopItem({ key: 'decor:' + d.id, name: d.name, price: d.price, icon: sprIcon(d.sprite), owned: save.decor.includes(d.id), left: rareLeft(d.need, pts, max), him: d.him }));
}
function shopItem(o) {
  const b = document.createElement('button'); b.className = 'shop-item'; b.setAttribute('aria-label', o.name);
  const locked = (o.needDog && !hasDog()) || (!o.owned && o.left > 0);
  const ic = document.createElement('span'); ic.className = 'shop-icon'; ic.appendChild(o.icon); b.appendChild(ic);
  const pr = document.createElement('span'); pr.className = 'price';
  if (o.owned) pr.textContent = o.selected ? 'nosí' : 'máš';
  else { pr.appendChild(sprIcon('emerald')); pr.append(String(o.price)); }
  b.appendChild(pr);
  if (locked) { b.classList.add('locked'); b.insertAdjacentHTML('beforeend', LOCK_SVG); }
  else if (!o.owned && save.emeralds < o.price) b.classList.add('poor');
  if (o.selected) b.setAttribute('aria-pressed', 'true');
  if (shopArmed === o.key) b.classList.add('armed');
  b.addEventListener('click', () => shopTap(o, locked));
  $('#shopItems').appendChild(b);
}
// první klepnutí vybere, druhé koupí (aby Adam nekoupil omylem)
function shopTap(o, locked) {
  audio();
  if (locked && o.left > 0) { sfx.nope(); speak(`${o.name[0].toUpperCase() + o.name.slice(1)} je vzácná věc. Odemkne se, až zvládneš ještě ${o.left} ${o.left === 1 ? 'úkol' : o.left <= 4 ? 'úkoly' : 'úkolů'}. Pak ${o.him ? 'ho' : 'ji'} koupíš za ${o.price} ${gemWord(o.price)}.`); return; }
  if (locked) { sfx.nope(); speak('Nejdřív potřebuješ psa. Přiběhne, až dostavíš dům.'); return; }
  if (o.owned) {
    if (o.key.startsWith('collar:')) { save.dog.collar = o.key.slice(7); persist(); renderShop(); bark(); dogHappy($('#shopDog')); speak(o.name); }
    else speak(o.key === 'totem' ? 'Totem už máš. Zachrání tvou řadu, když jeden den vynecháš.' : `${o.name} už máš na farmě.`);
    return;
  }
  if (save.emeralds < o.price) { shopArmed = null; renderShop(); sfx.nope(); speak(`${o.name} stojí ${o.price} ${gemWord(o.price)}. Máš ${save.emeralds}. Kopej bez chyby a získáš další!`); return; }
  if (shopArmed !== o.key) { shopArmed = o.key; renderShop(); speak(`${o.name} za ${o.price} ${gemWord(o.price)}. Klepni ještě jednou a koupíš.`); return; }
  save.emeralds -= o.price; shopArmed = null;
  if (o.key === 'totem') { save.streak.totem = 1; persist(); renderShop(); sfx.sparkle(); speak('Koupeno: totem nesmrtelnosti! Zachrání tvou řadu, když jeden den vynecháš.'); return; }
  if (o.key === 'treat') { persist(); renderShop(); bark(); dogHappy($('#shopDog')); speak(`Mňam! ${dogName() || 'Pejsek'} má radost.`); return; }
  if (o.key.startsWith('collar:')) { const id = o.key.slice(7); save.dog.owned.push(id); save.dog.collar = id; }
  else save.decor.push(o.key.slice(6));
  persist(); renderShop(); sfx.fanfare(); dogHappy($('#shopDog'));
  speak(`Koupeno: ${o.name}!` + (o.key.startsWith('decor:') ? ([...DECOR, ...RARE].find(d => 'decor:' + d.id === o.key)?.him ? ' Najdeš ho na farmě.' : ' Najdeš ji na farmě.') : ''));
}

export { COLLARS, DECOR, RARE, DOG_COATS, DOG_NAMES, FARM_STAGES, FARM_START, HEART_SVG, PERFECT_BONUS, SPRITES, TREAT_PRICE, bark, collarIcon, dogCanvas, dogHappy, drawFarm, farmStage, fitCanvas, gemWord, hasDog, mountDog, openDog, openFarm, openShop, renderDog, renderShop, shopArmed, shopItem, shopTap, spr, sprCache, sprIcon, updateGems };
