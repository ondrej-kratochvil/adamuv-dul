// Rodina
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { pick } from '../gfx/textures.js';
import { speak } from '../audio/speech.js';
import { audio } from '../audio/sfx.js';
import { gemWord, updateGems } from './farm.js';
import { dayNum, dayStr, easterMonday, holidayOn } from '../logic/calendar.ts';
import { player, voc, gx } from '../app/player.js';
import { VISIT_KEY, earlyBird, helloFor, momReminder, parseVisit, pickLine, remember, visitActive, visitFans } from '../logic/family.ts';
import { wornItems } from '../logic/family-wear.ts';
import { wearById } from '../content/family-wear.ts';

// rodina a kamarádi aktivního hráče (app/player.js); pole se plní při startu a po úpravě hráče v nastavení
const FAMILY = [], FRIENDS = [], SENDERS = [], FANS = [];
function loadFamily() {
  const p = player();
  FAMILY.splice(0, FAMILY.length, ...p.family);
  FRIENDS.splice(0, FRIENDS.length, ...p.friends);
  SENDERS.splice(0, SENDERS.length, ...FAMILY, ...FRIENDS);
  FANS.splice(0, FANS.length, ...FAMILY.filter(x => !x.quiet)); // kdo fandí
}
// bez rodiny fandí hra sama (pejsek s bublinou by mluvil, to ne): „Schoolcraft“ s obličejem hráče
const GAME_FAN = { id: 'hra', name: 'hra', gen: 'hry', f: true, hair: '#4a2a14', top: '#3f9b3a', kid: true };
const fam = id => SENDERS.find(p => p.id === id) || FAMILY[0] || GAME_FAN;
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
  p => `${voc()}, jsem na tebe ${g2(p, 'pyšná', 'pyšný')}!`,
  p => gx('To je můj šikovný kluk!', 'To je moje šikovná holka!'),
  p => gx('Ty už čteš jako velký školák!', 'Ty už čteš jako velká školačka!'),
  p => `Mám z tebe velkou radost, ${voc()}!`,
  p => `${voc()}, ty jsi jednička!`,
  p => `Tohle bych líp ${g2(p, 'nezvládla', 'nezvládl')} ani já!`,
  p => `Jen tak dál, ${voc()}! Fandím ti.`,
  p => 'Paráda! Až se uvidíme, dáme si plácnutí!',
  p => gx('Jsi nejlepší horník široko daleko!', 'Jsi nejlepší hornice široko daleko!'),
];
const ENCOURAGE = [
  p => `Nevadí, ${voc()}. Zkus to znovu, fandím ti!`,
  p => 'Chybami se člověk učí. Příště to dáš!',
  p => 'Pomalu a pozorně, a půjde to. Věřím ti!',
  p => `I ${g2(p, 'já jsem se to musela', 'já jsem se to musel')} učit. Zkus to ještě jednou!`,
];
// návštěva (logic/family.ts visitFans): dnes fandí jen vybraní
function visitNow() { try { return parseVisit(localStorage.getItem(VISIT_KEY)); } catch (e) { return parseVisit(null); } }
function setVisit(ids) { try { localStorage.setItem(VISIT_KEY, JSON.stringify({ d: dayStr(), ids })); } catch (e) { /* nic */ } }
function visitors() { return visitActive(visitNow(), dayStr()) ? visitFans(FANS, visitNow(), dayStr()) : []; }
function fansNow() { return visitFans(FANS, visitNow(), dayStr()); }
function pickPerson() { const F = fansNow(); if (!F.length) return GAME_FAN; const opts = F.filter(p => p.id !== save.lastCheer); const p = pick(Math.random, opts.length ? opts : F); save.lastCheer = p.id; return p; }
// kdo dnes fandí: každý den někdo jiný, podle data
function todaysFan() { const F = fansNow(); if (!F.length) return GAME_FAN; const n = dayNum(dayStr()); return F[((n % F.length) + F.length) % F.length]; }
// české svátky a rodinná výročí (logic/calendar.ts); dárek smaragdů jednou za rok
function holiday() { return holidayOn(new Date(), player()); }
const isBirthday = () => dayStr().slice(5) === player().birthday;
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
    if (milestone) { showCheer(FAMILY.length ? FAMILY : [GAME_FAN], milestone); return `Celá rodina ti gratuluje! ${milestone}`; }
  }
  // máma se stará: jídlo, škola, spaní a dlouhé hraní mají přednost (každá připomínka jednou za den)
  const today = dayStr();
  if (!save.momSaid || save.momSaid.d !== today) save.momSaid = { d: today, ids: [] };
  const played = save.log.filter(e => e.d === today).reduce((a, e) => a + e.secs, 0);
  const P = player(), momP = FAMILY.find(x => x.role === 'mom');
  const vis = visitors(), inVisit = id => !vis.length || vis.some(v => v.id === id); // při návštěvě mluví jen hosté
  const mom = P.mom && momP && inVisit(momP.id) ? momReminder(new Date(), played, save.momSaid.ids, P.mom) : null;
  let p, line;
  if (mom) { p = momP; line = `${ok ? P.mom.open.ok : P.mom.open.fail} ${mom.text}`; save.momSaid.ids.push(mom.id); save.lastCheer = momP.id; }
  else if (P.earlyBird && FAMILY.some(x => x.id === P.earlyBird.who) && inVisit(P.earlyBird.who) && earlyBird(new Date(), save.momSaid.ids, P.earlyBird.until)) { const EARLY_BIRD = P.earlyBird; p = fam(EARLY_BIRD.who); line = ok ? EARLY_BIRD.ok : EARLY_BIRD.fail; save.momSaid.ids.push('ranni'); save.lastCheer = p.id; }
  else {
    p = pickPerson();
    const own = p.lines || { cheers: [], enc: [] };
    line = pickLine(ok ? own.cheers : own.enc, p.own ? [] : (ok ? CHEERS : ENCOURAGE).map(f => f(p)), save.recentLines || []);
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
  const vis = visitors();
  const people = h ? (h.all && FAMILY.length ? FAMILY : [fam(h.who)]) : vis.length > 1 ? vis : [todaysFan()];
  const fc = document.createElement('div'); fc.className = 'faces' + (people.length > 2 ? ' many' : ''); people.forEach(p => fc.appendChild(famCanvas(p))); faces.appendChild(fc);
  const text = h ? h.text + (gift ? ` Dárek od nás: ${gift} ${gemWord(gift)}.` : '') : vis.length > 1 ? `Na návštěvě: ${vis.map(p => p.name).join(', ')}. Ahoj ${voc()}, ukaž jim, co umíš!` : ((people[0].lines ? helloFor(people[0].lines, new Date()) : '') || (people[0] === GAME_FAN ? `Ahoj ${voc()}! Zahraj si, ať ti roste dům.` : `Dneska ti fandí ${people[0].name}. Ahoj ${voc()}, zahraj si!`));
  const bb = document.createElement('div'); bb.className = 'bubble'; bb.innerHTML = `<b>${people.length > 1 ? (vis.length > 1 ? 'návštěva' : 'celá rodina') : people[0].name}</b>`; bb.append(text); faces.appendChild(bb);
  b.appendChild(faces); b.setAttribute('aria-label', text);
  b.addEventListener('click', () => { audio(); speak(text); });
  wrap.appendChild(b);
}
const dogName = () => (save.dogName || '').trim();
function renderNotes() {
  if (!SENDERS.some(p => p.id === noteWho)) noteWho = (FAMILY.find(p => p.role !== 'mom') || SENDERS[0] || { id: '' }).id; // výchozí: táta (první, kdo není máma)
  const who = $('#noteWho'); who.innerHTML = '';
  SENDERS.forEach(p => { const b = document.createElement('button'); b.className = 'gbtn'; b.textContent = p.name; b.dataset.who = p.id; b.setAttribute('aria-pressed', String(noteWho === p.id)); b.addEventListener('click', () => { noteWho = p.id; renderNotes(); }); who.appendChild(b); });
  const list = $('#noteList'); list.innerHTML = '';
  save.notes.filter(n => !n.done).forEach(n => { const li = document.createElement('li'); li.textContent = `${fam(n.who).name}: ${n.text} `; const x = document.createElement('button'); x.textContent = 'smazat'; x.addEventListener('click', () => { save.notes.splice(save.notes.indexOf(n), 1); persist(); renderNotes(); }); li.appendChild(x); list.appendChild(li); });
  $('#dogName').value = save.dogName || '';
}
let noteWho = ''; // komu patří nový vzkaz (první člen rodiny, když nikdo nevybraný)

export { setVisit, visitNow, visitors };
export { GAME_FAN, loadFamily, FANS, FRIENDS, SENDERS, CHEERS, ENCOURAGE, FAMILY, cheerFor, dogName, easterMonday, fam, famCanvas, g2, holiday, isBirthday, noteWho, pickPerson, renderFan, renderNotes, showCheer, todaysFan };
