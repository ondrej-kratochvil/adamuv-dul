// Poklad (Ondřej 31. 10. 2026): „Najdi doma něco, co začíná na M, a vyfoť to.“ Rodič potvrdí, hra nic nehodnotí sama.
// Druhá karta: vlastní obrázky. Fotky jen v zařízení (app/photos.js), pravidla v logic/hunt.ts.
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { speak } from '../audio/speech.js';
import { audio, sfx } from '../audio/sfx.js';
import { setBtn } from '../ui/icons.js';
import { SAY_LETTER } from '../content/letters.ts';
import { HUNT_BONUS, HUNT_PER_DAY, huntFound, huntToday, pickHuntLetter } from '../logic/hunt.ts';
import { dayStr } from '../logic/calendar.ts';
import { addPhoto, deletePhoto, listPhotos } from '../app/photos.js';
import { gemWord, updateGems } from './farm.js';
import { show } from '../ui/screens.js';
import { gx } from '../app/player.js';

let letter = '', mode = 'hunt', pending = null, viewing = null;
const say = l => SAY_LETTER[l] || l.toLowerCase();
function huntSub() { const h = huntToday(save.hunt, dayStr()); return `dnes ${h.today.length} z ${HUNT_PER_DAY}`; }
function newLetter() {
  letter = pickHuntLetter(save.letters || [], huntToday(save.hunt, dayStr()), letter);
  $('#huntLetter').textContent = letter;
  $('#huntText').textContent = `Najdi doma něco, co začíná na ${letter}, a vyfoť to.`;
  speak(`Najdi doma něco, co začíná na písmeno ${say(letter)}. Pak klepni na zelené tlačítko s fotoaparátem, je na něm napsáno Vyfotit.`);
}
function tab(m) {
  mode = m;
  $('#huntFind').hidden = m !== 'hunt'; $('#huntDraw').hidden = m !== 'drawing';
  $('#btnHuntTabFind').setAttribute('aria-pressed', String(m === 'hunt')); $('#btnHuntTabDraw').setAttribute('aria-pressed', String(m === 'drawing'));
  renderGrid();
}
async function renderGrid() {
  const grid = mode === 'hunt' ? $('#huntGrid') : $('#drawGrid');
  let photos = [];
  try { photos = await listPhotos(mode); } catch (e) { grid.textContent = 'Fotky tady nejde ukládat (soukromé okno?).'; return; }
  grid.innerHTML = '';
  photos.forEach(p => {
    const b = document.createElement('button'); b.className = 'photo'; b.setAttribute('aria-label', p.letter ? `Poklad na ${p.letter}` : 'Můj obrázek');
    const img = document.createElement('img'); img.src = URL.createObjectURL(p.blob); img.alt = ''; b.appendChild(img);
    if (p.letter) b.insertAdjacentHTML('beforeend', `<span class="photo-letter">${p.letter}</span>`);
    b.addEventListener('click', () => { audio(); openPhoto(p, img.src); });
    grid.appendChild(b);
  });
}
function openPhoto(p, src) {
  viewing = p; $('#photoBig').src = src;
  $('#photoCap').textContent = p.letter ? `Poklad na ${p.letter}` : 'Můj obrázek';
  setBtn($('#btnPhotoDel'), 'retry', 'Smazat'); $('#btnPhotoDel').dataset.armed = '';
  $('#photoOverlay').hidden = false;
  if (p.letter) speak(`Poklad na ${say(p.letter)}.`);
}
function openHunt() {
  $('#huntCheck').hidden = true; pending = null;
  show('hunt'); tab('hunt'); newLetter();
}
// fotka z fotoaparátu: poklad čeká na rodiče, obrázek se uloží hned
async function onFile(file) {
  if (!file) return;
  if (mode === 'drawing') {
    try { await addPhoto(file, 'drawing', '', dayStr()); speak('Obrázek je uložený. Je moc pěkný!'); renderGrid(); } catch (e) { speak('Obrázek se nepodařilo uložit.'); }
    return;
  }
  pending = file;
  $('#huntPreview').src = URL.createObjectURL(file); $('#huntCheckLetter').textContent = letter; $('#huntCheck').hidden = false;
  speak(`Ukaž fotku tátovi nebo mámě. Když to začíná na ${say(letter)}, klepnou na zelené tlačítko s fajfkou, je na něm napsáno Ano.`);
}
async function confirmFind(ok) {
  if (!pending) return;
  const file = pending; pending = null; $('#huntCheck').hidden = true;
  if (!ok) { sfx.nope(); speak(`Nevadí. Zkus najít jinou věc, která začíná na ${say(letter)}.`); return; }
  const day = dayStr(), r = huntFound(save.hunt, letter, day);
  save.hunt = r.hunt; save.emeralds += r.bonus; persist(); updateGems();
  try { await addPhoto(file, 'hunt', letter, day); } catch (e) { /* bez úložiště jen smaragdy */ }
  sfx.fanfare();
  speak(r.bonus ? `Výborně, ${gx('našel', 'našla')} jsi poklad na ${say(letter)}! Máš ${r.bonus} ${gemWord(r.bonus)}.` : `Výborně, poklad na ${say(letter)}! Smaragdy za poklady už dnes dostal${gx('', 'a')} jsi, ale do sbírky se počítá.`);
  renderGrid(); setTimeout(newLetter, 2500);
}
function initHunt() {
  setBtn($('#btnHuntPhoto'), 'camera', 'Vyfotit'); setBtn($('#btnDrawPhoto'), 'camera', 'Vyfotit obrázek');
  setBtn($('#btnHuntOther'), 'refresh', 'Jiné písmeno'); setBtn($('#btnHuntYes'), 'check', 'Ano'); setBtn($('#btnHuntNo'), 'retry', 'Ještě ne');
  setBtn($('#btnPhotoClose'), 'check', 'Hotovo');
  $('#btnHuntBack').addEventListener('click', () => { audio(); show('home'); });
  $('#btnHuntTabFind').addEventListener('click', () => { audio(); tab('hunt'); });
  $('#btnHuntTabDraw').addEventListener('click', () => { audio(); tab('drawing'); speak('Nakresli obrázek a vyfoť ho zeleným tlačítkem s fotoaparátem.'); });
  const pickFile = () => { audio(); $('#huntFile').value = ''; $('#huntFile').click(); };
  $('#btnHuntPhoto').addEventListener('click', pickFile); $('#btnDrawPhoto').addEventListener('click', pickFile);
  $('#huntFile').addEventListener('change', e => onFile(e.target.files && e.target.files[0]));
  $('#btnHuntOther').addEventListener('click', () => { audio(); newLetter(); });
  $('#btnHuntYes').addEventListener('click', () => { audio(); confirmFind(true); });
  $('#btnHuntNo').addEventListener('click', () => { audio(); confirmFind(false); });
  $('#btnPhotoClose').addEventListener('click', () => { audio(); $('#photoOverlay').hidden = true; });
  $('#btnPhotoDel').addEventListener('click', async () => {
    const b = $('#btnPhotoDel');
    if (!b.dataset.armed) { b.dataset.armed = '1'; setBtn(b, 'retry', 'Opravdu smazat?'); return; }
    if (viewing) await deletePhoto(viewing.id).catch(() => {});
    $('#photoOverlay').hidden = true; renderGrid();
  });
}
export { HUNT_BONUS, huntSub, initHunt, openHunt };
