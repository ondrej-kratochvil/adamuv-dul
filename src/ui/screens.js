// Obrazovky
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { tex } from '../gfx/textures.js';
import { OUTFIT, OUTFIT_CATS, isMetal, mountPlayer, outfitIcon, outfitItem, unlocked } from '../gfx/player.js';
import { drawHouse } from '../world/house.js';
import { speak, synth } from '../audio/speech.js';
import { audio, sfx, tone } from '../audio/sfx.js';
import { LEVELS, picCanvas } from '../levels/reading.js';
import { drawFarm, farmStage, fitCanvas, mountDog, openFarm, openShop, sprIcon, updateGems } from '../world/farm.js';
import { renderStreakBtn } from '../rewards/streak.js';
import { renderFan } from '../world/family.js';
import { renderEnchBook } from '../rewards/enchant.js';
import { drawVillageThumb, openVillage } from '../world/village.js';
import { drawNether, openNether, portalLit } from '../world/nether.js';
import { cardWords, openAlbum } from '../rewards/cards.js';
import { drawPrerov, openPrerov, prerovStage } from '../world/prerov.js';
import { drawEnder, endOpen, openEnder } from '../world/finale.js';
import { renderUpdate } from '../app/name.js';
import { buildOpen, drawBuild, openBuild } from '../world/build.js';
import { startRound } from '../game/round.js';
import { levelProgress } from '../logic/mastery.ts';
import { openFamily } from '../world/dressup.js';
import { FAMILY, famCanvas } from '../world/family.js';
import { practiceReady } from '../levels/practice.js';

