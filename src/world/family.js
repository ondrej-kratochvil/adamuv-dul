// Rodina
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { pick } from '../gfx/textures.js';
import { speak } from '../audio/speech.js';
import { audio } from '../audio/sfx.js';
import { gemWord, updateGems } from './farm.js';
import { dayNum, dayStr, easterMonday, holidayOn } from '../logic/calendar.ts';
import { FAMILY_LINES, MOM_OPEN } from '../content/family-lines.ts';
import { momReminder, pickLine, remember } from '../logic/family.ts';
import { wornItems } from '../logic/family-wear.ts';
import { wearById } from '../content/family-wear.ts';

const FAMILY = [
  // barvy vlasů podle Ondřeje (19. 10. 2026); děda Marek téměř holohlavý (Ondřej), krátké vousy podle fotek; babičky krátké vlasy
  // podle fotek (Ondřej 20. 10. 2026: „ano, uprav je“), Iva po bradu, Jindra kratší; dřív drdol jen pro odlišení od dědů
  { id: 'paja', name: 'máma Pája', gen: 'mámy Páji', f: true, hair: '#e2c06c', long: true, top: '#c84a8a' },
  { id: 'ondra', name: 'táta Ondra', gen: 'táty Ondry', f: false, hair: '#a07a52', grey: '#c4bcb2', top: '#2f6fb0' },
  { id: 'jindra', name: 'babička Jindra', gen: 'babičky Jindry', f: true, hair: '#4a2a14', bob: 6, top: '#7d4bc2' },
  { id: 'bob', name: 'děda Bob', gen: 'dědy Boba', f: false, hair: '#cfcfcf', top: '#7a5230' },
  { id: 'iva', name: 'babička Iva', gen: 'babičky Ivy', f: true, hair: '#e2c06c', bob: 9, top: '#3f9b3a' },
  { id: 'marek', name: 'děda Marek', gen: 'dědy Marka', f: false, hair: '#dcc274', top: '#c0392b', bald: true, beard: '#c9a26a' }, // téměř holohlavý, zbytek vlasů blond
  { id: 'david', name: 'brácha Davídek', gen: 'bráchy Davídka', f: false, hair: '#ecd27e', top: '#e0b324', small: true },
  // rodina Pájina bratra (Ondřej 20. 10. 2026): barvy vlasů z jeho odpovědí, brýle u Terky a vousy u Vaška podle jeho fotek;
  // délku vlasů Terky Ondřej neuvedl, má stejný střih jako máma
  { id: 'vasek', name: 'strejda Vašek', gen: 'strejdy Vaška', f: false, hair: '#4a2a14', top: '#2a4f8a', beard: true, quiet: true },
  { id: 'terka', name: 'teta Terka', gen: 'tety Terky', f: true, hair: '#4a2a14', long: true, glasses: true, top: '#d86a9a', quiet: true },
  // bratranec Víťa: stejně starý jako Adam, taky 1. třída. Vašek, Terka i Víťa fandí až s vlastními hláškami
  // odsouhlasenými Ondřejem (návrh docs/hlasky-navrh-2.md); do té doby quiet: jen vzkazy a převlékání
  { id: 'vita', name: 'bratranec Víťa', gen: 'bratrance Víti', f: false, hair: '#a07a52', top: '#3f9b3a', kid: true, quiet: true },
  // praděda Ruda (Ivin táta), Šárka (Markova žena) a její syn Tomáš (18): oslovení podle Ondřeje, podoba podle jeho fotek 20. 10. 2026.
  // Prababička Marcelka (Markova máma) chybí, dokud Ondřej neřekne nebo neukáže, jak vypadá.
  { id: 'ruda', name: 'praděda Ruda', gen: 'pradědy Rudy', f: false, hair: '#ececec', top: '#5a6e8a', quiet: true },
  { id: 'sarka', name: 'Šárka', gen: 'Šárky', f: true, hair: '#5a3418', long: true, top: '#f2f2f2', quiet: true },
  { id: 'tomas', name: 'Tomáš', gen: 'Tomáše', f: false, hair: '#a07a52', buzz: true, top: '#f2f2f2', quiet: true },
];
// kamarádi ze třídy: jen vzkazy, bez podoby ve hře (dokud ji neřekne Ondřej), místo obličeje obálka
const FRIENDS = [
  { id: 'tom', name: 'kamarád Tom', gen: 'kamaráda Toma', friend: true },
  { id: 'meda', name: 'kamarád Méďa', gen: 'kamaráda Médi', friend: true },
];
const SENDERS = [...FAMILY, ...FRIENDS];
const fam = id => SENDERS.find(p => p.id === id) || FAMILY[1];
const g2 = (p, f, m) => p.f ? f : m;
function famCanvas(p) {
  if (p.friend) { // obálka s dopisem
    const c = document.createElement('canvas'); c.width = c.height = 16; c.className = 'px'; const g = c.getContext('2d'); const R = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); };
    R(1, 4, 14, 9, '#161616'); R(2, 5, 12, 7, '#ffffff'); [[2, 5], [3, 6], [4, 7], [5, 8], [6, 9], [7, 9], [8, 9], [9, 8], [10, 7], [11, 6], [12, 5], [13, 5]].forEach(([x, y]) => R(x, y, 1, 1, '#8a8a8a')); R(11, 9, 2, 2, '#c0392b');
    return c;
  }
  const c = document.createElement('canvas'); c.width = c.height = 16; c.className = 'px';
  const g = c.getContext('2d'); const R = (x, y, w, h, k) => { g.fillStyle = k; g.fillRect(x, y, w, h); };
  const S = '#d9a066';
  R(2, 12, 12, 4, p.top); R(6, 11, 4, 2, S);
  if (p.long) { R(3, 2, 2, 10, p.hair); R(11, 2, 2, 10, p.hair); }
  R(4, 3, 8, 8, S);
  if (p.bald) { R(4, 4, 1, 3, p.hair); R(11, 4, 1, 3, p.hair); } else if (p.buzz) { R(4, 2, 8, 1, p.hair); R(4, 3, 8, 1, p.hair); } else { R(4, 2, 8, 2, p.hair); R(4, 4, 1, 2, p.hair); R(11, 4, 1, 2, p.hair); }
  if (p.bob) { R(3, 3, 1, p.bob - 3, p.hair); R(12, 3, 1, p.bob - 3, p.hair); R(4, 4, 1, p.bob - 4, p.hair); R(11, 4, 1, p.bob - 4, p.hair); } // krátké vlasy po stranách (bob = kam až sahají)
  if (p.grey) { R(5, 2, 1, 1, p.grey); R(9, 2, 1, 1, p.grey); R(4, 4, 1, 1, p.grey); R(11, 5, 1, 1, p.grey); } // trochu prošedivělé
  if (p.small) { R(5, 4, 3, 1, p.hair); R(9, 8, 1, 1, '#e8a0a0'); R(6, 8, 1, 1, '#e8a0a0'); } // ofina a tvářičky
  if (p.kid) { R(5, 4, 4, 1, p.hair); } // ofina (stejně starý jako Adam)
  R(6, 6, 1, 1, '#2b2b2b'); R(9, 6, 1, 1, '#2b2b2b');
  if (p.glasses) { const G = '#4a4a4a'; R(5, 5, 6, 1, G); R(5, 7, 2, 1, G); R(9, 7, 2, 1, G); R(4, 6, 1, 1, G); R(11, 6, 1, 1, G); R(5, 6, 6, 1, '#cfe9f7'); R(6, 6, 1, 1, '#2b2b2b'); R(9, 6, 1, 1, '#2b2b2b'); } // obroučky a světlá skla kolem očí
  if (p.beard) { const B = typeof p.beard === 'string' ? p.beard : p.hair; R(5, 9, 6, 2, B); R(6, 8, 4, 1, B); }
  R(7, 9, 2, 1, '#9b4a3c');
  // kousky, které Adam rodině nasadil (Rodina, world/dressup.js)
  if (!p.friend && save.famWear) wornItems(save.famWear, p.id).forEach(id => wearById(id).paint(R));
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
const FANS = FAMILY.filter(p => !p.quiet); // kdo fandí (bez odsouhlasených hlášek ne)
function pickPerson() { const opts = FANS.filter(p => p.id !== save.lastCheer); const p = pick(Math.random, opts); save.lastCheer = p.id; return p; }
// kdo dnes fandí: každý den někdo jiný, podle data
function todaysFan() { const n = dayNum(dayStr()); return FANS[((n % FANS.length) + FANS.length) % FANS.length]; }
// české svátky a rodinná výročí (logic/calendar.ts); dárek smaragdů jednou za rok
function holiday() { return holidayOn(new Date()); }
const isBirthday = () => dayStr().slice(5) === '06-17'; // Adam má narozeniny 17. 6.
function showCheer(people, text) {
  const el = $('#cheer'); el.innerHTML = '';
  const faces = document.createElement('div'); faces.className = 'faces' + (people.length > 2 ? ' many' : ''); people.forEach(p => faces.appendChild(famCanvas(p))); el.appendChild(faces);
  const b = document.createElement('div'); b.className = 'bubble';
  b.innerHTML = `<b>${people.length > 1 ? 'celá rodina' : people[0].name}</b>`; b.append(text); el.appendChild(b);
  // klepnutí na portrét nebo bublinu hlášku přehraje znovu
  el.dataset.say = `${people.length > 1 ? 'Celá rodina' : people[0].name[0].toUpperCase() + people[0].name.slice(1)}: ${text}`;
  el.title = 'Přehrát znovu';
}
// vrací text k přečtení; vzkaz od rodiny má přednost před běžnou pochvalou
function cheerFor(ok, milestone) {
  if (ok) {
    const note = save.notes.find(n => !n.done);
    if (note) { const p = fam(note.who); note.done = true; persist(); showCheer([p], note.text); return `Vzkaz od ${p.gen}: ${note.text}`; }
    if (milestone) { showCheer(FAMILY, milestone); return `Celá rodina ti gratuluje! ${milestone}`; }
  }
  // máma se stará: jídlo, škola, spaní a dlouhé hraní mají přednost (každá připomínka jednou za den)
  const today = dayStr();
  if (!save.momSaid || save.momSaid.d !== today) save.momSaid = { d: today, ids: [] };
  const played = save.log.filter(e => e.d === today).reduce((a, e) => a + e.secs, 0);
  const mom = momReminder(new Date(), played, save.momSaid.ids);
  let p, line;
  if (mom) { p = fam('paja'); line = `${ok ? MOM_OPEN.ok : MOM_OPEN.fail} ${mom.text}`; save.momSaid.ids.push(mom.id); save.lastCheer = 'paja'; }
  else {
    p = pickPerson();
    const own = FAMILY_LINES[p.id] || { cheers: [], enc: [] };
    line = pickLine(ok ? own.cheers : own.enc, (ok ? CHEERS : ENCOURAGE).map(f => f(p)), save.recentLines || []);
  }
  save.recentLines = remember(save.recentLines || [], line);
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
  const text = h ? h.text + (gift ? ` Dárek od nás: ${gift} ${gemWord(gift)}.` : '') : ((FAMILY_LINES[people[0].id] || {}).hello || `Dneska ti fandí ${people[0].name}. Ahoj Adame, zahraj si!`);
  const bb = document.createElement('div'); bb.className = 'bubble'; bb.innerHTML = `<b>${people.length > 1 ? 'celá rodina' : people[0].name}</b>`; bb.append(text); faces.appendChild(bb);
  b.appendChild(faces); b.setAttribute('aria-label', text);
  b.addEventListener('click', () => { audio(); speak(text); });
  wrap.appendChild(b);
}
const dogName = () => (save.dogName || '').trim();
function renderNotes() {
  const who = $('#noteWho'); who.innerHTML = '';
  SENDERS.forEach(p => { const b = document.createElement('button'); b.className = 'gbtn'; b.textContent = p.name; b.dataset.who = p.id; b.setAttribute('aria-pressed', String(noteWho === p.id)); b.addEventListener('click', () => { noteWho = p.id; renderNotes(); }); who.appendChild(b); });
  const list = $('#noteList'); list.innerHTML = '';
  save.notes.filter(n => !n.done).forEach(n => { const li = document.createElement('li'); li.textContent = `${fam(n.who).name}: ${n.text} `; const x = document.createElement('button'); x.textContent = 'smazat'; x.addEventListener('click', () => { save.notes.splice(save.notes.indexOf(n), 1); persist(); renderNotes(); }); li.appendChild(x); list.appendChild(li); });
  $('#dogName').value = save.dogName || '';
}
let noteWho = 'ondra';

export { FANS, FRIENDS, SENDERS, CHEERS, ENCOURAGE, FAMILY, cheerFor, dogName, easterMonday, fam, famCanvas, g2, holiday, isBirthday, noteWho, pickPerson, renderFan, renderNotes, showCheer, todaysFan };
