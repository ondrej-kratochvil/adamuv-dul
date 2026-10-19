// Nastavení
import { $ } from '../core/dom.js';
import { BACKUP_KEY, defaults, persist, save, replaceSave } from '../save/save.ts';
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
// Nastavení je pro rodiče: otevře se po vyřešení příkladu pro dospělého (logic/gate.ts)
let gate = null;
function openSettings() { updateSettings(); renderNotes(); updateRestore(); renderPron(); $('#resetConfirm').hidden = true; $('#setOverlay').hidden = false; }
function openGate() {
  gate = makeGate();
  $('#gateQ').textContent = gate.text; $('#gateInput').value = ''; $('#gateMsg').textContent = '';
  $('#gateOverlay').hidden = false; $('#gateInput').focus();
  speak('Tohle je nastavení pro rodiče.');
}
$('#btnSettings').addEventListener('click', openGate);
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
$('#btnTestVoice').addEventListener('click', () => { loadVoices(); speak('Ahoj Adame! Tady je hra. ' + ['MA', 'MÉ', 'SO', 'LY'].map(s => pronounceAs(s, save.pron?.[s] || defaultMode(s))).join('. ') + '.'); setTimeout(loadVoices, 800); });
$('#btnReset').addEventListener('click', () => { $('#resetConfirm').hidden = false; });
$('#btnResetNo').addEventListener('click', () => { $('#resetConfirm').hidden = true; });
$('#btnResetYes').addEventListener('click', () => { try { localStorage.setItem(BACKUP_KEY, JSON.stringify(save)); } catch (e) {} const keep = { caseMode: save.caseMode, slow: save.slow, strict: save.strict, pron: save.pron, outfit: save.outfit, notes: save.notes, dogName: save.dogName }; /* nastavení rodiče včetně výslovnosti zůstává */ replaceSave(Object.assign(defaults(), keep)); persist(); updateRestore(); $('#resetConfirm').hidden = true; updateSettings(); });

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
