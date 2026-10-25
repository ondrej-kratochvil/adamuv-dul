// Rodina: Adam kupuje kousky za smaragdy a převléká portréty rodiny (obsah content/family-wear.ts, pravidla logic/family-wear.ts)
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { speak, synth } from '../audio/speech.js';
import { audio, sfx } from '../audio/sfx.js';
import { show, LOCK_SVG } from '../ui/screens.js';
import { FAMILY, famCanvas } from './family.js';
import { gemWord, sprIcon, updateGems } from './farm.js';
import { SLOT_NAMES, WEAR, wearById } from '../content/family-wear.ts';
import { ownedCount, toggleWear, wearAction, wears, wornCount } from '../logic/family-wear.ts';
import { rareLeft } from '../logic/rewards.ts';
import { masteryPoints } from '../rewards/enchant.js';
import { renderPets } from './pets.js';

let who = 'iva', armed = null;
const cap = s => s[0].toUpperCase() + s.slice(1);
function wearIcon(w) {
  const c = document.createElement('canvas'); c.width = c.height = 16; c.className = 'px';
  const g = c.getContext('2d'), R = (x, y, ww, h, k) => { g.fillStyle = k; g.fillRect(x, y, ww, h); };
  // světlá hlava bez vlasů, ať je vidět, kam věc patří
  R(4, 3, 8, 8, '#efdcc4'); R(6, 11, 4, 2, '#efdcc4'); R(2, 12, 12, 4, '#cfcfcf'); R(6, 6, 1, 1, '#9a8a7a'); R(9, 6, 1, 1, '#9a8a7a'); R(7, 9, 2, 1, '#c8a090');
  w.paint(R);
  return c;
}
function openFamily() {
  G.speechId++; if (synth) synth.cancel();
  armed = null; show('family'); renderFamily();
  speak('Rodina. Vyber, koho chceš převléct, a klepni na věc. Věci se kupují za smaragdy.');
}
function renderFamily() {
  updateGems();
  const p = FAMILY.find(x => x.id === who) || FAMILY[0];
  const big = $('#famBig'); big.innerHTML = ''; big.appendChild(famCanvas(p));
  $('#famName').textContent = p.name;
  const people = $('#famPeople'); people.innerHTML = '';
  FAMILY.forEach(x => {
    const b = document.createElement('button'); b.className = 'fam-pick'; b.setAttribute('aria-label', x.name); b.setAttribute('aria-pressed', String(x.id === who));
    b.appendChild(famCanvas(x));
    b.addEventListener('click', () => { audio(); who = x.id; armed = null; renderFamily(); speak(cap(x.name) + '.'); });
    people.appendChild(b);
  });
  const list = $('#famItems'); list.innerHTML = '';
  renderPets(list); // zvířátka rodiny (world/pets.js)
  const { pts, max } = masteryPoints(), worn = save.famWear[who] || {};
  Object.entries(SLOT_NAMES).forEach(([slot, title]) => {
    list.insertAdjacentHTML('beforeend', `<h3 class="shop-h">${title}</h3>`);
    WEAR.filter(w => w.slot === slot).forEach(w => {
      const owned = save.famOwned.includes(w.id), left = w.need ? rareLeft(w.need, pts, max) : 0, locked = !owned && left > 0;
      const b = document.createElement('button'); b.className = 'shop-item'; b.setAttribute('aria-label', w.name);
      const ic = document.createElement('span'); ic.className = 'shop-icon'; ic.appendChild(wearIcon(w)); b.appendChild(ic);
      const pr = document.createElement('span'); pr.className = 'price';
      const cnt = ownedCount(save.famOwned, w.id), free = cnt > wornCount(save.famWear, w.id);
      if (owned && (worn[slot] === w.id || free)) pr.textContent = (worn[slot] === w.id ? 'nosí' : 'máš') + (cnt > 1 ? ` ×${cnt}` : '');
      else { pr.appendChild(sprIcon('emerald')); pr.append(String(w.price)); }
      b.appendChild(pr);
      if (locked) { b.classList.add('locked'); b.insertAdjacentHTML('beforeend', LOCK_SVG); }
      else if (!(owned && (worn[slot] === w.id || free)) && save.emeralds < w.price) b.classList.add('poor');
      if (worn[slot] === w.id) b.setAttribute('aria-pressed', 'true');
      if (armed === w.id) b.classList.add('armed');
      b.addEventListener('click', () => tapWear(w, left));
      list.appendChild(b);
    });
  });
  $('#btnFamClear').hidden = !Object.keys(worn).length;
}
// první klepnutí na novou věc řekne cenu, druhé koupí a hned nasadí; koupenou věc klepnutí nasadí nebo sundá.
// Víc lidí může mít stejnou věc, jen když je koupená víckrát (Ondřej 25. 10. 2026); sundaná věc jde dát komukoli jinému.
function tapWear(w, left) {
  audio();
  const p = FAMILY.find(x => x.id === who);
  const act = wearAction(save.famWear, save.famOwned, who, w.id, FAMILY.length);
  if (act === 'off' || act === 'on') {
    armed = null;
    const on = toggleWear(save.famWear, who, w.id); persist(); renderFamily();
    if (on) { sfx.sparkle(); speak(`${cap(p.name)} má teď ${w.acc}!`); } else speak(`${cap(p.name)} už nemá ${w.acc}. Můžeš to dát někomu jinému.`);
    return;
  }
  if (act === 'max') { sfx.nope(); speak(`${cap(w.name)} už má každý z rodiny.`); return; }
  if (left > 0) { sfx.nope(); speak(`${cap(w.name)} je vzácná věc. Odemkne se, až zvládneš ještě ${left} ${left === 1 ? 'úkol' : left <= 4 ? 'úkoly' : 'úkolů'}.`); return; }
  const more = act === 'buyMore', n = ownedCount(save.famOwned, w.id);
  const intro = more ? `${cap(w.name)}: ${n === 1 ? 'jedinou, kterou máš,' : 'všechny, které máš,'} už někdo nosí. Další stojí` : `${cap(w.name)} za`;
  if (save.emeralds < w.price) { armed = null; renderFamily(); sfx.nope(); speak(more ? `${intro} ${w.price} ${gemWord(w.price)}. Máš ${save.emeralds}. Kopej bez chyby a získáš další!` : `${cap(w.name)} stojí ${w.price} ${gemWord(w.price)}. Máš ${save.emeralds}. Kopej bez chyby a získáš další!`); return; }
  if (armed !== w.id) { armed = w.id; renderFamily(); speak(`${intro} ${w.price} ${gemWord(w.price)}. Klepni ještě jednou a koupíš.`); return; }
  save.emeralds -= w.price; save.famOwned.push(w.id); armed = null;
  toggleWear(save.famWear, who, w.id); persist(); renderFamily(); sfx.fanfare();
  speak(more ? `Koupeno! ${cap(p.name)} má teď ${w.acc}. Teď máš ${n + 1} ${n + 1 <= 4 ? 'kusy' : 'kusů'}.` : `Koupeno! ${cap(p.name)} má teď ${w.acc}. Koupenou věc můžeš dát komukoli.`);
}
function clearFamily() {
  audio(); delete save.famWear[who]; persist(); renderFamily();
  const p = FAMILY.find(x => x.id === who); speak(`${cap(p.name)} je zase normální.`);
}

export { clearFamily, openFamily, renderFamily, tapWear, wearById };
