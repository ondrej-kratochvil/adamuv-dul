// Nastavení
import { voc } from '../app/player.js';
import { $ } from '../core/dom.js';
import { BACKUP_KEY, defaults, persist, profile, save, replaceSave } from '../save/save.ts';
import { exportText, importText } from '../save/schema.ts';
import { PRON_MODES, RISKY_SYLLABLES, RISKY_WORDS, defaultMode, pronounceAs } from '../logic/pronounce.ts';
import { iconSvg } from './icons.js';
import { gateOk, makeGate } from '../logic/gate.ts';
import { tierOf } from '../gfx/player.js';
import { csVoice, loadVoices, speak, synth, voicesKnown } from '../audio/speech.js';
import { renderHome } from './screens.js';
import { FARM_STAGES, farmStage } from '../world/farm.js';
import { streakNow } from '../rewards/streak.js';
import { renderNotes } from '../world/family.js';
import { ENCH_ORDER, masteryPoints } from '../rewards/enchant.js';
import { backfillCount, backfillLog, flushSync } from '../app/sync.js';
import { renderProfiles } from '../app/profiles.js';
import { MAIN_ID } from '../logic/profiles.ts';
import { renameDevice, syncDefaults, validSyncUrl } from '../logic/sync.ts';
import { initPlayerSet, renderPlayerSet } from './player-settings.js';
import { initOnline, renderOnline } from './online-settings.js';
import { initPushSettings, renderPush } from './push-settings.js';
import { canVibrate, setVibration, storageProtected, vibrationOn } from '../app/device.js';
import { CONS_ORDER } from '../content/alphabet.ts';
import { applyLetters, normalizeLetters } from '../logic/letters.ts';
import { SYLL } from '../content/letters.ts';
import { WORDS } from '../content/words.ts';

