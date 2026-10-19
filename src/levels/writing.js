// Psaní: obtahování prstem
import { G } from '../core/state.js';
import { recordResult } from '../logic/mastery.ts';
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { pick, tex } from '../gfx/textures.js';
import { speak } from '../audio/speech.js';
import { audio, sfx, tone } from '../audio/sfx.js';
import { GLYPHS, SHAPE_NAMES, spiralPath } from '../content/glyphs.ts';
import { ctx } from '../game/ctx.js';
import { genWriting as genWritingL, writingSay } from '../logic/tasks.ts';
import { dogHappy, updateGems } from '../world/farm.js';
import { luckBonus } from '../rewards/enchant.js';
import { mineTex } from '../world/nether.js';
import { curLevel } from '../world/finale.js';
import { PRAISE, nextTask, retrigger } from '../game/round.js';

const LANE = 16; // šířka dráhy; prst musí zůstat uvnitř
const TRACE_TOL = LANE / 2 + 2, TRACE_SLIP = LANE / 2 + 3.5;
let svgProbe = null;
function sampleStroke(d) {
  if (!svgProbe) { svgProbe = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svgProbe.setAttribute('width', '0'); svgProbe.setAttribute('height', '0'); svgProbe.style.position = 'absolute'; document.body.appendChild(svgProbe); }
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path'); el.setAttribute('d', d); svgProbe.appendChild(el);
  const len = el.getTotalLength(), n = Math.max(8, Math.round(len / 4)), pts = [];
  for (let i = 0; i <= n; i++) { const q = el.getPointAtLength(len * i / n); pts.push([q.x, q.y]); }
  el.remove(); return pts;
}
function setupTrace(ch) {
  const strokes = GLYPHS[ch].map(d => ({ d, pts: sampleStroke(d) }));
  G.TR = { ch, strokes, si: 0, pi: 0, down: false, trail: [] };
  layoutTrace();
}
function layoutTrace() {
  if (!G.TR) return;
  const box = $('#trace'), cv = $('#traceCanvas'); const cs = getComputedStyle(box);
  const W = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 12;
  const H = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 18;
  const k = Math.max(1.5, Math.min(W / 100, H / 140));
  const dpr = window.devicePixelRatio || 1;
  cv.style.width = 100 * k + 'px'; cv.style.height = 140 * k + 'px';
  cv.width = Math.round(100 * k * dpr); cv.height = Math.round(140 * k * dpr);
  G.TR.k = k; G.TR.dpr = dpr; drawTrace();
}
function drawTrace() {
  const cv = $('#traceCanvas'), g = cv.getContext('2d'), sc = G.TR.k * G.TR.dpr;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.setTransform(sc, 0, 0, sc, 0, 0);
  g.lineCap = 'round'; g.lineJoin = 'round';
  // linky jako v sešitě
  g.strokeStyle = '#c9d8ea'; g.lineWidth = 1.2; [15, 125].forEach(y => { g.beginPath(); g.moveTo(4, y); g.lineTo(96, y); g.stroke(); });
  // dráha s okraji: tmavý lem, světlý vnitřek
  G.TR.strokes.forEach(st => { g.strokeStyle = '#8a6a44'; g.lineWidth = LANE + 3; g.stroke(new Path2D(st.d)); });
  G.TR.strokes.forEach(st => { g.strokeStyle = '#efe4c8'; g.lineWidth = LANE; g.stroke(new Path2D(st.d)); });
  const done = (pts, upto) => { if (upto < 1) return; g.strokeStyle = '#3a8a2a'; g.lineWidth = 11; g.beginPath(); g.moveTo(...pts[0]); for (let i = 1; i <= upto; i++) g.lineTo(...pts[i]); g.stroke(); };
  G.TR.strokes.forEach((st, i) => { if (i < G.TR.si) done(st.pts, st.pts.length - 1); else if (i === G.TR.si) done(st.pts, G.TR.pi); });
  if (G.TR.trail.length > 1) { g.strokeStyle = 'rgba(29,23,18,.35)'; g.lineWidth = 3; g.beginPath(); g.moveTo(...G.TR.trail[0]); G.TR.trail.forEach(q => g.lineTo(...q)); g.stroke(); }
  const st = G.TR.strokes[G.TR.si]; if (!st) return;
  // zelená tečka: kde pokračovat, šipka: kterým směrem
  const [x, y] = st.pts[G.TR.pi], nx = st.pts[Math.min(st.pts.length - 1, G.TR.pi + 5)];
  const ang = Math.atan2(nx[1] - y, nx[0] - x);
  g.fillStyle = '#4e9a32'; g.strokeStyle = '#161616'; g.lineWidth = 1.5;
  g.beginPath(); g.arc(x, y, 8, 0, Math.PI * 2); g.fill(); g.stroke();
  g.save(); g.translate(x, y); g.rotate(ang); g.strokeStyle = '#4e9a32'; g.lineWidth = 3; g.beginPath(); g.moveTo(9, 0); g.lineTo(17, 0); g.stroke(); g.fillStyle = '#4e9a32'; g.beginPath(); g.moveTo(24, 0); g.lineTo(16, -5); g.lineTo(16, 5); g.closePath(); g.fill(); g.restore();
  if (G.TR.strokes.length > 1 && G.TR.pi === 0) { g.fillStyle = '#161616'; g.font = '700 9px Andika, sans-serif'; g.fillText(String(G.TR.si + 1), x + 9, y - 7); }
}
function tracePoint(e) { const r = $('#traceCanvas').getBoundingClientRect(); return [(e.clientX - r.left) / G.TR.k, (e.clientY - r.top) / G.TR.k]; }
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
function traceDown(e) {
  if (!G.TR || !G.R || G.R.busy) return;
  audio();
  const q = tracePoint(e), st = G.TR.strokes[G.TR.si];
  if (dist(q, st.pts[G.TR.pi]) > TRACE_TOL * 1.4) { sfx.nope(); speak('Začni u zelené tečky.'); return; }
  G.TR.down = true; G.TR.trail = [q]; $('#traceCanvas').setPointerCapture(e.pointerId);
}
function traceMove(e) {
  if (!G.TR || !G.TR.down) return;
  // rychlý tah prstem: projít i mezilehlé body, ať se nic nepřeskočí
  const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
  for (const ev of (evs.length ? evs : [e])) { if (!traceStep(tracePoint(ev))) return; }
  drawTrace();
}
// vrací false, když tah skončil (ujel nebo dokončen)
function traceStep(q) {
  const st = G.TR.strokes[G.TR.si];
  G.TR.trail.push(q); if (G.TR.trail.length > 40) G.TR.trail.shift();
  let best = -1, near = Infinity;
  for (let j = Math.max(0, G.TR.pi - 8); j < Math.min(st.pts.length, G.TR.pi + 14); j++) { const d = dist(q, st.pts[j]); near = Math.min(near, d); if (d <= TRACE_TOL && j >= G.TR.pi && j <= G.TR.pi + 5) best = j; } // postup jen o kousek dopředu, ať prst nepřeskočí na sousední oblouk
  if (best > G.TR.pi) G.TR.pi = best;
  if (near > TRACE_SLIP) { traceSlip(); return false; }
  if (G.TR.pi >= st.pts.length - 2) {
    G.TR.si++; G.TR.pi = 0; G.TR.down = false; G.TR.trail = [];
    tone(990, 0, .08, 'square', .05);
    drawTrace();
    if (G.TR.si >= G.TR.strokes.length) finishTrace();
    return false;
  }
  return true;
}
function traceUp() { if (!G.TR) return; G.TR.down = false; G.TR.trail = []; drawTrace(); }
// prst ujel z čáry: tah se začíná znovu a úkol už není bez chyby
function traceSlip() {
  G.TR.down = false; G.TR.pi = 0; G.TR.trail = [];
  G.R.firstTry = false; sfx.nope(); retrigger($('#trace'), 'slip');
  speak('Vyjel jsi z dráhy. Zkus to znovu od zelené tečky.');
  drawTrace();
}
function finishTrace() {
  G.R.busy = true;
  recordResult(save.stats, G.R.statKey, G.R.firstTry);
  const clean = G.R.firstTry, texName = mineTex(curLevel().tex);
  if (clean) { G.R.clean++; save.emeralds += 1 + luckBonus(); updateGems('hudGems'); dogHappy($('#gameDog')); }
  persist();
  sfx.breakIt();
  const pip = $('#pips').children[G.R.i];
  pip.classList.add('done', clean ? 'clean' : 'miss'); pip.style.backgroundImage = `url(${tex(texName)})`;
  G.R.loot.push({ t: texName, clean });
  G.R.i++;
  const ch = G.TR.ch;
  setTimeout(() => { if (G.R && G.TR && G.TR.ch === ch) speak(pick(Math.random, PRAISE), () => setTimeout(nextTask, 300)); }, 200);
}
function genWriting() { return genWritingL(ctx()); }

export { GLYPHS, LANE, SHAPE_NAMES, TRACE_SLIP, TRACE_TOL, dist, drawTrace, finishTrace, genWriting, layoutTrace, sampleStroke, setupTrace, spiralPath, svgProbe, traceDown, traceMove, tracePoint, traceSlip, traceStep, traceUp, writingSay };
