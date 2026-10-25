// Patro Mluvení: sluch na kostkách, ostatní úkoly v panelu (vyslovit s rodičem, cvik, foukání). Logika v logic/speech.ts.
import { gx } from '../app/player.js';
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { pick, tex } from '../gfx/textures.js';
import { speak, synth } from '../audio/speech.js';
import { audio, sfx, tone } from '../audio/sfx.js';
import { recordResult } from '../logic/mastery.ts';
import { BLOW_LEVEL, BLOW_NEED_MS, genGym, genHear, genSay, rms, roundPlan } from '../logic/speech.ts';
import { SOUNDS } from '../content/speech.ts';
import { stageOf } from '../logic/stages.ts';
import { dogHappy, updateGems } from '../world/farm.js';
import { luckBonus } from '../rewards/enchant.js';
import { mineTex } from '../world/nether.js';
import { curLevel } from '../world/finale.js';
import { PRAISE, logTask, nextTask } from '../game/round.js';
import { setBtn } from '../ui/icons.js';

const speechStage = () => stageOf('speech', save.stats, save.stages); // dvojice hlásek podle zvládnutí
const kindNow = () => { if (!G.R.plan) G.R.plan = roundPlan(save.rounds.speech || 0); return G.R.plan[G.R.i]; };
// sluch: kostky s hláskou (písmeno + obrázek); hlas řekne slovo
function genSpeechHear() { const t = genHear(speechStage(), save.stats, G.R.recent); return { ...t, task: 'Co slyšíš ve slově?' }; }
function soundLabel(id) { return `${SOUNDS[id].letter}${SOUNDS[id].icon}`; } // funkce, ne konstanta: LEVELS ji potřebuje hned při načtení (kruhové importy)
const soundSay = id => SOUNDS[id].hint;

let spTok = 0, spDoneTok = 0;
let mic = null; // { stream, ctx, an, buf }
function stopMic() { if (mic) { try { mic.stream.getTracks().forEach(t => t.stop()); mic.ctx.close(); } catch (e) {} mic = null; } }

