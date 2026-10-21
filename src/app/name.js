// Název hry, který si vybral Adam
import { changesBetween, versionLabel } from '../logic/version.ts';
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { speak, synth } from '../audio/speech.js';
import { audio, tone } from '../audio/sfx.js';
import { renderHome } from '../ui/screens.js';
import { APP_VERSION } from './version.js';
import { setBtn } from '../ui/icons.js';

// nadpis a nabídka jsou v čitelném písmu (Andika), takže háčky a kroužky nevadí
const GAME_NAMES = ['Adamův důl', 'Adamcraft', 'Adamovo království', 'Adamova farma', 'Adamův hrad', 'Adamův svět'];
const gameName = () => GAME_NAMES.includes(save.gameName) ? save.gameName : GAME_NAMES[0];
function applyName() {
  const n = gameName(), t = $('#gameTitle');
  t.textContent = n; document.title = n;
  t.style.fontSize = n.length > 11 ? `clamp(24px, ${(70 / n.length).toFixed(1)}vw, 52px)` : ''; // dlouhý název menším písmem
}
function openNames() {
  audio(); renderNames(); $('#nameOverlay').hidden = false;
  // názvy s čísly: Adam si zapamatuje číslo a klepne na něj, i když název nepřečte
  speak('Jak se má hra jmenovat? ' + GAME_NAMES.map((n, i) => `Číslo ${i + 1}: ${n}.`).join(' ') + ' Klepni na číslo, které se ti líbí.');
}
function renderNames() {
  const list = $('#nameList'); list.innerHTML = '';
  GAME_NAMES.forEach(n => {
    const i = GAME_NAMES.indexOf(n) + 1;
    const b = document.createElement('button'); b.className = 'gbtn'; b.innerHTML = `<span class="num">${i}</span><span>${n}</span>`; b.setAttribute('aria-label', `${i}: ${n}`); b.setAttribute('aria-pressed', String(gameName() === n));
    b.addEventListener('click', () => { save.gameName = n; persist(); applyName(); renderNames(); tone(880, 0, .08, 'square', .05); tone(1320, .07, .1, 'square', .05); speak(`Číslo ${i}: ${n}`); });
    list.appendChild(b);
  });
}
let serverVersion = null;
async function checkVersion() {
  try {
    const r = await fetch('version.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) return;
    serverVersion = await r.json();
    if (!$('#home').hidden) renderHome();
  } catch (e) {}
}
function notesSince(from, to) { return changesBetween(serverVersion ? serverVersion.changes : [], from, to); }
const cap = s => s[0].toUpperCase() + s.slice(1);
let updateSpoken = 0; // novinky se přečtou jednou za spuštění
function renderUpdate(wrap) {
  const box = document.createElement('div'); box.className = 'update';
  let title, notes, btn;
  if (serverVersion && serverVersion.version > APP_VERSION) {
    // na serveru je novější verze, než právě běží
    title = `Je tu nová ${versionLabel(serverVersion.version)}!`; notes = notesSince(APP_VERSION, serverVersion.version); btn = ['refresh', 'Aktualizovat', () => { G.speechId++; if (synth) synth.cancel(); location.reload(); }];
  } else if (save.seenVersion < APP_VERSION && (save.seenVersion > 0 || save.total > 0)) {
    // hra se právě aktualizovala: jednou ukázat novinky
    title = `Co je nového ve hře, ${versionLabel(APP_VERSION)}`; notes = notesSince(save.seenVersion || APP_VERSION - 1, APP_VERSION);
    btn = ['check', 'Rozumím', () => { G.speechId++; if (synth) synth.cancel(); save.seenVersion = APP_VERSION; persist(); renderHome(); }];
  } else {
    if (save.seenVersion !== APP_VERSION) { save.seenVersion = APP_VERSION; persist(); } // první spuštění: bez novinek
    return;
  }
  // tlačítko popsat obrázkem i nápisem: Adam ho pozná podle obrázku a postupně si spojí i nápis
  const hint = btn[0] === 'check' ? ' Až budeš chtít hrát, klepni na zelené tlačítko s fajfkou, je na něm napsáno Rozumím.' : ' Novou verzi spustíš zeleným tlačítkem s kruhovou šipkou, je na něm napsáno Aktualizovat.';
  // novinky po verzích, od nejstarší, každá s číslem verze
  const one = notes.length === 1;
  const say = `${title}. ${notes.map(c => (one ? '' : `${cap(versionLabel(c.version))}. `) + c.notes.join(' ')).join(' ')}${hint}`;
  box.innerHTML = `<b>${title}</b>${notes.length ? `<ul>${notes.map(c => `<li>${one ? '' : `<span class="ver-n">${c.version}</span> `}${c.notes.join(' ')}</li>`).join('')}</ul>` : ''}<div class="actions"><button class="gbtn go"></button><button class="gbtn"></button></div>`;
  const [b1, b2] = box.querySelectorAll('button');
  setBtn(b1, btn[0], btn[1]); setBtn(b2, 'speaker', 'Přečíst znovu');
  b1.addEventListener('click', btn[2]);
  b2.addEventListener('click', () => { audio(); speak(say); });
  wrap.appendChild(box);
  // přečíst hned; prohlížeč pustí hlas až po prvním doteku, proto případně počkat na první klepnutí kamkoli
  const key = title + serverVersion?.version;
  if (updateSpoken === key) return;
  updateSpoken = key;
  const go = () => { if (!$('#home').hidden && document.body.contains(box)) speak(say); };
  if (navigator.userActivation?.hasBeenActive) go();
  else document.addEventListener('pointerdown', function first(e) { document.removeEventListener('pointerdown', first, true); if (!b1.contains(e.target)) { audio(); go(); } }, true);
}

// číslo verze na úvodní obrazovce: klepnutí ho přečte (a řekne, když je na internetu novější)
function renderVersion() {
  const b = $('#btnVersion'); if (!b) return;
  setBtn(b, 'tag', `<span class="ver-long">${versionLabel(APP_VERSION).replace(/\d+$/, '')}</span><span class="ver-short">v</span>${APP_VERSION}`); // na mobilu jen „v47“
  b.onclick = () => { audio(); speak(`Hra má číslo verze ${APP_VERSION}.` + (serverVersion && serverVersion.version > APP_VERSION ? ` Na internetu už čeká verze ${serverVersion.version}.` : '')); };
}
export { renderVersion, GAME_NAMES, applyName, checkVersion, gameName, notesSince, openNames, renderNames, renderUpdate, serverVersion, updateSpoken };
