// První spuštění (Schoolcraft): dokud nikdo nehraje, hra se zeptá na jméno a rod. Adam má hráče z dřívějška.
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { blankPlayer, guessForms } from '../logic/player.ts';
import { NAMEDAYS } from '../content/namedays.ts';
import { loadFamily } from '../world/family.js';
import { applyName } from '../app/name.js';
import { renderHome } from './screens.js';
import { checkNewDay } from '../world/daily.js';

let gender = 'm';
function preview() {
  const n = $('#setupName').value.trim();
  $('#setupVoc').textContent = n ? `Hra bude oslovovat: ${guessForms(n, gender).voc}! (Jde změnit v nastavení.)` : '';
  document.querySelectorAll('#setupGender [data-g]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.g === gender)));
}
function needsSetup() { return !save.player; }
function openSetup(name = '') { $('#setupName').value = name; preview(); $('#setupOverlay').hidden = false; }
function initSetup() {
  $('#setupName').addEventListener('input', preview);
  document.querySelectorAll('#setupGender [data-g]').forEach(b => b.addEventListener('click', () => { gender = b.dataset.g; preview(); }));
  $('#setupForm').addEventListener('submit', e => {
    e.preventDefault();
    const n = $('#setupName').value.trim(); if (!n) return;
    const p = blankPlayer(n, gender);
    const low = n.toLocaleLowerCase('cs'), nd = Object.keys(NAMEDAYS).find(k => NAMEDAYS[k].toLocaleLowerCase('cs').split('|').includes(low));
    if (nd) p.nameday = nd;
    save.player = p; persist(); loadFamily(); applyName();
    $('#setupOverlay').hidden = true; renderHome(); checkNewDay();
  });
}
export { initSetup, needsSetup, openSetup };
