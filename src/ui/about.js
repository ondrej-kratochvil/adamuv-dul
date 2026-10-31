// O hře a soukromí pro rodiče (Ondřej 31. 10. 2026): určení, bezpečnost, co se kam ukládá, smazání, kontakt.
// Dostupné bez zámku: z úvodního nastavení nového hráče, z úvodní obrazovky a z karty Online.
import { $ } from '../core/dom.js';
import { APP_VERSION } from '../app/version.js';

function openAbout() {
  $('#aboutVersion').textContent = `Verze hry ${APP_VERSION}`;
  $('#aboutOverlay').hidden = false;
  const p = $('#aboutOverlay .panel'); if (p) p.scrollTop = 0;
}
function initAbout() {
  ['#btnAbout', '#btnSetupAbout', '#btnOnlineAbout'].forEach(id => { const b = $(id); if (b) b.addEventListener('click', openAbout); });
  $('#btnAboutClose').addEventListener('click', () => { $('#aboutOverlay').hidden = true; });
}
export { initAbout, openAbout };
