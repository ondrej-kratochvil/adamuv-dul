// První spuštění (Schoolcraft): dokud nikdo nehraje, hra se zeptá na jméno a rod. Adam má hráče z dřívějška.
import { $ } from '../core/dom.js';
import { speak } from '../audio/speech.js';
import { persist, save } from '../save/save.ts';
import { blankPlayer, guessForms } from '../logic/player.ts';
import { NAMEDAYS } from '../content/namedays.ts';
import { CONS_ORDER } from '../content/alphabet.ts';
import { applyLetters, normalizeLetters } from '../logic/letters.ts';
import { loadFamily } from '../world/family.js';
import { applyName } from '../app/name.js';
import { renderHome } from './screens.js';
import { checkNewDay } from '../world/daily.js';
import { askCodeRestore, openScanner } from './qr-ui.js';

let gender = 'm', letters = ['M', 'L', 'S'];
function renderLetters() {
  const box = $('#setupLetters'); box.innerHTML = '';
  CONS_ORDER.forEach(c => {
    const b = document.createElement('button'); b.className = 'gbtn'; b.type = 'button'; b.textContent = c; b.dataset.letter = c;
    b.setAttribute('aria-pressed', String(letters.includes(c)));
    b.addEventListener('click', () => { const on = letters.includes(c); letters = CONS_ORDER.filter(x => x === c ? !on : letters.includes(x)); renderLetters(); });
    box.appendChild(b);
  });
}
function preview() {
  const n = $('#setupName').value.trim();
  $('#setupVoc').textContent = n ? `Hra bude oslovovat: ${guessForms(n, gender).voc}! (Jde změnit v nastavení.)` : '';
  document.querySelectorAll('#setupGender [data-g]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.g === gender)));
}
function needsSetup() { return !save.player; }
function openSetup(name = '') { $('#setupName').value = name; letters = [...save.letters]; preview(); renderLetters(); $('#setupOverlay').hidden = false; }
function initSetup() {
  $('#btnSetupCode').addEventListener('click', () => openScanner(askCodeRestore)); // hráč z jiného zařízení (QR kód)
  $('#setupName').addEventListener('input', preview);
  document.querySelectorAll('#setupGender [data-g]').forEach(b => b.addEventListener('click', () => { gender = b.dataset.g; preview(); }));
  $('#setupForm').addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#setupName').value.trim(); if (!n) return;
    if (!letters.length) { $('#setupVoc').textContent = 'Vyberte aspoň jednu souhlásku, kterou už zná (třeba M).'; speak('Vyberte aspoň jednu souhlásku.'); return; }
    const p = blankPlayer(n, gender);
    const low = n.toLocaleLowerCase('cs'), nd = Object.keys(NAMEDAYS).find(k => NAMEDAYS[k].toLocaleLowerCase('cs').split('|').includes(low));
    if (nd) p.nameday = nd;
    save.player = p; save.letters = letters; applyLetters(save.letters, save.cursive); persist(); loadFamily(); applyName();
    $('#setupOverlay').hidden = true; renderHome(); checkNewDay();
  });
}
export { initSetup, needsSetup, openSetup };
