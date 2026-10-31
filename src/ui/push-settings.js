// Nastavení „Ranní upozornění“ na kartě Hra (app/push.js)
import { $ } from '../core/dom.js';
import { PUSH_HOURS } from '../logic/push.ts';
import { disablePush, enablePush, pushProblem, pushState, testPush } from '../app/push.js';
import { save } from '../save/save.ts';

const WHY = {
  old: 'Upozornění funguje jen na nové adrese schoolcraft.games.',
  nosupport: 'Tenhle prohlížeč upozornění od webu neumí. Na Androidu použijte Chrome, hru přidanou na plochu.',
  ios: 'Na iPadu a iPhonu nejdřív přidejte hru na plochu (Sdílet, Přidat na plochu) a otevřete ji odtamtud.',
  denied: 'Upozornění jsou pro hru zakázaná. U dětského účtu je povolí rodič ve Family Link (Ovládací prvky, Google Chrome a web), jinak v nastavení prohlížeče u schoolcraft.games.',
};
const why = e => WHY[e && e.message] || `Nepovedlo se: ${e && e.message || e}`;
function renderPush(msg) {
  const s = pushState(), p = pushProblem();
  $('#btnPushOn').setAttribute('aria-pressed', String(s.on)); $('#btnPushOn').textContent = s.on ? 'Upozornění: zapnuto' : 'Upozornění: vypnuto';
  $('#pushHour').value = String(s.hour);
  $('#btnPushRank').setAttribute('aria-pressed', String(s.on && s.rank)); $('#btnPushRank').textContent = s.on && s.rank ? 'Předběhnutí v žebříčku: zapnuto' : 'Předběhnutí v žebříčku: vypnuto';
  $('#pushInfo').textContent = msg || (p ? WHY[p] : s.on ? `Zapnuto: každý den v ${s.hour}:00.` : 'Vypnuto.');
}
async function run(fn, ok) { $('#pushInfo').textContent = 'Chvíli strpení…'; try { await fn(); renderPush(ok); } catch (e) { renderPush(why(e)); } }
function initPushSettings() {
  $('#pushHour').innerHTML = PUSH_HOURS.map(h => `<option value="${h}">${h}:00</option>`).join('');
  $('#btnPushOn').addEventListener('click', () => {
    const hour = Number($('#pushHour').value);
    run(() => pushState().on ? disablePush() : enablePush(hour), pushState().on ? 'Upozornění vypnuto.' : `Zapnuto: každý den v ${hour}:00 přijde připomínka dnešního úkolu.`);
  });
  $('#pushHour').addEventListener('change', () => { const hour = Number($('#pushHour').value); if (pushState().on) run(() => enablePush(hour), `Čas změněn: každý den v ${hour}:00.`); });
  // předběhnutí v žebříčku: potřebuje online hráče (server ho pozná podle přihlášení); zapne i upozornění, když nejsou
  $('#btnPushRank').addEventListener('click', () => {
    const s = pushState(), want = !(s.on && s.rank);
    if (want && !(save.cloud && save.cloud.on && save.cloud.id)) { renderPush('Nejdřív zapněte online na kartě Online (hráč musí být v žebříčku).'); return; }
    run(() => enablePush(Number($('#pushHour').value), want), want ? 'Zapnuto: když hráče někdo předběhne, přijde upozornění (přes den, nejvýš jednou denně).' : 'Upozornění na předběhnutí vypnuto.');
  });
  $('#btnPushTest').addEventListener('click', () => run(testPush, 'Zkušební upozornění odesláno. Když se neukázalo, tablet upozornění od hry blokuje.'));
}
export { initPushSettings, renderPush };
