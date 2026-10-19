// Rodina
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.js';
import { pick } from '../gfx/textures.js';
import { speak } from '../audio/speech.js';
import { audio } from '../audio/sfx.js';
import { gemWord, updateGems } from './farm.js';
import { dayNum, dayStr } from '../rewards/streak.js';

const FAMILY = [
  // barvy vlasů podle Ondřeje (19. 10. 2026); brýle ani vousy nikdo neuvedl, proto nejsou; děda Marek téměř holohlavý (Ondřej); drdol u babiček jen odlišuje babičky od dědů
  { id: 'paja', name: 'máma Pája', f: true, hair: '#e2c06c', long: true, top: '#c84a8a' },
  { id: 'ondra', name: 'táta Ondra', f: false, hair: '#a07a52', grey: '#c4bcb2', top: '#2f6fb0' },
  { id: 'jindra', name: 'babička Jindra', f: true, hair: '#4a2a14', long: false, top: '#7d4bc2' },
  { id: 'bob', name: 'děda Bob', f: false, hair: '#cfcfcf', top: '#7a5230' },
  { id: 'iva', name: 'babička Iva', f: true, hair: '#e2c06c', long: false, top: '#3f9b3a' },
  { id: 'marek', name: 'děda Marek', f: false, hair: '#dcc274', top: '#c0392b', bald: true }, // téměř holohlavý, zbytek vlasů blond
  { id: 'david', name: 'brácha Davídek', f: false, hair: '#ecd27e', top: '#e0b324', small: true,
    cheers: ['Bráško, ty jsi nejlepší!', 'Hurá! Adame, to je paráda!', 'Já taky chci kopat jako ty!', 'Bráško, naučíš to i mě?'],
    enc: ['Bráško, to nevadí. Zkus to znovu!', 'Adame, já ti fandím!'] },
];
const fam = id => FAMILY.find(p => p.id === id);
const g2 = (p, f, m) => p.f ? f : m;
function famCanvas(p) {
  const c = document.createElement('canvas'); c.width = c.height = 16; c.className = 'px';
  const g = c.getContext('2d'); const R = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); };
  const S = '#d9a066';
  R(2, 12, 12, 4, p.top); R(6, 11, 4, 2, S);
  if (p.long) { R(3, 2, 2, 10, p.hair); R(11, 2, 2, 10, p.hair); }
  R(4, 3, 8, 8, S);
  if (p.bald) { R(4, 4, 1, 3, p.hair); R(11, 4, 1, 3, p.hair); } else { R(4, 2, 8, 2, p.hair); R(4, 4, 1, 2, p.hair); R(11, 4, 1, 2, p.hair); }
  if (!p.long && p.f) { R(6, 0, 4, 2, p.hair); } // drdol
  if (p.grey) { R(5, 2, 1, 1, p.grey); R(9, 2, 1, 1, p.grey); R(4, 4, 1, 1, p.grey); R(11, 5, 1, 1, p.grey); } // trochu prošedivělé
  if (p.small) { R(5, 4, 3, 1, p.hair); R(9, 8, 1, 1, '#e8a0a0'); R(6, 8, 1, 1, '#e8a0a0'); } // ofina a tvářičky
  R(6, 6, 1, 1, '#2b2b2b'); R(9, 6, 1, 1, '#2b2b2b');
  if (p.glasses) { [4, 8].forEach(x => { const G = '#3a3a3a'; R(x, 5, 4, 1, G); R(x, 8, 4, 1, G); R(x, 5, 1, 4, G); R(x + 3, 5, 1, 4, G); R(x + 1, 6, 2, 2, '#d8eef8'); }); R(6, 6, 1, 1, '#2b2b2b'); R(9, 6, 1, 1, '#2b2b2b'); } // obroučky brýlí
  if (p.beard) { R(5, 9, 6, 2, p.hair); R(6, 8, 4, 1, p.hair); }
  R(7, 9, 2, 1, '#9b4a3c');
  return c;
}
const CHEERS = [
  p => `Adame, jsem na tebe ${g2(p, 'pyšná', 'pyšný')}!`,
  p => 'To je můj šikovný kluk!',
  p => 'Ty už čteš jako velký školák!',
  p => `Mám z tebe velkou radost, Adame!`,
  p => 'Adame, ty jsi jednička!',
  p => `Tohle bych líp ${g2(p, 'nezvládla', 'nezvládl')} ani já!`,
  p => 'Jen tak dál, Adame! Fandím ti.',
  p => 'Paráda! Až se uvidíme, dáme si plácnutí!',
  p => 'Jsi nejlepší horník v celém Přerově!',
];
const ENCOURAGE = [
  p => 'Nevadí, Adame. Zkus to znovu, fandím ti!',
  p => 'Chybami se člověk učí. Příště to dáš!',
  p => 'Pomalu a pozorně, a půjde to. Věřím ti!',
  p => `I ${g2(p, 'já jsem se to musela', 'já jsem se to musel')} učit. Zkus to ještě jednou!`,
];
function pickPerson() { const opts = FAMILY.filter(p => p.id !== save.lastCheer); const p = pick(Math.random, opts); save.lastCheer = p.id; return p; }
// kdo dnes fandí: každý den někdo jiný, podle data
function todaysFan() { const n = dayNum(dayStr()); return FAMILY[((n % FAMILY.length) + FAMILY.length) % FAMILY.length]; }
// české svátky a rodinná výročí; dárek smaragdů jednou za rok
function easterMonday(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return dayStr(new Date(y, month - 1, day + 1));
}
function holiday() {
  const now = new Date(), md = dayStr().slice(5), y = now.getFullYear();
  if (md === '06-17') return { id: 'narozeniny', all: true, gift: 20, text: 'Všechno nejlepší k narozeninám, Adame!' }; // Adam *17. 6. 2020
  if (md === '12-24') return { id: 'vanoce', all: true, gift: 20, text: 'Veselé Vánoce, Adame! A dnes máš i svátek, protože Adam a Eva slaví na Štědrý den.' };
  if (md === '12-05') return { id: 'mikulas', all: true, gift: 5, text: 'Dnes večer chodí Mikuláš, čert a anděl! Byl jsi hodný, tak dostáváš smaragdy.' };
  if (md === '06-01') return { id: 'den-deti', all: true, gift: 10, text: 'Šťastný Den dětí, Adame!' };
  if (md === '01-01') return { id: 'novy-rok', all: true, gift: 5, text: 'Šťastný nový rok, Adame!' };
  if (md === '06-04') return { id: 'david-narozeniny', who: 'david', text: 'Dnes má narozeniny brácha Davídek! Popřej mu všechno nejlepší.' }; // David *4. 6. 2023
  if (md === '12-30') return { id: 'david-svatek', who: 'david', text: 'Dnes má svátek brácha Davídek! Popřej mu.' };
  if (dayStr() === easterMonday(y)) return { id: 'velikonoce', all: true, gift: 5, text: 'Veselé Velikonoce! Hody, hody, doprovody, dejte vejce malovaný.' };
  return null;
}
const isBirthday = () => dayStr().slice(5) === '06-17'; // Adam má narozeniny 17. 6.
function showCheer(people, text) {
  const el = $('#cheer'); el.innerHTML = '';
  const faces = document.createElement('div'); faces.className = 'faces' + (people.length > 2 ? ' many' : ''); people.forEach(p => faces.appendChild(famCanvas(p))); el.appendChild(faces);
  const b = document.createElement('div'); b.className = 'bubble';
  b.innerHTML = `<b>${people.length > 1 ? 'celá rodina' : people[0].name}</b>`; b.append(text); el.appendChild(b);
}
// vrací text k přečtení; vzkaz od rodiny má přednost před běžnou pochvalou
function cheerFor(ok, milestone) {
  if (ok) {
    const note = save.notes.find(n => !n.done);
    if (note) { const p = fam(note.who); note.done = true; persist(); showCheer([p], note.text); return `Vzkaz od ${p.name.replace(/^(máma|táta|babička|děda) /, (m, w) => ({ máma: 'mámy', táta: 'táty', babička: 'babičky', děda: 'dědy' })[w] + ' ')}: ${note.text}`; }
    if (milestone) { showCheer(FAMILY, milestone); return `Celá rodina ti gratuluje! ${milestone}`; }
  }
  const p = pickPerson(); const own = ok ? p.cheers : p.enc; const line = own && Math.random() < .7 ? pick(Math.random, own) : pick(Math.random, ok ? CHEERS : ENCOURAGE)(p);
  showCheer([p], line); persist();
  return `${p.name[0].toUpperCase() + p.name.slice(1)} říká: ${line}`;
}
function renderFan(wrap) {
  const h = holiday(), year = new Date().getFullYear();
  let gift = 0;
  if (h && h.gift && save.gifts[h.id] !== year) { save.gifts[h.id] = year; save.emeralds += h.gift; gift = h.gift; persist(); updateGems(); }
  const b = document.createElement('button'); b.className = 'fan';
  const faces = document.createElement('div'); faces.className = 'cheer'; faces.style.margin = 0;
  const people = h ? (h.all ? FAMILY : [fam(h.who)]) : [todaysFan()];
  const fc = document.createElement('div'); fc.className = 'faces' + (people.length > 2 ? ' many' : ''); people.forEach(p => fc.appendChild(famCanvas(p))); faces.appendChild(fc);
  const text = h ? h.text + (gift ? ` Dárek od nás: ${gift} ${gemWord(gift)}.` : '') : `Dneska ti fandí ${people[0].name}. Ahoj Adame, zahraj si!`;
  const bb = document.createElement('div'); bb.className = 'bubble'; bb.innerHTML = `<b>${people.length > 1 ? 'celá rodina' : people[0].name}</b>`; bb.append(text); faces.appendChild(bb);
  b.appendChild(faces); b.setAttribute('aria-label', text);
  b.addEventListener('click', () => { audio(); speak(text); });
  wrap.appendChild(b);
}
const dogName = () => (save.dogName || '').trim();
function renderNotes() {
  const who = $('#noteWho'); who.innerHTML = '';
  FAMILY.forEach(p => { const b = document.createElement('button'); b.className = 'gbtn'; b.textContent = p.name; b.dataset.who = p.id; b.setAttribute('aria-pressed', String(noteWho === p.id)); b.addEventListener('click', () => { noteWho = p.id; renderNotes(); }); who.appendChild(b); });
  const list = $('#noteList'); list.innerHTML = '';
  save.notes.filter(n => !n.done).forEach(n => { const li = document.createElement('li'); li.textContent = `${fam(n.who).name}: ${n.text} `; const x = document.createElement('button'); x.textContent = 'smazat'; x.addEventListener('click', () => { save.notes.splice(save.notes.indexOf(n), 1); persist(); renderNotes(); }); li.appendChild(x); list.appendChild(li); });
  $('#dogName').value = save.dogName || '';
}
let noteWho = 'ondra';

export { CHEERS, ENCOURAGE, FAMILY, cheerFor, dogName, easterMonday, fam, famCanvas, g2, holiday, isBirthday, noteWho, pickPerson, renderFan, renderNotes, showCheer, todaysFan };
