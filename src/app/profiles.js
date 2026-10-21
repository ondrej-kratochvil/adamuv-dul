// Profily hráčů v nastavení pro rodiče (pravidla v logic/profiles.ts). Přepnutí uloží seznam a znovu načte hru.
import { $ } from '../core/dom.js';
import { profile, registry, save, saveRegistry } from '../save/save.ts';
import { MAIN_ID, addProfile, backupKeyFor, keyFor, removeProfile } from '../logic/profiles.ts';
import { syncDefaults } from '../logic/sync.ts';

function switchTo(id) { registry.active = id; saveRegistry(); location.reload(); }
// nový profil: od začátku, nebo kopie postupu aktivního profilu; tabulku Google kopie nepřebírá (testy nemají kazit statistiky)
function createProfile(name, copy) {
  const id = addProfile(registry, name);
  if (copy) {
    const data = JSON.parse(JSON.stringify(save));
    // zkopírovaná kola patří původnímu profilu a v tabulce už jsou: kopie je znovu neposílá (backfilled)
    data.sync = { ...syncDefaults(), device: save.sync.device, backfilled: true };
    try { localStorage.setItem(keyFor(id), JSON.stringify(data)); } catch (e) { /* nic */ }
  }
  switchTo(id);
}
function deleteProfile(id) {
  try { localStorage.removeItem(keyFor(id)); localStorage.removeItem(backupKeyFor(id)); } catch (e) { /* nic */ }
  const wasActive = registry.active === id;
  removeProfile(registry, id); saveRegistry();
  if (wasActive) location.reload(); else renderProfiles();
}
function renderProfiles() {
  const box = $('#profileList'); if (!box) return;
  box.innerHTML = '';
  registry.list.forEach(p => {
    const row = document.createElement('div'); row.className = 'profile-row';
    row.insertAdjacentHTML('beforeend', `<b>${p.name.replace(/[<>&]/g, '')}</b>${p.id === MAIN_ID ? ' <small>(hlavní, odesílá do tabulky)</small>' : ''}`);
    if (p.id === profile.id) row.insertAdjacentHTML('beforeend', ' <span class="profile-on">hraje se</span>');
    else { const b = document.createElement('button'); b.className = 'gbtn'; b.textContent = 'Přepnout'; b.addEventListener('click', () => switchTo(p.id)); row.appendChild(b); }
    if (p.id !== MAIN_ID) {
      const d = document.createElement('button'); d.className = 'gbtn'; d.textContent = 'Smazat';
      d.addEventListener('click', () => { if (d.dataset.armed) deleteProfile(p.id); else { d.dataset.armed = '1'; d.textContent = 'Opravdu smazat?'; } });
      row.appendChild(d);
    }
    box.appendChild(row);
  });
  $('#profileCopyLbl').textContent = `kopie postupu: ${profile.name}`;
}
function initProfiles() {
  $('#btnProfileNew').addEventListener('click', () => createProfile($('#profileName').value, $('#profileCopy').checked));
  // na úvodní obrazovce je vidět, že se nehraje Adamův profil
  const badge = $('#profileBadge');
  if (badge) { badge.hidden = profile.id === MAIN_ID; badge.textContent = ''; badge.append(Object.assign(document.createElement('span'), { className: 'ver-long', textContent: 'Profil: ' }), profile.name); badge.title = `Profil: ${profile.name}`; } // na mobilu jen jméno
}
export { createProfile, deleteProfile, initProfiles, renderProfiles, switchTo };
