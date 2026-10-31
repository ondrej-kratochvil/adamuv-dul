// Návštěva v nastavení (část Vzkazy a návštěva): kdo z rodiny je dnes na návštěvě (world/family.js, logic/family.ts)
import { $ } from '../core/dom.js';
import { FANS, setVisit, visitNow, visitors } from '../world/family.js';
import { renderHome } from './screens.js';
import { dayStr } from '../logic/calendar.ts';

let picked = [];
function renderVisit(msg) {
  const v = visitNow(), on = visitors();
  if (!picked.length) picked = v.d === dayStr() ? [...v.ids] : [];
  const box = $('#visitWho'); box.innerHTML = '';
  FANS.forEach(p => {
    const b = document.createElement('button'); b.className = 'gbtn'; b.type = 'button'; b.textContent = p.name; b.dataset.who = p.id;
    b.setAttribute('aria-pressed', String(picked.includes(p.id)));
    b.addEventListener('click', () => { picked = picked.includes(p.id) ? picked.filter(x => x !== p.id) : [...picked, p.id]; renderVisit(); });
    box.appendChild(b);
  });
  $('#btnVisitOff').hidden = !on.length;
  $('#visitInfo').textContent = msg || (on.length ? `Dnes na návštěvě: ${on.map(p => p.name).join(', ')}.` : 'Dnes nikdo na návštěvě, fandí celá rodina.');
}
function initVisit() {
  $('#btnVisitOn').addEventListener('click', () => {
    if (!picked.length) { renderVisit('Vyberte, kdo je na návštěvě.'); return; }
    setVisit(picked); renderHome(); renderVisit();
  });
  $('#btnVisitOff').addEventListener('click', () => { picked = []; setVisit([]); renderHome(); renderVisit('Návštěva skončila, zase fandí celá rodina.'); });
}
export { initVisit, renderVisit };
