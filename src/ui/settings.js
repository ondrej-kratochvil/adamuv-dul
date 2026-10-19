// Nastavení
import { $ } from '../core/dom.js';
import { BACKUP_KEY, defaults, persist, save, replaceSave } from '../save/save.ts';
import { exportText, importText } from '../save/schema.ts';
import { tierOf } from '../gfx/player.js';
import { csVoice, loadVoices, speak, synth, voicesKnown } from '../audio/speech.js';
import { renderHome } from './screens.js';
import { FARM_STAGES, farmStage } from '../world/farm.js';
import { streakNow } from '../rewards/streak.js';
import { renderNotes } from '../world/family.js';
import { ENCH_ORDER, masteryPoints } from '../rewards/enchant.js';

function updateVoiceInfo() {
  const el = $('#voiceInfo'); if (!el) return;
  if (!synth) { el.innerHTML = '<span class="voice-bad">Prohlížeč neumí předčítat.</span>'; $('#voiceHelp').hidden = false; return; }
  if (csVoice) { el.innerHTML = `<span class="voice-ok">Český hlas: ${csVoice.name}</span>`; $('#voiceHelp').hidden = true; }
  else if (voicesKnown) { el.innerHTML = '<span class="voice-bad">Český hlas nebyl nalezen.</span>'; $('#voiceHelp').hidden = false; }
  else { el.textContent = 'Zjišťuji dostupné hlasy… Klepněte na Vyzkoušet hlas.'; $('#voiceHelp').hidden = true; }
}
function updateSettings() {
  document.querySelectorAll('#segCase [data-case]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.case === save.caseMode)));
  document.querySelectorAll('#segStrict [data-strict]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.strict === save.strict)));
  $('#rateNormal').setAttribute('aria-pressed', String(!save.slow));
  $('#rateSlow').setAttribute('aria-pressed', String(save.slow));
  const st = Math.min(12, save.total);
  $('#progressInfo').textContent = `Odehraná kola: písmena ${save.rounds.letters}, slabiky ${save.rounds.syllables}, slova ${save.rounds.words}, čtení ${save.rounds.reading}, čísla ${save.rounds.numbers}, počty ${save.rounds.math}, psaní ${save.rounds.writing}. Dům: ${st} z 12 dílů. Farma: ${farmStage()} z ${FARM_STAGES.length}. Smaragdy: ${save.emeralds}. Řada: ${streakNow().count} (nejdelší ${save.streak.best}). Krumpáč: ${tierOf(save.total).name}. Očarování: ${save.ench.length} z ${ENCH_ORDER.length} (zvládnuto ${masteryPoints().pts} z ${masteryPoints().max} úkolů).`;
  updateVoiceInfo();
}
// Nastavení je pro rodiče: ozubené kolo se musí podržet 2 sekundy. Krátké klepnutí jen řekne, že je pro rodiče.
const HOLD_MS = 2000;
let holdTimer = null;
function openSettings() { updateSettings(); renderNotes(); updateRestore(); $('#resetConfirm').hidden = true; $('#setOverlay').hidden = false; }
const gear = $('#btnSettings');
function gearHint() {
  const h = $('#gearHint'); h.hidden = false; clearTimeout(gearHint.t); gearHint.t = setTimeout(() => { h.hidden = true; }, 3000);
  speak('Tohle je nastavení pro rodiče. Podrž ozubené kolo, dokud se nevyplní.');
}
gear.addEventListener('pointerdown', e => {
  try { gear.setPointerCapture(e.pointerId); } catch (err) {} // prst smí z malého tlačítka sjet, odpočet běží dál
  clearTimeout(holdTimer); gear.classList.add('holding');
  holdTimer = setTimeout(() => { holdTimer = null; gear.classList.remove('holding'); $('#gearHint').hidden = true; openSettings(); }, HOLD_MS);
});
['pointerup', 'pointercancel'].forEach(t => gear.addEventListener(t, () => {
  gear.classList.remove('holding');
  if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; gearHint(); }
}));
gear.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSettings(); } });
$('#btnSetClose').addEventListener('click', () => { $('#setOverlay').hidden = true; renderHome(); });
document.querySelectorAll('#segCase [data-case]').forEach(b => b.addEventListener('click', () => { save.caseMode = b.dataset.case; persist(); updateSettings(); }));
document.querySelectorAll('#segStrict [data-strict]').forEach(b => b.addEventListener('click', () => { save.strict = b.dataset.strict; persist(); updateSettings(); }));
$('#rateNormal').addEventListener('click', () => { save.slow = false; persist(); updateSettings(); });
$('#rateSlow').addEventListener('click', () => { save.slow = true; persist(); updateSettings(); });
$('#btnTestVoice').addEventListener('click', () => { loadVoices(); speak('Ahoj Adame! ma, mé, li, lý, so, su.'); setTimeout(loadVoices, 800); });
$('#btnReset').addEventListener('click', () => { $('#resetConfirm').hidden = false; });
$('#btnResetNo').addEventListener('click', () => { $('#resetConfirm').hidden = true; });
$('#btnResetYes').addEventListener('click', () => { try { localStorage.setItem(BACKUP_KEY, JSON.stringify(save)); } catch (e) {} const keep = { caseMode: save.caseMode, slow: save.slow, strict: save.strict, outfit: save.outfit, notes: save.notes, dogName: save.dogName }; replaceSave(Object.assign(defaults(), keep)); persist(); updateRestore(); $('#resetConfirm').hidden = true; updateSettings(); });

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
  replaceSave(pending); persist(); pending = null; updateRestore();
  $('#importConfirm').hidden = true; tt.hidden = true; msg.textContent = 'Postup je nahraný.';
  updateSettings();
});

export { updateSettings, updateVoiceInfo };