// karta Hlas upozorní, když chybí český hlas (návod je až uvnitř karty)
function voiceTabWarn() { const t = $('.set-tabs [data-tab="voice"]'); if (t) t.classList.toggle('warn', !$('#voiceHelp').hidden); }
function updateVoiceInfo() {
  const el = $('#voiceInfo'); if (!el) return;
  if (!synth) { el.innerHTML = '<span class="voice-bad">Prohlížeč neumí předčítat.</span>'; $('#voiceHelp').hidden = false; voiceTabWarn(); return; }
  if (csVoice) { el.innerHTML = `<span class="voice-ok">Český hlas: ${csVoice.name}</span>`; $('#voiceHelp').hidden = true; }
  else if (voicesKnown) { el.innerHTML = '<span class="voice-bad">Český hlas nebyl nalezen.</span>'; $('#voiceHelp').hidden = false; }
  else { el.textContent = 'Zjišťuji dostupné hlasy… Klepněte na Vyzkoušet hlas.'; $('#voiceHelp').hidden = true; }
  voiceTabWarn();
}
function updateSettings() {
  document.querySelectorAll('#segCase [data-case]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.case === save.caseMode)));
  document.querySelectorAll('#segStrict [data-strict]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.strict === save.strict)));
  $('#rateNormal').setAttribute('aria-pressed', String(!save.slow));
  $('#rateSlow').setAttribute('aria-pressed', String(save.slow));
  const st = Math.min(12, save.total);
  $('#progressInfo').textContent = `Odehraná kola: písmena ${save.rounds.letters}, slabiky ${save.rounds.syllables}, slova ${save.rounds.words}, čtení ${save.rounds.reading}, čísla ${save.rounds.numbers}, počty ${save.rounds.math}, psaní ${save.rounds.writing}, mluvení ${save.rounds.speech || 0}. Dům: ${st} z 12 dílů. Farma: ${farmStage()} z ${FARM_STAGES.length}. Smaragdy: ${save.emeralds}. Řada: ${streakNow().count} (nejdelší ${save.streak.best}). Krumpáč: ${tierOf(save.total).name}. Očarování: ${save.ench.length} z ${ENCH_ORDER.length} (zvládnuto ${masteryPoints().pts} z ${masteryPoints().max} úkolů).`;
  updateVoiceInfo();
  renderPlayerSet();
  renderLetters();
  renderOnline(); renderPush(); renderDevice();
}
// písmena zapnutá rodičem (logic/letters.ts)
function renderLetters() {
  const box = $('#letterToggles'); box.innerHTML = '';
  CONS_ORDER.forEach(c => {
    const b = document.createElement('button'); b.className = 'gbtn'; b.type = 'button'; b.textContent = c; b.dataset.letter = c;
    b.setAttribute('aria-pressed', String(save.letters.includes(c)));
    b.addEventListener('click', () => {
      const on = save.letters.includes(c);
      if (on && save.letters.length === 1) { $('#lettersInfo').textContent = 'Aspoň jedna souhláska musí zůstat zapnutá. Nejdřív zapněte jinou a pak tuhle vypněte.'; return; }
      save.letters = normalizeLetters(on ? save.letters.filter(x => x !== c) : [...save.letters, c]);
      applyLetters(save.letters, save.cursive); persist(); renderLetters();
    });
    box.appendChild(b);
  });
  $('#lettersInfo').textContent = `Zapnuto: ${save.letters.join(', ')}. Ve hře je teď ${SYLL.length} slabik a ${WORDS.length} slov.`;
  $('#btnCursive').setAttribute('aria-pressed', String(!!save.cursive));
  $('#btnCursive').textContent = save.cursive ? 'Psací písmo: zapnuto' : 'Psací písmo: vypnuto';
}
// Nastavení je pro rodiče: otevře se po vyřešení příkladu pro dospělého (logic/gate.ts)
let gate = null;
// karty nastavení; při dalším otevření zůstane naposledy otevřená karta
let setTab = 'game';
function showSetTab(tab) {
  setTab = tab;
  document.querySelectorAll('.set-tabs [data-tab]').forEach(b => { b.setAttribute('aria-selected', String(b.dataset.tab === tab)); b.tabIndex = b.dataset.tab === tab ? 0 : -1; });
  document.querySelectorAll('.set-tab').forEach(p => { p.hidden = p.dataset.tab !== tab; });
  const panel = $('#setOverlay .panel'); if (panel) panel.scrollTop = 0;
}
document.querySelectorAll('.set-tabs [data-tab]').forEach(b => b.addEventListener('click', () => showSetTab(b.dataset.tab)));
function openSettings() { renderProfiles(); updateSettings(); renderNotes(); updateRestore(); renderPron(); updateSync(); $('#resetConfirm').hidden = true; showSetTab(setTab); $('#setOverlay').hidden = false; }
function openGate() {
  gate = makeGate();
  $('#gateQ').textContent = gate.text; $('#gateInput').value = ''; $('#gateMsg').textContent = '';
  $('#gateOverlay').hidden = false; $('#gateInput').focus();
  speak('Tohle je nastavení pro rodiče.');
}
$('#btnSettings').addEventListener('click', openGate);
$('#btnGoOnline').addEventListener('click', () => showSetTab('online'));
initPlayerSet();
initOnline();
initPushSettings();
$('#btnVibrate').addEventListener('click', () => { setVibration(!vibrationOn()); renderDevice(); if (vibrationOn() && canVibrate()) navigator.vibrate(60); });
// vibrace a ochrana uloženého postupu (app/device.js)
function renderDevice() {
  const on = vibrationOn(); $('#btnVibrate').setAttribute('aria-pressed', String(on)); $('#btnVibrate').textContent = canVibrate() ? (on ? 'Vibrace: zapnuto' : 'Vibrace: vypnuto') : 'Vibrace: zařízení neumí';
  storageProtected().then(p => { $('#storageInfo').textContent = p === true ? 'Uložení v zařízení: chráněné, prohlížeč ho sám nesmaže.' : p === false ? 'Uložení v zařízení: prohlížeč ho při nedostatku místa může smazat. Pomůže hra přidaná na plochu, nebo zapnuté online (záloha na serveru).' : ''; });
}
$('#btnCursive').addEventListener('click', () => { save.cursive = !save.cursive; applyLetters(save.letters, save.cursive); persist(); renderLetters(); });
$('#gateForm').addEventListener('submit', e => {
  e.preventDefault();
  if (gate && gateOk(gate, $('#gateInput').value)) { $('#gateOverlay').hidden = true; gate = null; openSettings(); return; }
  gate = makeGate(); // po chybě nový příklad, tipovat nejde
  $('#gateQ').textContent = gate.text; $('#gateInput').value = ''; $('#gateMsg').textContent = 'To není správně. Tady je nový příklad.';
  $('#gateInput').focus();
});
$('#btnGateNo').addEventListener('click', () => { $('#gateOverlay').hidden = true; gate = null; });
$('#btnSetClose').addEventListener('click', () => { $('#setOverlay').hidden = true; renderHome(); });
document.querySelectorAll('#segCase [data-case]').forEach(b => b.addEventListener('click', () => { save.caseMode = b.dataset.case; persist(); updateSettings(); }));
document.querySelectorAll('#segStrict [data-strict]').forEach(b => b.addEventListener('click', () => { save.strict = b.dataset.strict; persist(); updateSettings(); }));
$('#rateNormal').addEventListener('click', () => { save.slow = false; persist(); updateSettings(); });
$('#rateSlow').addEventListener('click', () => { save.slow = true; persist(); updateSettings(); });
$('#btnTestVoice').addEventListener('click', () => { loadVoices(); speak(`Ahoj ${voc()}! Tady je hra. ` + ['MA', 'MÉ', 'SO', 'LY'].map(s => pronounceAs(s, save.pron?.[s] || defaultMode(s))).join('. ') + '.'); setTimeout(loadVoices, 800); });
$('#btnReset').addEventListener('click', () => { $('#resetConfirm').hidden = false; });
// tabulka Google (app/sync.js, návod docs/google-tabulka.md)
const fmtWhen = t => { const d = new Date(t); return `${d.getDate()}. ${d.getMonth() + 1}. ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
function updateSync(msg) {
  const s = save.sync; $('#syncUrl').value = s.url; $('#syncDevice').value = s.device;
  // adresa patří každému profilu zvlášť (21. 10. 2026: na profilu Ondra to vypadalo, že se adresa smazala)
  const other = profile.id !== MAIN_ID ? `Hraje se profil ${profile.name}. Adresa tabulky se nastavuje pro každý profil zvlášť, ` : '';
  $('#syncInfo').textContent = msg || (!s.url ? (other ? other + `Adamův profil ji má svou. Tenhle profil zatím do tabulky neposílá; když adresu zadáte, jeho záznamy budou mít sloupec Profil.` : 'Zatím nenastaveno, statistiky zůstávají jen v tabletu.')
    : `Odesláno ${s.sent} záznamů${s.last ? `, naposledy ${fmtWhen(s.last)}` : ''}. Čeká na odeslání: ${s.queue.length}.${s.error ? ` Poslední chyba: ${s.error}` : ''}`);
}
$('#btnSyncSave').addEventListener('click', () => {
  const dn = $('#syncDevice').value.trim(); if (dn && dn !== save.sync.device) renameDevice(save.sync, dn.slice(0, 40)); // název i adresa v jednom kroku
  const u = $('#syncUrl').value.trim();
  if (u && !validSyncUrl(u)) { updateSync('Tohle není adresa nasazeného skriptu. Má vypadat jako https://script.google.com/macros/s/…/exec'); return; }
  save.sync.url = u; save.sync.error = ''; persist();
  updateSync(u ? 'Adresa uložena. Zkouším odeslat…' : 'Odesílání vypnuto.');
  if (!u) return;
  // poprvé: zeptat se, jestli poslat i kola odehraná dřív (na zařízení, kde se hra jen zkoušela, je posílat nechceme)
  const n = backfillCount();
  if (n) { $('#backfillInfo').textContent = `Na tomhle zařízení je ${n} starších kol. Poslat je do tabulky taky? Když se tu hra jen zkoušela, zvolte Jen nová.`; $('#backfillConfirm').hidden = false; return; }
  syncNow();
});
$('#btnBackfillYes').addEventListener('click', () => { $('#backfillConfirm').hidden = true; backfillLog(); syncNow(); });
$('#btnBackfillNo').addEventListener('click', () => { $('#backfillConfirm').hidden = true; save.sync.backfilled = true; persist(); syncNow(); });
async function syncNow() {
  if (!save.sync.url) { updateSync(); return; }
  if (!save.sync.queue.length) { updateSync('Není co odeslat, všechno už v tabulce je.'); return; }
  $('#syncInfo').textContent = 'Odesílám…';
  await flushSync(); updateSync();
}
$('#btnSyncNow').addEventListener('click', syncNow);
$('#syncDevice').addEventListener('change', e => { const v = e.target.value.trim(); if (v) { renameDevice(save.sync, v.slice(0, 40)); persist(); updateSync('Název uložen. Nové záznamy půjdou do tabulky s tímhle názvem.'); } });
$('#btnResetNo').addEventListener('click', () => { $('#resetConfirm').hidden = true; });
$('#btnResetYes').addEventListener('click', () => { try { localStorage.setItem(BACKUP_KEY, JSON.stringify(save)); } catch (e) {} const keep = { sync: { ...syncDefaults(), url: save.sync.url, device: save.sync.device, uid: save.sync.uid }, caseMode: save.caseMode, slow: save.slow, strict: save.strict, pron: save.pron, outfit: save.outfit, notes: save.notes, dogName: save.dogName, player: save.player, gameName: save.gameName, letters: save.letters, cursive: save.cursive }; /* nastavení rodiče včetně výslovnosti zůstává */ replaceSave(Object.assign(defaults(), keep)); applyLetters(save.letters, save.cursive); persist(); updateRestore(); $('#resetConfirm').hidden = true; updateSettings(); });

/* výslovnost slabik: rodič poslechne varianty a vybere tu, která na jeho tabletu zní česky */
const PRON_LABEL = { plain: 'obyčejně', split: 'rozděleně', letters: 's písmeny' };
function renderPron() {
  const list = $('#pronList'); list.innerHTML = '';
  if (!save.pron) save.pron = {};
  [...RISKY_SYLLABLES, ...RISKY_WORDS].forEach(item => {
    const row = document.createElement('div'); row.className = 'pron-row';
    row.insertAdjacentHTML('beforeend', `<b>${item.toLocaleLowerCase('cs')}</b>`);
    const cur = save.pron[item] || defaultMode(item);
    PRON_MODES.forEach(m => {
      const b = document.createElement('button'); b.className = 'gbtn'; b.dataset.item = item; b.dataset.mode = m;
      b.innerHTML = `${iconSvg('speaker')}<span class="lbl">${PRON_LABEL[m]}</span>`; b.setAttribute('aria-pressed', String(cur === m));
      b.addEventListener('click', () => { save.pron[item] = m; persist(); renderPron(); speak(pronounceAs(item, m)); });
      row.appendChild(b);
    });
    list.appendChild(row);
  });
}

/* záloha: vrácení vymění zálohu a současný stav (jde to vrátit i zpátky) */
function readBackup() { try { const raw = localStorage.getItem(BACKUP_KEY); return raw ? importText(raw) : null; } catch (e) { return null; } }
function updateRestore() { $('#btnRestore').hidden = !readBackup(); $('#restoreConfirm').hidden = true; }
$('#btnRestore').addEventListener('click', () => {
  const b = readBackup(); if (!b) return updateRestore();
  $('#restoreInfo').textContent = `Vrátit zálohu? V záloze je ${b.total} povedených kol, ${b.emeralds} smaragdů, řada ${b.streak.count} dní. Současný stav (${save.total} kol) se uloží místo ní, takže jde vrátit zpátky.`;
  $('#restoreConfirm').hidden = false;
});
$('#btnRestoreNo').addEventListener('click', () => { $('#restoreConfirm').hidden = true; });
$('#btnRestoreYes').addEventListener('click', () => {
  const b = readBackup(); if (!b) return updateRestore();
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify(save)); } catch (e) {}
  b.sync = save.sync; // odesílání patří zařízení, ne postupu
  replaceSave(b); persist(); updateSettings(); updateRestore();
  $('#transferMsg').textContent = 'Záloha je vrácená.';
});

/* přenos postupu na jiný tablet */
const tt = $('#transferText'), msg = $('#transferMsg');
let pending = null;
$('#btnExport').addEventListener('click', () => {
  const text = exportText(save);
  tt.hidden = false; tt.readOnly = true; tt.value = text; $('#importConfirm').hidden = true;
  const sel = () => { tt.focus(); tt.select(); msg.textContent = 'Text je označený, zkopírujte ho a pošlete.'; };
  try { navigator.clipboard.writeText(text).then(() => { msg.textContent = 'Postup je zkopírovaný do schránky. Na druhém tabletu ho vložte přes Vložit postup.'; }, sel); } catch (e) { sel(); }
});
$('#btnImport').addEventListener('click', () => {
  tt.hidden = false; tt.readOnly = false; tt.value = ''; tt.placeholder = 'Sem vložte zkopírovaný postup'; tt.focus();
  msg.textContent = ''; $('#importConfirm').hidden = true; pending = null;
});
tt.addEventListener('input', () => {
  if (tt.readOnly) return;
  pending = importText(tt.value);
  if (!pending) { $('#importConfirm').hidden = true; msg.textContent = tt.value.trim() ? 'Tohle není postup z této hry.' : ''; return; }
  $('#importInfo').textContent = `Nahradit postup v tomhle tabletu? Vložený postup: ${pending.total} povedených kol, ${pending.emeralds} smaragdů, řada ${pending.streak.count} dní.`;
  $('#importConfirm').hidden = false; msg.textContent = '';
});
$('#btnImportNo').addEventListener('click', () => { $('#importConfirm').hidden = true; pending = null; });
$('#btnImportYes').addEventListener('click', () => {
  if (!pending) return;
  try { localStorage.setItem(BACKUP_KEY, JSON.stringify(save)); } catch (e) {}
  pending.sync = save.sync; // vložený postup z jiného zařízení nepřebere jeho adresu, název ani frontu
  replaceSave(pending); applyLetters(save.letters, save.cursive); persist(); pending = null; updateRestore();
  $('#importConfirm').hidden = true; tt.hidden = true; msg.textContent = 'Postup je nahraný.';
  updateSettings();
});

export { updateSettings, updateVoiceInfo };
