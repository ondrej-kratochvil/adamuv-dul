// Karta Online v nastavení (Schoolcraft): zapnutí, přezdívka, kód pro přenos, smazání ze serveru (app/cloud.js)
import { $ } from '../core/dom.js';
import { BACKUP_KEY, persist, save } from '../save/save.ts';
import { codeOf } from '../logic/cloud.ts';
import { deleteCloud, restoreFromCode, syncCloud } from '../app/cloud.js';
import { player } from '../app/player.js';
import { applyLetters } from '../logic/letters.ts';
import { loadFamily } from '../world/family.js';

const stamp = t => { const d = new Date(t); return `${d.getDate()}. ${d.getMonth() + 1}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
function renderOnline(msg) {
  const c = save.cloud;
  $('#btnCloudOn').setAttribute('aria-pressed', String(c.on)); $('#btnCloudOn').textContent = c.on ? 'Online: zapnuto' : 'Online: vypnuto';
  $('#btnCloudPub').hidden = !c.on; $('#btnCloudPub').setAttribute('aria-pressed', String(c.pub !== false)); $('#btnCloudPub').textContent = c.pub !== false ? 'V žebříčku: ano' : 'V žebříčku: ne';
  if (document.activeElement !== $('#cloudNick')) $('#cloudNick').value = c.nick || player().name || '';
  $('#cloudInfo').textContent = msg || (!c.on ? 'Vypnuto: nic se neposílá, hráč v žebříčku není.' : c.error ? `Naposledy se nepodařilo spojit se serverem (${c.error}). Zkusí se to znovu.` : c.last ? `Připojeno, naposledy odesláno ${stamp(c.last)}.` : 'Zapnuto, první odeslání proběhne po nejbližším kole.');
}
function initOnline() {
  $('#btnCloudOn').addEventListener('click', () => { save.cloud.on = !save.cloud.on; persist(); renderOnline(); if (save.cloud.on) syncCloud(true).then(() => renderOnline()); });
  $('#btnCloudPub').addEventListener('click', () => { save.cloud.pub = save.cloud.pub === false; persist(); renderOnline(); syncCloud(true).then(() => renderOnline()); });
  $('#cloudNick').addEventListener('change', e => { save.cloud.nick = e.target.value.trim().slice(0, 20); persist(); syncCloud(true).then(() => renderOnline('Přezdívka uložena.')); });
  const box = $('#cloudCode');
  $('#btnCloudCode').addEventListener('click', async () => {
    if (!save.cloud.id) await syncCloud(true);
    const code = codeOf(save.cloud);
    if (!code) { renderOnline('Kód zatím není: zapněte online a připojte se k internetu.'); return; }
    box.hidden = false; box.readOnly = true; box.value = code; box.focus(); box.select();
    try { await navigator.clipboard.writeText(code); renderOnline('Kód je zkopírovaný do schránky.'); } catch (e) { renderOnline('Kód je označený, zkopírujte ho.'); }
  });
  $('#btnCloudRestore').addEventListener('click', () => { box.hidden = false; box.readOnly = false; box.value = ''; box.placeholder = 'Sem vložte kód hráče'; box.focus(); $('#cloudRestoreConfirm').hidden = true; });
  box.addEventListener('input', () => { if (!box.readOnly) $('#cloudRestoreConfirm').hidden = !/^\s*[a-f0-9-]{36}\.[a-f0-9]{64}\s*$/.test(box.value); });
  $('#btnCloudRestoreNo').addEventListener('click', () => { $('#cloudRestoreConfirm').hidden = true; });
  $('#btnCloudRestoreYes').addEventListener('click', async () => {
    $('#cloudRestoreConfirm').hidden = true;
    try { await restoreFromCode(box.value, BACKUP_KEY); applyLetters(save.letters, save.cursive); loadFamily(); box.hidden = true; renderOnline('Postup je stažený ze serveru.'); }
    catch (e) { renderOnline('Nepovedlo se: ' + (e && e.message || e)); }
  });
  $('#btnCloudDelete').addEventListener('click', () => { $('#cloudDeleteConfirm').hidden = false; });
  $('#btnCloudDeleteNo').addEventListener('click', () => { $('#cloudDeleteConfirm').hidden = true; });
  $('#btnCloudDeleteYes').addEventListener('click', async () => {
    $('#cloudDeleteConfirm').hidden = true;
    try { await deleteCloud(); renderOnline('Smazáno ze serveru, online hraní je vypnuté.'); } catch (e) { renderOnline('Smazání se nepovedlo (bez internetu?). Zkuste to znovu.'); }
  });
}
export { initOnline, renderOnline };
