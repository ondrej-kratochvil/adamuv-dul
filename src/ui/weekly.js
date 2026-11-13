// Týdenní souhrn pro rodiče (nastavení, Postup a data → Týden; logic/weekly.ts): tento a minulý týden, Poslat rodině.
import { $ } from '../core/dom.js';
import { save } from '../save/save.ts';
import { gx, player } from '../app/player.js';
import { itemLabel } from '../app/stats.js';
import { levelName } from '../app/sync.js';
import { dayDots, parentTip, shareText, weekRange, weekStart, weekSummary } from '../logic/weekly.ts';

const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const summaryFor = from => weekSummary(save.log, save.got || {}, save.stats, from);
const prevMonday = () => { const m = weekStart(new Date()); return new Date(m.getFullYear(), m.getMonth(), m.getDate() - 7); };

function weekHtml(s, current) {
  const parts = [`<p class="week-dots" aria-label="Dny s povedeným kolem: ${s.daysPlayed} ze 7">${dayDots(s.days)} <b>${s.daysPlayed} ze 7 dní</b>${current ? ' (zatím)' : ''}</p>`];
  parts.push(`<p>Povedená kola: <b>${s.okRounds}</b>${s.topLevels.length ? `, nejvíc ${s.topLevels.map(l => esc(levelName(l))).join(' a ')}` : ''}.</p>`);
  parts.push(s.newItems.length
    ? `<p>Nově zvládnuté (${s.newCount}): ${s.newItems.map(x => `<b>${esc(levelName(x.level))}</b> ${x.items.map(it => esc(itemLabel(x.level, it))).join(', ')}`).join('; ')}</p>`
    : '<p>Nově zvládnuté: zatím nic.</p>');
  return parts.join('');
}
function renderWeek() {
  const now = summaryFor(weekStart(new Date())), prev = summaryFor(prevMonday());
  $('#weekNow').innerHTML = `<h3>Tento týden (${weekRange(now)})</h3>` + weekHtml(now, true);
  $('#weekPrev').innerHTML = `<h3>Minulý týden (${weekRange(prev)})</h3>` + weekHtml(prev, false);
  const w = now.weak;
  $('#weekWeak').innerHTML = w.length
    ? `<h3>Na čem pracovat</h3><p>${w.map(x => `<b>${esc(itemLabel(x.level, x.item))}</b> (${esc(levelName(x.level).toLowerCase())}${x.with ? `, plete si s ${esc(itemLabel(x.level, x.with))}` : ''})`).join('; ')}</p><p class="lbl-small">Tip: ${esc(parentTip(w[0], itemLabel(w[0].level, w[0].item)))}</p>`
    : '';
  $('#weekMsg').textContent = '';
}
// minulý týden do neděle, v neděli už ten právě končící
const shareWeek = () => (new Date().getDay() === 0 ? summaryFor(weekStart(new Date())) : summaryFor(prevMonday()));
async function sendWeek() {
  const p = player(), text = shareText(shareWeek(), p.name || 'Dítě', gx, itemLabel, levelName);
  try { if (navigator.share) { await navigator.share({ title: 'Schoolcraft', text }); $('#weekMsg').textContent = 'Posláno.'; return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); $('#weekMsg').textContent = 'Text je zkopírovaný, vložte ho do zprávy.'; }
  catch (e) { const t = $('#weekText'); t.value = text; t.hidden = false; t.select(); $('#weekMsg').textContent = 'Zkopírujte text a vložte ho do zprávy.'; }
}
function initWeek() {
  $('#btnWeekShare').addEventListener('click', sendWeek);
  document.querySelectorAll('.set-tree [data-tab="week"]').forEach(b => b.addEventListener('click', renderWeek));
}
export { initWeek, renderWeek };
