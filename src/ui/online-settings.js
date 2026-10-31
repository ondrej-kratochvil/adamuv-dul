// Karta Online v nastavení (Schoolcraft): zapnutí, přezdívka, kód pro přenos, smazání ze serveru (app/cloud.js)
import { $ } from '../core/dom.js';
import { BACKUP_KEY, persist, save } from '../save/save.ts';
import { codeOf } from '../logic/cloud.ts';
import { cloudMe, createGroup, deleteCloud, joinGroup, leaveGroup, restoreFromCode, rotateSecret, syncCloud } from '../app/cloud.js';
import { player } from '../app/player.js';
import { applyLetters } from '../logic/letters.ts';
import { loadFamily } from '../world/family.js';
import { codeUrl } from '../logic/qr.ts';
import { drawQr } from '../app/qr.js';
import { openScanner } from './qr-ui.js';

const stamp = t => { const d = new Date(t); return `${d.getDate()}. ${d.getMonth() + 1}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
// skupina pro žebříček: zjistí se ze serveru (kód pozvánky vidí jen rodič v nastavení)
let groupMode = '';
async function renderGroup(msg) {
  const c = save.cloud, info = $('#groupInfo');
  $('#btnGroupNew').hidden = $('#btnGroupJoin').hidden = !c.on; $('#btnGroupLeave').hidden = true;
  if (!c.on) { info.textContent = 'Skupina jde nastavit se zapnutým online.'; return; }
  if (msg) info.textContent = msg;
  if (!c.id) await syncCloud(true);
  if (!save.cloud.id) { if (!msg) info.textContent = 'Zatím bez spojení se serverem.'; return; }
  try {
    const r = await cloudMe(), g = r && r.group;
    $('#btnGroupLeave').hidden = !g;
    if (!msg) info.textContent = g ? `Skupina: ${g.name}. Kód pozvánky pro další hráče: ${g.code}` : 'Hráč zatím není v žádné skupině, žebříček ukazuje jen jeho.';
  } catch (e) { if (!msg) info.textContent = 'Skupinu teď nejde načíst (bez internetu?).'; }
}
function askGroup(mode) {
  groupMode = mode; const f = $('#groupField');
  f.hidden = false; f.value = ''; f.placeholder = mode === 'new' ? 'Název skupiny, třeba Rodina Kratochvílových nebo 1. A' : 'Kód pozvánky (12 znaků)';
  $('#groupGo').hidden = false; f.focus();
}
async function groupOk() {
  const v = $('#groupField').value.trim(); if (!v) return;
  try {
    const g = groupMode === 'new' ? await createGroup(v) : await joinGroup(v);
    $('#groupField').hidden = true; $('#groupGo').hidden = true;
    await syncCloud(true); renderGroup(groupMode === 'new' ? `Skupina ${g.name} je založená. Kód pozvánky pošlete ostatním rodičům: ${g.code}` : `Hráč je ve skupině ${g.name}.`);
  } catch (e) { renderGroup(String(e && e.message) === 'no group' ? 'Skupina s tímhle kódem neexistuje. Zkontrolujte kód.' : 'Nepovedlo se (bez internetu?). Zkuste to znovu.'); }
}
function renderOnline(msg) {
  const c = save.cloud;
  $('#btnCloudOn').setAttribute('aria-pressed', String(c.on)); $('#btnCloudOn').textContent = c.on ? 'Online: zapnuto' : 'Online: vypnuto';
  $('#btnCloudPub').hidden = !c.on; $('#btnCloudPub').setAttribute('aria-pressed', String(c.pub !== false)); $('#btnCloudPub').textContent = c.pub !== false ? 'V žebříčku: ano' : 'V žebříčku: ne';
  if (document.activeElement !== $('#cloudNick')) $('#cloudNick').value = c.nick || player().name || '';
  $('#cloudInfo').textContent = msg || (!c.on ? 'Vypnuto: nic se neposílá, hráč v žebříčku není.' : c.error ? `Naposledy se nepodařilo spojit se serverem (${c.error}). Zkusí se to znovu.` : c.last ? `Připojeno, naposledy odesláno ${stamp(c.last)}.` : 'Zapnuto, první odeslání proběhne po nejbližším kole.');
}
function initOnline() {
  $('#btnCloudOn').addEventListener('click', () => { save.cloud.on = !save.cloud.on; persist(); renderOnline(); renderGroup(); if (save.cloud.on) syncCloud(true).then(() => { renderOnline(); renderGroup(); }); });
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
  // QR kód hráče (Ondřej 31. 10. 2026): ukázat a načíst fotoaparátem
  $('#btnCloudQr').addEventListener('click', async () => {
    if (!save.cloud.id) await syncCloud(true);
    const code = codeOf(save.cloud);
    if (!code) { renderOnline('QR kód zatím není: zapněte online a připojte se k internetu.'); return; }
    drawQr($('#cloudQr'), codeUrl(code)); $('#cloudQrBox').hidden = false;
  });
  $('#btnCloudScan').addEventListener('click', () => openScanner(offerRestore));
  $('#btnCloudRestore').addEventListener('click', () => { box.hidden = false; box.readOnly = false; box.value = ''; box.placeholder = 'Sem vložte kód hráče'; box.focus(); $('#cloudRestoreConfirm').hidden = true; });
  box.addEventListener('input', () => { if (!box.readOnly) $('#cloudRestoreConfirm').hidden = !/^\s*[a-f0-9-]{36}\.[a-f0-9]{64}\s*$/.test(box.value); });
  $('#btnCloudRestoreNo').addEventListener('click', () => { $('#cloudRestoreConfirm').hidden = true; });
  $('#btnCloudRestoreYes').addEventListener('click', async () => {
    $('#cloudRestoreConfirm').hidden = true;
    try { await restoreFromCode(box.value, BACKUP_KEY); applyLetters(save.letters, save.cursive); loadFamily(); box.hidden = true; renderOnline('Postup je stažený ze serveru.'); }
    catch (e) { renderOnline('Nepovedlo se: ' + (e && e.message || e)); }
  });
  $('#btnGroupNew').addEventListener('click', () => askGroup('new'));
  $('#btnGroupJoin').addEventListener('click', () => askGroup('join'));
  $('#btnGroupOk').addEventListener('click', groupOk);
  $('#btnGroupLeave').addEventListener('click', async () => { try { await leaveGroup(); renderGroup('Hráč skupinu opustil, žebříček ukazuje jen jeho.'); } catch (e) { renderGroup('Nepovedlo se (bez internetu?).'); } });
  // výměna kódu hráče: starý kód i QR přestanou platit
  $('#btnCloudRotate').addEventListener('click', () => { $('#cloudRotateConfirm').hidden = false; });
  $('#btnCloudRotateNo').addEventListener('click', () => { $('#cloudRotateConfirm').hidden = true; });
  $('#btnCloudRotateYes').addEventListener('click', async () => {
    $('#cloudRotateConfirm').hidden = true; $('#cloudQrBox').hidden = true; $('#cloudCode').hidden = true;
    try { if (!save.cloud.id) await syncCloud(true); await rotateSecret(); renderOnline('Kód hráče je vyměněný. Starý kód ani QR už neplatí.'); }
    catch (e) { renderOnline('Výměna se nepovedla (bez internetu?). Starý kód platí dál.'); }
  });
  $('#btnCloudDelete').addEventListener('click', () => { $('#cloudDeleteConfirm').hidden = false; });
  $('#btnCloudDeleteNo').addEventListener('click', () => { $('#cloudDeleteConfirm').hidden = true; });
  $('#btnCloudDeleteYes').addEventListener('click', async () => {
    $('#cloudDeleteConfirm').hidden = true;
    try { await deleteCloud(); renderOnline('Smazáno ze serveru, online hraní je vypnuté.'); } catch (e) { renderOnline('Smazání se nepovedlo (bez internetu?). Zkuste to znovu.'); }
  });
}
// kód z QR nebo z adresy: vyplnit a nabídnout nahrazení postupu (rodič potvrdí)
function offerRestore(code) {
  const box = $('#cloudCode'); box.hidden = false; box.readOnly = false; box.value = code;
  $('#cloudRestoreConfirm').hidden = false; renderOnline('Kód hráče je načtený. Potvrďte nahrazení postupu.');
}
export { initOnline, offerRestore, renderGroup, renderOnline };