// panel pro úkoly, které nejsou kostky; vrací true, když úkol převzal
function speechActivity() {
  const kind = kindNow();
  if (kind === 'hear') return false;
  const tok = ++spTok; // značka úkolu: dokončit jde jen tento úkol a jen jednou
  G.R.busy = false; G.R.stuck = false; G.R.firstTry = true; G.R.els = null; G.R.shownAt = Date.now();
  $('#blocks').hidden = true; $('#trace').hidden = true; $('#task').hidden = true;
  const p = $('#speechPanel'); p.hidden = false; p.innerHTML = '';
  if (kind === 'say') {
    const w = genSay(speechStage(), G.R.recent); G.R.recent.push(w.w);
    G.R.say = `Řekni nahlas: ${w.w}.`; G.R.statKey = 'say:' + w.w;
    p.innerHTML = `<div class="sp-pic">${w.pic}</div><div class="sp-word">${w.w}</div><p class="sp-note">Rodič poslouchá a klepne:</p><div class="actions"></div>`;
    const a = p.querySelector('.actions');
    const btn = (icon, text, cls, fn) => { const b = document.createElement('button'); b.className = 'gbtn ' + cls; setBtn(b, icon, text); b.addEventListener('click', () => { audio(); fn(); }); a.appendChild(b); };
    btn('check', 'Povedlo se', 'go', () => finishSpeech(true, true, tok));
    btn('retry', 'Ještě ne', '', () => finishSpeech(false, true, tok));
    btn('back', 'Bez rodiče', '', () => finishSpeech(true, false, tok));
  }
  if (kind === 'gym') {
    const e = genGym(); G.R.say = e.text; G.R.statKey = 'exercise:gym'; // do deníku úloh (logTask), do zvládnutí ne
    p.innerHTML = `<div class="sp-pic">${e.icon}</div><p class="sp-text">${e.text}</p><div class="sp-bar"><i></i></div>`;
    // čas cviku běží jen mimo pauzu (review 25. 10. 2026: po pauze byl pásek hotový a cvik se počítal)
    const bar = p.querySelector('.sp-bar i'), DUR = 5000; let el = 0, last = 0;
    const tick = () => { if (!G.R || $('#speechPanel').hidden) return; const now = Date.now(); if (!G.R.paused && last) el += now - last; last = now; const f = Math.min(1, el / DUR); bar.style.width = f * 100 + '%'; if (f < 1) requestAnimationFrame(tick); else finishSpeech(true, false, tok); };
    setTimeout(() => requestAnimationFrame(tick), 1500); // nejdřív zazní zadání
  }
  if (kind === 'blow') {
    G.R.say = 'Fouknutí! Foukej do tabletu a roztoč větrný mlýn.'; G.R.statKey = 'exercise:blow';
    p.innerHTML = `<div class="sp-pic sp-mill" id="spMill">🌀</div><p class="sp-text">Foukej a roztoč mlýn!</p><div class="sp-bar"><i></i></div><div class="actions"></div>`;
    const bar = p.querySelector('.sp-bar i'), mill = p.querySelector('#spMill'), a = p.querySelector('.actions');
    let done = 0, last = Date.now(), angle = 0;
    // tlačítko je tam od začátku (review 25. 10. 2026: než rodič povolí mikrofon, nebylo na co klepnout)
    { const b = document.createElement('button'); b.className = 'gbtn go'; setBtn(b, 'check', gx('Foukl jsem!', 'Foukla jsem!')); b.addEventListener('click', () => { audio(); stopMic(); finishSpeech(true, false, tok); }); a.appendChild(b); }
    const fallback = () => { // bez mikrofonu: fouknutí potvrdí rodič tlačítkem
      p.querySelector('.sp-text').textContent = 'Foukej, jak nejdéle vydržíš. Pak klepni na tlačítko.';
    };
    const loop = () => {
      if (!G.R || $('#speechPanel').hidden || !mic) return;
      const now = Date.now(), dt = now - last; last = now;
      mic.an.getFloatTimeDomainData(mic.buf); const lvl = rms(mic.buf);
      // hlas hry z reproduktoru se nepočítá (mlýn by roztočila hra sama)
      if (lvl > BLOW_LEVEL && !G.R.paused && !(synth && synth.speaking)) { done += dt; angle += dt * Math.min(3, lvl * 20); }
      mill.style.transform = `rotate(${angle}deg)`; bar.style.width = Math.min(100, done / BLOW_NEED_MS * 100) + '%';
      if (done >= BLOW_NEED_MS) { stopMic(); finishSpeech(true, false, tok); return; }
      requestAnimationFrame(loop);
    };
    try {
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)(), src = ctx.createMediaStreamSource(stream), an = ctx.createAnalyser();
        an.fftSize = 1024; src.connect(an); mic = { stream, ctx, an, buf: new Float32Array(an.fftSize) }; last = Date.now(); requestAnimationFrame(loop);
      }, fallback);
    } catch (e) { fallback(); }
  }
  const say = G.R.say; setTimeout(() => { if (G.R && G.R.say === say) speak(say); }, 250);
  return true;
}
// konec úkolu v panelu: rodičovo hodnocení zapíše do statistik (say:slovo), sluch se počítá jinde
function finishSpeech(clean, judged, tok) {
  if (!G.R || tok !== spTok || spDoneTok === tok) return;
  spDoneTok = tok;
  G.R.busy = true; stopMic();
  const ms = Date.now() - (G.R.shownAt || Date.now());
  if (judged && G.R.statKey) recordResult(save.stats, G.R.statKey, clean, { ms });
  logTask(ms, [], 0);
  const texName = mineTex(curLevel().tex);
  if (clean) { G.R.clean++; save.emeralds += 1 + luckBonus(); updateGems('hudGems'); dogHappy($('#gameDog')); }
  persist(); clean ? tone(880, 0, .1, 'square', .05) : sfx.nope();
  const pip = $('#pips').children[G.R.i];
  pip.classList.add('done', clean ? 'clean' : 'miss'); pip.style.backgroundImage = `url(${tex(texName)})`;
  G.R.loot.push({ t: texName, clean });
  G.R.i++;
  $('#speechPanel').hidden = true;
  // další úkol po pochvale; pojistka časovačem, kdyby promluvu přerušila jiná (pak by se callback nezavolal)
  const at = G.R.i, go = () => { if (G.R && G.R.i === at && G.R.busy && !G.R.paused) nextTask(); };
  speak(clean ? pick(Math.random, PRAISE) : 'Nevadí, příště to půjde.', () => setTimeout(go, 300));
  setTimeout(go, 2500);
}

export { finishSpeech, genSpeechHear, soundLabel, soundSay, speechActivity, stopMic };
