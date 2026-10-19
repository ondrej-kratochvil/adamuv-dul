// Nastavení
import { $ } from '../core/dom.js';
import { defaults, persist, save, replaceSave } from '../save/save.ts';
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
$('#btnSettings').addEventListener('click', () => { updateSettings(); renderNotes(); $('#resetConfirm').hidden = true; $('#setOverlay').hidden = false; });
$('#btnSetClose').addEventListener('click', () => { $('#setOverlay').hidden = true; renderHome(); });
document.querySelectorAll('#segCase [data-case]').forEach(b => b.addEventListener('click', () => { save.caseMode = b.dataset.case; persist(); updateSettings(); }));
document.querySelectorAll('#segStrict [data-strict]').forEach(b => b.addEventListener('click', () => { save.strict = b.dataset.strict; persist(); updateSettings(); }));
$('#rateNormal').addEventListener('click', () => { save.slow = false; persist(); updateSettings(); });
$('#rateSlow').addEventListener('click', () => { save.slow = true; persist(); updateSettings(); });
$('#btnTestVoice').addEventListener('click', () => { loadVoices(); speak('Ahoj Adame! ma, mé, li, lý, so, su.'); setTimeout(loadVoices, 800); });
$('#btnReset').addEventListener('click', () => { $('#resetConfirm').hidden = false; });
$('#btnResetNo').addEventListener('click', () => { $('#resetConfirm').hidden = true; });
$('#btnResetYes').addEventListener('click', () => { const keep = { caseMode: save.caseMode, slow: save.slow, strict: save.strict, outfit: save.outfit, notes: save.notes, dogName: save.dogName }; replaceSave(Object.assign(defaults(), keep)); persist(); $('#resetConfirm').hidden = true; updateSettings(); });

export { updateSettings, updateVoiceInfo };
