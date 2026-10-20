// Finále: End a Ender drak
import { G } from '../core/state.js';
import { $, REDUCED } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { pick, rng, texCanvas } from '../gfx/textures.js';
import { speak, synth } from '../audio/speech.js';
import { audio, sfx } from '../audio/sfx.js';
import { LEVELS, choiceCount, makeChoices, pickTarget, sayText } from '../levels/reading.js';
import { show } from '../ui/screens.js';
import { fitCanvas, spr } from './farm.js';
import { FAMILY, famCanvas } from './family.js';
import { masteryPoints } from '../rewards/enchant.js';
import { eyesFor } from '../logic/rewards.ts';
import { gameName } from '../app/name.js';
import { retrigger, startRound } from '../game/round.js';
import { PRACTICE } from '../levels/practice.js';

// Oči Enderu přibývají se zvládnutými úkoly (12 očí = vše zvládnuto). Portál do Endu se otevře, až má Adam zvládnuté všechno;
// to je strop hry podle pravidla „maximum až po zvládnutí všeho“. Bitvu jde pak opakovat, odměny jsou jednou.
const EYES = 12, BOSS_HITS = 20, BOSS_BONUS = 100;
const eyesHave = () => { const { pts, max } = masteryPoints(); return Math.max(save.eyes || 0, eyesFor(pts, max)); };
const endOpen = () => eyesHave() >= EYES;
const RING = [[1, 0], [2, 0], [3, 0], [4, 1], [4, 2], [4, 3], [3, 4], [2, 4], [1, 4], [0, 3], [0, 2], [0, 1]]; // rám 5 × 5 bez rohů
function drawEnder(cv) {
  const C = 16, W = 20, H = 14; cv.width = W * C; cv.height = H * C;
  const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
  g.fillStyle = '#0a0612'; g.fillRect(0, 0, cv.width, cv.height);
  const r = rng(3); g.fillStyle = '#e8dcff'; for (let i = 0; i < 50; i++) g.fillRect(Math.floor(r() * cv.width), Math.floor(r() * 150), 1 + (i % 3 === 0), 1 + (i % 3 === 0));
  for (let x = 0; x < W; x++) for (let y = 11; y < H; y++) g.drawImage(texCanvas('endStone'), x * C, y * C);
  const n = eyesHave(), ox = 7.5, oy = 3.5;
  RING.forEach(([dx, dy], i) => { g.drawImage(texCanvas('endFrame'), (ox + dx) * C, (oy + dy) * C); if (i < n) g.drawImage(spr('eye'), (ox + dx) * C, (oy + dy) * C - 3); });
  if (n >= EYES) { for (let dx = 1; dx <= 3; dx++) for (let dy = 1; dy <= 3; dy++) { g.fillStyle = '#05030a'; g.fillRect((ox + dx) * C, (oy + dy) * C, C, C); } g.fillStyle = '#9a6aff'; for (let i = 0; i < 14; i++) g.fillRect((ox + 1) * C + Math.floor(r() * 48), (oy + 1) * C + Math.floor(r() * 48), 2, 2); }
  if (!save.dragon) g.drawImage(spr('dragon'), 13 * C, 1 * C, 64, 32);
  else g.drawImage(spr('egg'), 2 * C, 10 * C);
}
function openEnder() {
  G.speechId++; if (synth) synth.cancel();
  save.eyes = eyesHave(); persist();
  show('ender'); drawEnder($('#enderBig')); fitCanvas($('#enderBig'));
  const n = eyesHave(), { pts, max } = masteryPoints();
  const cap = n < EYES ? `Oči Enderu: ${n} z ${EYES}. Přibývají, jak zvládáš úkoly (zvládnuto ${pts} z ${max}). Když budou všechna, otevře se portál a čeká tě Ender drak.`
    : save.dragon ? `Ender drak je poražený! Vyhrál jsi ${save.dragon}×. Můžeš bojovat znovu.` : 'Portál do Endu je otevřený! Ender drak čeká. Každá správná odpověď je šíp.';
  $('#enderCap').textContent = cap;
  $('#btnFight').hidden = n < EYES;
  speak(cap + (n >= EYES ? ' Boj začneš zeleným tlačítkem s mečem, je na něm napsáno Bojovat s drakem.' : ''));
}
// smíšené úkoly ze všech pater
function genBoss() {
  const lv = pick(Math.random, ['syllables', 'words', 'reading', 'numbers', 'math']);
  if (LEVELS[lv].gen) return LEVELS[lv].gen();
  const t = pickTarget(lv, G.R.recent.slice(-3));
  return { answer: t, choices: makeChoices(lv, t, choiceCount(lv)), say: sayText(lv, t), stat: lv + ':' + t, key: t };
}
const BOSS = { name: 'Ender drak', tex: 'endStone', gen: genBoss, len: BOSS_HITS, intro: 'Ender drak! Každá správná odpověď je šíp. Poraz ho!' };
function levelDef(level) { return LEVELS[level] || (level === 'practice' ? PRACTICE : BOSS); }
const curLevel = () => levelDef(G.R.level);
function bossHit(fromEl) {
  const left = G.R.len - G.R.i;
  $('#bossHp').style.width = (left / G.R.len * 100) + '%';
  const d = $('#bossDragon'); retrigger(d, 'hit');
  if (REDUCED || !fromEl) return;
  const a = fromEl.getBoundingClientRect(), b = d.getBoundingClientRect(), ar = document.createElement('div'); ar.className = 'arrow';
  Object.assign(ar.style, { left: a.left + a.width / 2 + 'px', top: a.top + 'px' }); document.body.appendChild(ar);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - a.top, ang = Math.atan2(dy, dx);
  ar.animate([{ transform: `rotate(${ang}rad)` }, { transform: `translate(${dx}px,${dy}px) rotate(${ang}rad)` }], { duration: 450, easing: 'ease-in' }).onfinish = () => ar.remove();
}
function bossVictory() {
  const first = !save.dragon;
  save.dragon = (save.dragon || 0) + 1;
  if (first) save.emeralds += BOSS_BONUS;
  persist(); G.R = null;
  sfx.fanfare(); sfx.sparkle();
  const cv = $('#victoryCanvas'); drawEnder(cv);
  const g = cv.getContext('2d'), r = rng(21);
  for (let k = 0; k < 7; k++) { const cx = 30 + r() * (cv.width - 60), cy = 20 + r() * 80, col = pick(r, ['#ff5a5a', '#f6cf45', '#5ad0ff', '#9b5de5', '#6bd96b']); g.fillStyle = col; for (let i = 0; i < 12; i++) { const an = i / 12 * Math.PI * 2; for (let dd = 4; dd <= 14; dd += 5) g.fillRect(Math.round(cx + Math.cos(an) * dd), Math.round(cy + Math.sin(an) * dd), 2, 2); } }
  const vc = $('#victoryCheer'); vc.innerHTML = ''; const faces = document.createElement('div'); faces.className = 'faces many'; FAMILY.forEach(p => faces.appendChild(famCanvas(p))); vc.appendChild(faces);
  const bb = document.createElement('div'); bb.className = 'bubble'; bb.innerHTML = '<b>celá rodina</b>'; bb.append('Adame, jsi hrdina! Jsme na tebe moc pyšní!'); vc.appendChild(bb);
  const line = first ? `Za vítězství dostáváš dračí hlavu do šatníku, dračí vejce na farmu a ${BOSS_BONUS} smaragdů!` : `Draka jsi porazil už ${save.dragon}×!`;
  $('#victoryLine').textContent = line;
  $('#victoryOverlay').hidden = false;
  speak(`${gameName()}. Adam porazil Ender draka! Celá rodina říká: Adame, jsi hrdina! Jsme na tebe moc pyšní! ${line} Domů se vrátíš zeleným tlačítkem s domečkem.`);
}
function startBoss() { audio(); startRound('boss'); }

export { BOSS, BOSS_BONUS, BOSS_HITS, EYES, RING, bossHit, bossVictory, curLevel, levelDef, drawEnder, endOpen, eyesHave, genBoss, openEnder, startBoss };
