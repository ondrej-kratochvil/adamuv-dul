// Sbírka kartiček: kartička za každé zvládnuté slovo (v patře Slova nebo Čtení)
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.js';
import { speak, synth } from '../audio/speech.js';
import { audio } from '../audio/sfx.js';
import { WORDS } from '../content/words.js';
import { PIC, PLURAL, display, inCzech, picCanvas } from '../levels/reading.js';
import { show } from '../ui/screens.js';
import { mastery } from '../app/stats.js';
import { retrigger } from '../game/round.js';

// Nová slova ve WORDS = nové kartičky automaticky. Vzácnost podle délky slova.
const CARD_BONUS = 30; // smaragdy za celou sbírku
const cardWords = () => WORDS;
const cardEarned = w => mastery(save.stats['words:' + w]) === 'good' || mastery(save.stats['reading:' + w]) === 'good';
const rarity = w => w.length <= 3 ? 1 : w.length === 4 ? 2 : 3;
function cardEl(w, open) {
  const el = document.createElement('button'); el.className = 'wcard' + (open ? ' r' + rarity(w) : ' back');
  if (!open) { el.innerHTML = '<span class="q">?</span>'; el.setAttribute('aria-label', 'zatím neznámá kartička'); return el; }
  el.setAttribute('aria-label', w);
  const d = display(w); // jednou, ať je na kartičce slovo stejně velkým nebo malým písmem
  if (PIC[w] || PLURAL[w]) { el.appendChild(picCanvas(w)); el.insertAdjacentHTML('beforeend', `<span class="w">${d}</span>`); }
  else { el.style.gridTemplateRows = '1fr'; el.insertAdjacentHTML('beforeend', `<span class="big">${d}</span>`); }
  el.insertAdjacentHTML('beforeend', `<span class="stars">${'★'.repeat(rarity(w))}</span>`);
  return el;
}
function checkCards(silent) {
  const got = cardWords().filter(w => cardEarned(w) && !save.cards.includes(w));
  got.forEach(w => save.cards.push(w));
  let bonus = 0;
  if (!silent && got.length && save.cards.length >= cardWords().length) { save.emeralds += CARD_BONUS; bonus = CARD_BONUS; }
  if (got.length) persist();
  return silent ? [] : got.map(w => ({ w, bonus }));
}
function openAlbum() {
  audio(); G.speechId++; if (synth) synth.cancel();
  show('album');
  const all = cardWords(), have = all.filter(w => save.cards.includes(w));
  $('#albumCap').textContent = `Kartičky: ${have.length} z ${all.length}. Novou kartičku dostaneš za každé zvládnuté slovo. Klepni na kartičku a uslyšíš slovo.`;
  const grid = $('#albumGrid'); grid.innerHTML = '';
  all.forEach(w => {
    const open = save.cards.includes(w), el = cardEl(w, open);
    el.addEventListener('click', () => { audio(); if (open) { speak(inCzech('Slovo', w)); retrigger(el, 'hit'); } else speak('Tuhle kartičku ještě nemáš. Zvládni další slova v patře Slova nebo Čtení.'); });
    grid.appendChild(el);
  });
  speak(`Tvoje sbírka. Máš ${have.length} kartiček z ${all.length}.`);
}

export { CARD_BONUS, cardEarned, cardEl, cardWords, checkCards, openAlbum, rarity };