function show(id) { ['home', 'game', 'house', 'wardrobe', 'farm', 'shop', 'stats', 'village', 'nether', 'album', 'prerov', 'ender', 'build', 'family'].forEach(s => { $('#' + s).hidden = s !== id; }); }
function paintTextures(root = document) {
  root.querySelectorAll('[data-tex]').forEach(el => { el.style.backgroundImage = `url(${tex(el.dataset.tex, el.dataset.dark === '1')})`; });
}
const ELL_SVG = '<svg class="ell" viewBox="0 0 46 78" aria-hidden="true"><path d="M15.75 0V58Q15.75 70.25 28 70.25H36" fill="none" stroke="currentColor" stroke-width="15.5" stroke-linecap="round"/></svg>';
function setGlyph(el, text) {
  el.setAttribute('aria-label', text);
  el.innerHTML = [...text].map(ch => ch === 'l' ? ELL_SVG : ch.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])).join('');
}
function blockEl(texName, label, isSyl) {
  const b = document.createElement('button');
  b.className = 'blk' + (isSyl ? ' syl' : '');
  b.style.backgroundImage = `url(${tex(texName)})`;
  const plate = document.createElement('span'); plate.className = 'plate';
  const gl = document.createElement('span'); gl.className = 'glyph'; setGlyph(gl, label);
  plate.appendChild(gl); b.appendChild(plate);
  const cr = document.createElement('span'); cr.className = 'crack'; b.appendChild(cr);
  return b;
}
const LOCK_SVG = '<svg class="lock" viewBox="0 0 16 16" aria-hidden="true"><path fill="#161616" d="M4 6V4h1V3h1V2h4v1h1v1h1v2h1v9H3V6h1zm2 0h4V4H6v2z"/><path fill="#f6cf45" d="M4 7h8v7H4z"/><path fill="#161616" d="M7 9h2v3H7z"/></svg>';
// terč na dlaždici Procvičit (červeno-bílé kruhy po pixelech)
const TARGET_SVG = '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="#c62f2f" d="M5 1h6v1h2v2h1v2h1v4h-1v2h-1v2h-2v1H5v-1H3v-2H2v-2H1V6h1V4h1V2h2z"/><path fill="#f4f4f4" d="M6 3h4v1h1v1h1v1h1v4h-1v1h-1v1h-1v1H6v-1H5v-1H4v-1H3V6h1V5h1V4h1z"/><path fill="#c62f2f" d="M7 5h2v1h1v1h1v2h-1v1H9v1H7v-1H6V9H5V7h1V6h1z"/><path fill="#f4f4f4" d="M7 7h2v2H7z"/></svg>';
function renderHome() {
  mountPlayer($('#heroPlayer'));
  const wrap = $('#levels'); wrap.innerHTML = '';
  renderUpdate(wrap);
  renderFan(wrap);
  Object.entries(LEVELS).forEach(([key, L]) => {
    const btn = document.createElement('button'); btn.className = 'lvl'; btn.setAttribute('aria-label', L.name);
    const b = blockEl(L.tex, '', !!L.small); b.tabIndex = -1; b.setAttribute('aria-hidden', 'true');
    setGlyph(b.querySelector('.glyph'), save.caseMode === 'lower' ? L.sample.join(' ').toLocaleLowerCase('cs') : save.caseMode === 'upper' ? L.sample.join(' ').toLocaleUpperCase('cs') : L.sample.join(' '));
    btn.appendChild(b);
    // ukazatel zvládnutí patra (Ondřej 20. 10. 2026): kolik úloh z kolika umí
    const p = levelProgress(save.stats, key), pct = Math.round(p.got / p.all * 100);
    btn.insertAdjacentHTML('beforeend', `<span class="lvl-name">${L.name}</span><span class="lvl-bar" aria-hidden="true"><i style="width:${pct}%"></i></span><span class="lvl-sub">${p.got} z ${p.all}</span>`);
    btn.addEventListener('click', () => { audio(); startRound(key); });
    wrap.appendChild(btn);
  });
  // Procvičit: kolo z úloh, které Adamovi nejdou (levels/practice.js); dokud žádné nejsou, je zamčené
  const ready = practiceReady();
  const pb = document.createElement('button'); pb.className = 'lvl practice' + (ready ? '' : ' locked'); pb.setAttribute('aria-label', 'Procvičit');
  const pblk = blockEl('bookshelf', '', false); pblk.tabIndex = -1; pblk.setAttribute('aria-hidden', 'true');
  pblk.querySelector('.plate').innerHTML = TARGET_SVG;
  pb.appendChild(pblk);
  pb.insertAdjacentHTML('beforeend', (ready ? '' : LOCK_SVG) + '<span class="lvl-name">Procvičit</span>');
  pb.addEventListener('click', () => { audio(); if (ready) startRound('practice'); else { sfx.nope(); speak('Procvičování se otevře, až budou úkoly, které ti ještě nejdou. Teď ti jde všechno, co jsi zkusil!'); } });
  wrap.appendChild(pb);
  [].forEach(([name, t, s]) => { // zamčená patra „brzy“ (teď žádná)
    const btn = document.createElement('button'); btn.className = 'lvl'; btn.disabled = true;
    const b = blockEl(t, s, true); b.tabIndex = -1; b.setAttribute('aria-hidden', 'true');
    btn.appendChild(b);
    btn.insertAdjacentHTML('beforeend', `${LOCK_SVG}<span class="lvl-name">${name}</span><span class="lvl-sub">brzy</span>`);
    wrap.appendChild(btn);
  });
  const wb = document.createElement('button'); wb.className = 'lvl'; wb.setAttribute('aria-label', 'Šatník');
  const wblk = blockEl('planks', '', false); wblk.tabIndex = -1; wblk.setAttribute('aria-hidden', 'true');
  const plate = wblk.querySelector('.plate'); plate.innerHTML = ''; plate.appendChild(outfitIcon('shirt', outfitItem('shirt')));
  wb.appendChild(wblk);
  wb.insertAdjacentHTML('beforeend', '<span class="lvl-name">Šatník</span>');
  wb.addEventListener('click', openWardrobe);
  wrap.appendChild(wb);
  const sb = document.createElement('button'); sb.className = 'lvl'; sb.setAttribute('aria-label', 'Obchod');
  const sblk = blockEl('planks', '', false); sblk.tabIndex = -1; sblk.setAttribute('aria-hidden', 'true');
  const splate = sblk.querySelector('.plate'); splate.innerHTML = ''; splate.appendChild(sprIcon('emerald'));
  sb.appendChild(sblk);
  sb.insertAdjacentHTML('beforeend', '<span class="lvl-name">Obchod</span>');
  sb.addEventListener('click', openShop);
  wrap.appendChild(sb);
  // Rodina: převlékání portrétů (world/dressup.js); na dlaždici babička Iva, nebo kdo má něco na sobě
  const fb = document.createElement('button'); fb.className = 'lvl family'; fb.setAttribute('aria-label', 'Rodina');
  const fblk = blockEl('planks', '', false); fblk.tabIndex = -1; fblk.setAttribute('aria-hidden', 'true');
  const dressed = FAMILY.find(p => save.famWear && save.famWear[p.id]) || FAMILY.find(p => p.id === 'iva');
  const fpl = fblk.querySelector('.plate'); fpl.innerHTML = ''; fpl.appendChild(famCanvas(dressed));
  fb.appendChild(fblk);
  fb.insertAdjacentHTML('beforeend', '<span class="lvl-name">Rodina</span>');
  fb.addEventListener('click', () => { audio(); openFamily(); });
  wrap.appendChild(fb);
  const ab = document.createElement('button'); ab.className = 'lvl'; ab.setAttribute('aria-label', 'Sbírka');
  const ablk = blockEl('planks', '', false); ablk.tabIndex = -1; ablk.setAttribute('aria-hidden', 'true');
  const ap = ablk.querySelector('.plate'); ap.innerHTML = ''; ap.appendChild(picCanvas('LES'));
  ab.appendChild(ablk);
  ab.insertAdjacentHTML('beforeend', `<span class="lvl-name">Sbírka</span><span class="lvl-sub">${save.cards.length} z ${cardWords().length}</span>`);
  ab.addEventListener('click', openAlbum);
  wrap.appendChild(ab);
  const places = document.createElement('div'); places.className = 'places';
  const card = (label, draw, open, locked, wide) => {
    const c = document.createElement('button'); c.className = 'house-card' + (locked ? ' locked' : '') + (wide ? ' wide' : ''); c.setAttribute('aria-label', label);
    const cv = document.createElement('canvas'); cv.className = 'px'; draw(cv); c.appendChild(cv);
    // všechny náhledy stejně vysoké; volné místo nad scénou má barvu její oblohy
    try { const [r, g, b] = cv.getContext('2d').getImageData(1, 1, 1, 1).data; cv.style.backgroundColor = `rgb(${r},${g},${b})`; } catch (e) { /* nic */ }
    c.insertAdjacentHTML('beforeend', (locked ? LOCK_SVG : '') + `<span class="lvl-name">${label}</span>`);
    c.addEventListener('click', open);
    places.appendChild(c);
  };
  // široké scény (farma, Přerov) přes celou šířku, ostatní po dvou stejně vysoké
  card('Můj dům', drawHouse, openHouse, false);
  card('Stavění', drawBuild, openBuild, !buildOpen());
  card('Farma', drawFarm, openFarm, farmStage() === 0, true);
  card('Vesnice', drawVillageThumb, openVillage, false);
  card('Nether', drawNether, openNether, !portalLit());
  card('Přerov', drawPrerov, openPrerov, prerovStage() === 0, true);
  card('End', drawEnder, openEnder, !endOpen());
  wrap.appendChild(places);
  mountDog($('#heroDog'));
  updateGems(); renderStreakBtn();
}
let wardCat = 'shirt';
function openWardrobe() {
  audio(); G.speechId++; if (synth) synth.cancel();
  show('wardrobe'); renderWardrobe();
  speak('Šatník. Vyber si oblečení.');
}
function renderWardrobe() {
  mountPlayer($('#wardPlayer'));
  const tabs = $('#wardTabs'); tabs.innerHTML = '';
  OUTFIT_CATS.forEach(([cat, label]) => {
    const b = document.createElement('button'); b.className = 'gbtn'; b.setAttribute('aria-label', label);
    b.setAttribute('aria-pressed', String(cat === wardCat));
    b.appendChild(outfitIcon(cat, outfitItem(cat)));
    b.addEventListener('click', () => { wardCat = cat; renderWardrobe(); speak(label); });
    tabs.appendChild(b);
  });
  const items = $('#wardItems'); items.innerHTML = '';
  OUTFIT[wardCat].forEach(it => {
    const b = document.createElement('button'); b.className = 'swatch'; b.setAttribute('aria-label', it.name);
    const open = unlocked(it);
    b.setAttribute('aria-pressed', String(outfitItem(wardCat).id === it.id));
    b.appendChild(outfitIcon(wardCat, it));
    if (!open) { b.classList.add('locked'); b.insertAdjacentHTML('beforeend', LOCK_SVG); }
    b.addEventListener('click', () => {
      if (!open) { sfx.nope(); speak(it.boss ? `${it.name} je odměna za poražení Ender draka.` : it.streak ? `${it.name} se odemkne, až budeš hrát ${it.streak} dní v řadě.` : it.ench ? 'Očarování získáš za zvládnuté úkoly. Podívej se do knihy očarování.' : `${it.name} se odemkne, až vykopeš víc kol.`); return; }
      save.outfit[wardCat] = it.id; persist();
      if (wardCat === 'enchant' && it.id === 'ano' && !['shirt', 'pants', 'shoes', 'hat'].some(k => isMetal(outfitItem(k)))) { renderWardrobe(); speak('Očarovat jde brnění, helmy a kovové boty. A krumpáč!'); return; }
      tone(880, 0, .08, 'square', .05); tone(1320, .07, .1, 'square', .05);
      renderWardrobe(); speak(it.name);
    });
    items.appendChild(b);
  });
  if (wardCat === 'enchant') { const book = document.createElement('div'); book.className = 'ward-book'; renderEnchBook(book); items.appendChild(book); }
}
function openHouse() {
  G.speechId++; if (synth) synth.cancel();
  show('house'); drawHouse($('#houseBig'));
  const st = Math.min(12, save.total);
  $('#houseCap').textContent = st === 0 ? 'Dům zatím nestojí. Vykopej první kolo!' : st < 12 ? `Postaveno ${st} z 12 dílů` : 'Dům je hotový! Každé kolo přidá zahradu.';
  fitCanvas($('#houseBig'));
}

export { ELL_SVG, LOCK_SVG, blockEl, openHouse, openWardrobe, paintTextures, renderHome, renderWardrobe, setGlyph, show, wardCat };
