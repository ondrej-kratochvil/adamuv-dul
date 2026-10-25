// Ranní karta a dnešní úkol (logic/daily.ts). Karta přijde při prvním otevření dne: po spuštění, po návratu
// z pozadí, po rozsvícení displeje nebo když půlnoc přejde při otevřené hře. Hlásí ten, kdo dnes fandí.
import { gx, player, voc } from '../app/player.js';
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { speak } from '../audio/speech.js';
import { audio, sfx } from '../audio/sfx.js';
import { dayStr } from '../logic/calendar.ts';
import { DAILY_BONUS, dateSay, dateShow, greeting, isNewDay, nameDay, pickQuest, questStep, questText, stateHoliday } from '../logic/daily.ts';
import { LEVELS } from '../levels/reading.js';
import { practiceReady } from '../levels/practice.js';
import { startRound } from '../game/round.js';
import { FAMILY, fam, famCanvas, holiday, todaysFan } from './family.js';
import { gemWord, sprIcon, updateGems } from './farm.js';
import { setBtn } from '../ui/icons.js';
import { restingLevel, suggestLevel } from '../logic/rotation.ts';
import { petForQuest } from '../logic/pets.ts';
import { checkVersion, updatePending, whenVersionKnown } from '../app/name.js';

function levelName(lv) { return lv === 'practice' ? 'Procvičit' : (LEVELS[lv] || {}).name || lv; }
// dnešní úkol (založí se, když ještě není)
function ensureDaily() {
  if (isNewDay(save.daily)) {
    save.daily = { d: dayStr(), quest: pickQuest(save.stats, save.rounds, save.log, dayStr(), practiceReady()), shown: false };
    persist();
  }
  return save.daily;
}
function dayPeople() { const h = holiday(); return h ? (h.all && FAMILY.length ? FAMILY : [fam(h.who)]) : [todaysFan()]; }
// texty karty: co je vidět a co se řekne
function dayTexts() {
  const now = new Date(), d = ensureDaily(), q = d.quest, h = holiday();
  const people = dayPeople(), many = people.length > 1;
  const who = many ? 'Celá rodina' : people[0].name[0].toUpperCase() + people[0].name.slice(1);
  const state = stateHoliday(now);
  // svátek Adama (Štědrý den) a Davídka už říká rodinná hláška, jméno z kalendáře by se opakovalo
  const names = h && /svatek|vanoce/.test(h.id) ? null : nameDay(now);
  const task = questText(q, levelName(q.level));
  const show = {
    title: dateShow(now)[0].toUpperCase() + dateShow(now).slice(1),
    names: [state ? `Státní svátek: ${state}.` : '', names ? `Svátek má ${names}.` : '', h ? h.text : ''].filter(Boolean).join(' '),
    task: `${task}.`,
  };
  const say = `${who} říká: ${greeting(now)}, ${voc()}! Dnes je ${dateSay(now)}.` + (state ? ` Je státní svátek, ${state}.` : '') + (names ? ` Svátek má ${names}.` : '') + (h ? ' ' + h.text : '')
    + (q.done ? ' Dnešní úkol už máš splněný.' : ` Dnešní úkol: ${task}. Za splnění dostaneš ${DAILY_BONUS} ${gemWord(DAILY_BONUS)}.`);
  return { people, who, show, say, q };
}
function openDay() {
  const t = dayTexts();
  const w = $('#dayWho'); w.innerHTML = '';
  const fc = document.createElement('div'); fc.className = 'faces' + (t.people.length > 2 ? ' many' : ''); t.people.forEach(p => fc.appendChild(famCanvas(p))); w.appendChild(fc);
  const b = document.createElement('div'); b.className = 'bubble'; b.innerHTML = `<b>${t.people.length > 1 ? 'celá rodina' : t.people[0].name}</b>`; b.append(`${greeting(new Date())}, ${voc()}!`); w.appendChild(b);
  $('#dayTitle').textContent = t.show.title;
  $('#dayNames').textContent = t.show.names; $('#dayNames').hidden = !t.show.names;
  const dq = $('#dayQuest'); dq.innerHTML = ''; dq.appendChild(sprIcon('emerald'));
  dq.append(t.q.done ? 'Dnešní úkol máš splněný!' : `Dnešní úkol: ${t.show.task} Odměna: ${DAILY_BONUS} ${gemWord(DAILY_BONUS)}.`);
  const go = $('#btnDayGo'); go.hidden = t.q.done; setBtn(go, 'next', `Hrát ${levelName(t.q.level)}`);
  $('#dayOverlay').dataset.say = t.say;
  $('#dayOverlay').hidden = false;
  save.daily.shown = true; persist();
  speak(t.say); // prohlížeč smí mluvit až po dotyku: když ještě nesmí, přečte se po klepnutí na kartu
}
// nový den a karta ještě nebyla: ukázat ji (jen na úvodní obrazovce, ne uprostřed kola).
// Nejdřív aktualizace a její novinky, pak karta, ať zazní už nová verze (Ondřej 24. 10. 2026).
function checkNewDay() {
  if (!isNewDay(save.daily) && save.daily.shown) { document.body.dataset.dayChecked = '1'; return; }
  whenVersionKnown().then(() => {
    document.body.dataset.dayChecked = '1'; // pro testy: rozhodnuto, jestli karta přijde
    if (G.R || $('#home').hidden || !$('#dayOverlay').hidden || !$('#setupOverlay').hidden || updatePending()) return;
    ensureDaily();
    if (!save.daily.shown) { openDay(); renderQuest(); }
  });
}
// proužek s dnešním úkolem na úvodní obrazovce (pod tím, kdo fandí)
function renderQuest(wrap) {
  if (wrap) setTimeout(checkNewDay, 0); // úvodní obrazovka se vykreslila (třeba po Rozumím u novinek): nepřišel nový den?
  if (updatePending() && isNewDay(save.daily)) return; // dnešní úkol vybere až nová verze
  const old = $('#questStrip'); const q = ensureDaily().quest;
  const el = document.createElement('button'); el.id = 'questStrip'; el.className = 'quest' + (q.done ? ' done' : '');
  el.appendChild(sprIcon('emerald'));
  el.append(q.done ? 'Dnešní úkol splněný!' : `Dnešní úkol: ${questText(q, levelName(q.level))}` + (q.need > 1 ? ` (${q.got} z ${q.need})` : ''));
  el.addEventListener('click', () => { audio(); openDay(); });
  if (old) old.replaceWith(el); else if (wrap) wrap.appendChild(el);
}
// po povedeném kole: posun úkolu; vrací bonus (0, když se úkol nesplnil právě teď) a zvířátko, které tím přibylo
function questAfterRound(level, ok, perfect) {
  const d = ensureDaily();
  if (!questStep(d.quest, level, ok, perfect)) { persist(); return { bonus: 0, pet: null }; }
  save.emeralds += DAILY_BONUS; save.questsDone = (save.questsDone || 0) + 1; persist(); updateGems('hudGems');
  return { bonus: DAILY_BONUS, pet: petForQuest(player(), save.questsDone) };
}
// spustit patro dnešního úkolu; patro, které si po třech kolech za sebou dává pauzu, se nespustí ani odsud
// (review 25. 10. 2026: tlačítko na kartě obcházelo pauzu, kterou dlaždice na úvodní obrazovce drží)
function questResting() { const lv = save.daily && save.daily.quest && save.daily.quest.level; return !!lv && lv in LEVELS && restingLevel(save.log, Object.keys(LEVELS)) === lv; }
function startQuest() {
  const lv = save.daily.quest.level;
  if (questResting()) {
    sfx.nope();
    const sug = LEVELS[suggestLevel(save.log, Object.keys(LEVELS), lv)].name;
    speak(`Patro ${levelName(lv)} si teď dává pauzu, ${gx('hrál', 'hrála')} jsi ho třikrát za sebou. Zahraj si jiné patro, třeba ${sug}. K dnešnímu úkolu se pak vrať.`);
    return;
  }
  $('#dayOverlay').hidden = true; startRound(lv);
}
function initDay() {
  $('#btnDayLater').addEventListener('click', () => { audio(); G.speechId++; $('#dayOverlay').hidden = true; $('#dayOverlay').dispatchEvent(new Event('dayclosed')); });
  $('#btnDayGo').addEventListener('click', () => { audio(); startQuest(); });
  // klepnutí na kartu (mimo tlačítka) ji přečte znovu
  $('#dayOverlay').addEventListener('click', e => { if (e.target.closest('button')) return; audio(); speak($('#dayOverlay').dataset.say); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkNewDay(); });
  setInterval(() => { if (isNewDay(save.daily)) checkVersion(); checkNewDay(); }, 60000); // půlnoc při otevřené hře: i tehdy nejdřív zjistit novou verzi
  checkNewDay();
}

export { checkNewDay, initDay, openDay, questAfterRound, renderQuest };
