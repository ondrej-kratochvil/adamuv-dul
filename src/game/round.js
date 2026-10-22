// Herní kolo
import { G } from '../core/state.js';
import { QUICK_WRONG_MS, recordResult } from '../logic/mastery.ts';
import { BUILD_UNLOCK, addBlocks } from '../logic/build.ts';
import { speechActivity, stopMic } from '../levels/speech.js';
import { updateTools } from '../logic/tools.ts';
import { toolName } from '../content/tools.ts';
import { toolCanvas } from '../gfx/tools.js';
import { fitBuild } from '../world/build.js';
import { NEED_CLEAN, STUCK_MS, errorCost, errorWarning, needClean, stuckMsFor } from '../logic/rewards.ts';
import { $, REDUCED } from '../core/dom.js';
import { persist, save } from '../save/save.ts';
import { cracks, pick, tex, texCanvas } from '../gfx/textures.js';
import { OUTFIT, OUTFIT_CATS, mountPlayer, outfitIcon, pickCanvas, tierOf } from '../gfx/player.js';
import { STAGES, drawHouse } from '../world/house.js';
import { speak, synth } from '../audio/speech.js';
import { audio, sfx } from '../audio/sfx.js';
import { layoutTrace, setupTrace, writingSay } from '../levels/writing.js';
import { LEVELS, choiceCount, display, makeChoices, picCanvas, pickTarget, sayText } from '../levels/reading.js';
import { blockEl, renderHome, show } from '../ui/screens.js';
import { FARM_STAGES, FARM_START, PERFECT_BONUS, bark, dogHappy, drawFarm, farmStage, fitCanvas, gemWord, mountDog, spr, sprIcon, updateGems } from '../world/farm.js';
import { dayWord, registerDay } from '../rewards/streak.js';
import { cheerFor, dogName } from '../world/family.js';
import { questAfterRound } from '../world/daily.js';
import { ROMAN, checkEnchants, enchLevel, luckBonus, pieceName } from '../rewards/enchant.js';
import { BLD_STAGES, VILLAGE_BONUS, checkVillage, signCanvas } from '../world/village.js';
import { NETHER_STAGES, PORTAL_NEED, mineTex } from '../world/nether.js';
import { cardEl, checkCards } from '../rewards/cards.js';
import { BABY_DAYS, babyCanvas } from '../world/babies.js';
import { PREROV } from '../world/prerov.js';
import { bossHit, bossVictory, curLevel, levelDef } from '../world/finale.js';
import { setBtn } from '../ui/icons.js';
import { flushRate, logRound } from '../app/stats.js';
import { updateHint } from '../ui/hint.js';
import { levelName, queueRows } from '../app/sync.js';
import { restingLevel, suggestLevel } from '../logic/rotation.ts';
import { YOUTUBER_LINES, YT_SHARE } from '../content/youtuber-lines.ts';
import { pickLine, remember } from '../logic/family.ts';

const ROUND_LEN = 8;
// kolik kostek z 8 musí být bez chyby, aby dům rostl
// Ochrana na helmě, brnění, chráničích a botách zkracuje zaseknutí po chybě (logic/rewards.ts)
const protectionLevels = () => ['hat', 'shirt', 'pants', 'shoes'].reduce((a, pc) => a + enchLevel(pc, 'Ochrana'), 0);
const stuckMs = () => stuckMsFor(protectionLevels());
function startRound(level) {
  flushRate();
  const L = levelDef(level);
  G.R = { level, i: 0, busy: true, recent: [], loot: [], clean: 0, len: L.len || ROUND_LEN, start: Date.now(), pauses: 0, pauseMs: 0, errors: 0, lost: 0 };
  $('#game').classList.remove('paused'); $('#pauseOverlay').hidden = true;
  G.TR = null; $('#trace').hidden = true; $('#blocks').hidden = false; $('#task').hidden = true;
  show('game');
  $('#gameGround').style.backgroundImage = `url(${tex(mineTex(L.tex), true)})`;
  const isBoss = level === 'boss'; $('#game').classList.toggle('ender', isBoss); $('#bossBar').hidden = !isBoss;
  if (isBoss) { const dc = $('#bossDragon'); dc.width = 32; dc.height = 16; dc.getContext('2d').drawImage(spr('dragon'), 0, 0); $('#bossHp').style.width = '100%'; }
  const nm = mineTex(L.tex) !== L.tex; $('#game').classList.toggle('nethered', nm); $('#game .grass-strip').style.backgroundImage = `url(${tex(isBoss ? 'endStone' : nm ? 'netherrack' : 'grass')})`;
  mountPlayer($('#gamePlayer')); mountDog($('#gameDog')); updateGems();
  const hp = $('#hudPick'); hp.innerHTML = ''; hp.appendChild(pickCanvas(tierOf(save.total)));
  const pips = $('#pips'); pips.innerHTML = '';
  for (let i = 0; i < G.R.len; i++) { const p = document.createElement('span'); p.className = 'pip'; pips.appendChild(p); }
  $('#blocks').innerHTML = '';
  speak(L.intro, () => nextTask());
}
function nextTask() {
  if (!G.R) return;
  if (G.R.paused) { G.R.resumeNext = true; return; } // během pauzy další úkol počká
  if (G.R.i >= G.R.len) return endRound();
  const level = G.R.level, L = curLevel();
  let target;
  $('#speechPanel').hidden = true;
  if (L.speech && speechActivity()) return; // Mluvení: vyslovit, cvik, foukání v panelu
  if (L.trace) {
    const ch = L.trace();
    G.R.recent.push(ch); G.R.target = ch; G.R.say = writingSay(ch); G.R.statKey = 'writing:' + ch;
    G.R.hits = 0; G.R.wrongs = 0; G.R.firstTry = true; G.R.busy = false; G.R.stuck = false;
    $('#blocks').hidden = true; $('#trace').hidden = false; $('#task').hidden = true;
    G.R.els = null; setupTrace(ch); updateHint();
    G.R.shownAt = Date.now();
    const say = G.R.say; setTimeout(() => { if (G.R && G.R.say === say && !G.R.busy) speak(say); }, 250);
    return;
  }
  $('#trace').hidden = true; $('#blocks').hidden = false;
  if (L.gen) {
    const t = L.gen();
    target = t.answer; G.R.choices = t.choices; G.R.say = t.say; G.R.statKey = t.stat; G.R.recent.push(t.key); G.R.after = t.after || ''; G.R.picture = !!t.picture;
    $('#task').hidden = !t.task; if (t.task) $('#task').innerHTML = `<span>${t.task}</span>`;
  } else {
    target = pickTarget(level, G.R.recent.slice(-2));
    G.R.recent.push(target);
    G.R.choices = makeChoices(level, target, choiceCount(level)); G.R.say = sayText(level, target); G.R.statKey = level + ':' + target; G.R.after = ''; G.R.picture = false;
    $('#task').hidden = true;
  }
  G.R.target = target;
  G.R.hits = 0; G.R.wrongs = 0; G.R.firstTry = true; G.R.busy = false; G.R.stuck = false;
  // doba řešení a záměny (Statistiky, Procvičování, tabulka): od ukázání kostek; tip = chyba do 1,2 s od konce zadání
  G.R.shownAt = Date.now(); G.R.heardAt = 0; G.R.wrongPicks = []; G.R.quick = 0;
  $('#blocks').classList.remove('stuck'); $('#hudPick').classList.remove('stuck');
  const box = $('#blocks'); box.innerHTML = '';
  G.R.els = G.R.choices.map(it => {
    const b = blockEl(mineTex(L.tex), G.R.picture ? '' : L.label ? L.label(it) : display(it), it.length > 1);
    if (G.R.picture) { const pl = b.querySelector('.plate'); pl.innerHTML = ''; pl.appendChild(picCanvas(it)); }
    else if (it.length >= 3) b.querySelector('.glyph').style.fontSize = `calc(var(--bs, 120px) * ${Math.min(.32, 1 / it.length).toFixed(3)})`; // delší slova menším písmem, ať se vejdou
    b.setAttribute('aria-label', 'kostka');
    b.addEventListener('click', () => tapBlock(it, b));
    box.appendChild(b); return b;
  });
  layoutBlocks();
  updateHint();
  const say = G.R.say;
  setTimeout(() => { if (G.R && G.R.say === say && !G.R.busy) speak(say, () => { if (G.R && G.R.say === say && !G.R.heardAt) G.R.heardAt = Date.now(); }); }, 250);
}
function layoutBlocks() {
  if (!G.R || !G.R.els) return;
  const box = $('#blocks'); const cs = getComputedStyle(box);
  const W = box.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const H = box.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const n = G.R.els.length, gap = Math.max(14, Math.min(W, H) * .05);
  let best = 0, bestC = n;
  for (let c = 1; c <= n; c++) { const r = Math.ceil(n / c); const s = Math.min((W - gap * (c - 1)) / c, (H - gap * (r - 1)) / r); if (s > best) { best = s; bestC = c; } }
  best = Math.max(60, Math.min(best, 240));
  box.style.setProperty('--bs', best + 'px');
  box.style.gridTemplateColumns = `repeat(${bestC}, var(--bs))`;
  box.style.gap = gap + 'px';
}
addEventListener('resize', () => { if (!$('#build').hidden) fitBuild(); layoutBlocks(); if (G.TR && !$('#trace').hidden) layoutTrace(); if (!$('#house').hidden) fitCanvas($('#houseBig')); if (!$('#farm').hidden) fitCanvas($('#farmBig')); if (!$('#nether').hidden) fitCanvas($('#netherBig')); if (!$('#prerov').hidden) fitCanvas($('#prerovBig')); if (!$('#ender').hidden) fitCanvas($('#enderBig')); });
function retrigger(el, cls) { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); }
function tapBlock(it, el) {
  if (!G.R || G.R.busy || G.R.stuck || G.R.paused) return;
  audio();
  const pl = $('#gamePlayer'); retrigger(pl, 'swing');
  if (it !== G.R.target) {
    // chyba: krumpáč se na chvíli zasekne, takže tipování se nevyplácí
    G.R.firstTry = false; G.R.wrongs++; G.R.stuck = true;
    const pen = penalize();
    if (G.R.wrongPicks) { G.R.wrongPicks.push(it); if (!G.R.heardAt || Date.now() - G.R.heardAt < QUICK_WRONG_MS) G.R.quick++; }
    sfx.nope(); retrigger(el, 'nope');
    $('#blocks').classList.add('stuck'); retrigger($('#hudPick'), 'stuck');
    if (G.R.wrongs >= 2) G.R.els[G.R.choices.indexOf(G.R.target)].classList.add('glow');
    const t = G.R.target;
    setTimeout(() => { if (G.R && G.R.target === t && !G.R.busy) speak(pen + (G.R.picture ? 'Chyba, krumpáč se zasekl. Přečti slovo ještě jednou, písmenko po písmenku.' : (/^math:/.test(G.R.statKey) ? 'Chyba, krumpáč se zasekl. Zkus to znovu: ' : 'Chyba, krumpáč se zasekl. Poslouchej: ') + G.R.say)); }, 300);
    setTimeout(() => { if (G.R && G.R.target === t) { G.R.stuck = false; $('#blocks').classList.remove('stuck'); $('#hudPick').classList.remove('stuck'); } }, stuckMs());
    return;
  }
  const taps = tierOf(save.total).taps;
  G.R.hits++;
  if (G.R.hits < taps) {
    sfx.dig(); retrigger(el, 'hit');
    el.querySelector('.crack').style.backgroundImage = `url(${cracks[Math.min(3, Math.ceil(G.R.hits / taps * 3))]})`;
    return;
  }
  breakBlock(el);
}
// řádek úlohy do tabulky Google (app/sync.js)
function logTask(ms, wrong, quick) {
  const [lv, ...rest] = G.R.statKey.split(':');
  queueRows([{ Druh: 'úloha', Patro: levelName(lv), Úloha: rest.join(':'), Napoprvé: G.R.firstTry ? 'ano' : 'ne', Sekundy: Math.round(ms / 100) / 10, Záměny: wrong.join(', '), Tipy: quick, Kolo: levelName(G.R.level) }]);
}
// občas po kole věta o youtuberech, které Adam sleduje (content/youtuber-lines.ts); neopakuje nedávné
function ytLine(ok) {
  if (Math.random() >= YT_SHARE) return '';
  const line = pickLine(ok ? YOUTUBER_LINES.ok : YOUTUBER_LINES.fail, [], save.recentLines || []);
  save.recentLines = remember(save.recentLines || [], line); persist();
  return ' ' + line;
}
// chyba v kole: od třetí stojí smaragd (logic/rewards.ts errorCost); vrací větu, která se řekne před opakováním zadání
function penalize() {
  G.R.errors++;
  const cost = errorCost(G.R.errors, G.R.lost, save.emeralds);
  if (cost) { save.emeralds -= cost; G.R.lost += cost; persist(); updateGems(); retrigger($('#hudGems'), 'lose'); return 'Smaragd je pryč. '; }
  return errorWarning(G.R.errors) ? 'Pozor, další chyba už bude stát smaragd. ' : '';
}
const PRAISE = ['Výborně!', 'Super!', 'Ano!', 'Paráda!', 'Skvěle!', 'To je ono!', 'Přesně tak!'];
function breakBlock(el) {
  G.R.busy = true;
  const ms = Date.now() - G.R.shownAt;
  recordResult(save.stats, G.R.statKey, G.R.firstTry, { ms, wrong: G.R.wrongPicks, quick: G.R.quick }); persist();
  logTask(ms, G.R.wrongPicks || [], G.R.quick || 0);
  el.querySelector('.crack').style.backgroundImage = `url(${cracks[3]})`;
  sfx.breakIt();
  const rect = el.getBoundingClientRect();
  const texName = mineTex(curLevel().tex);
  if (!REDUCED) burst(rect, texName);
  el.classList.add('gone');
  const pip = $('#pips').children[G.R.i];
  const clean = G.R.firstTry;
  if (clean) { G.R.clean++; save.emeralds += 1 + luckBonus(); persist(); updateGems('hudGems'); dogHappy($('#gameDog')); }
  G.R.loot.push({ t: texName, clean });
  const done = () => { pip.classList.add('done', clean ? 'clean' : 'miss'); pip.style.backgroundImage = `url(${tex(texName)})`; };
  if (REDUCED) done(); else flyTo(rect, pip, texName, done);
  G.R.i++;
  if (G.R.level === 'boss') bossHit(el);
  const target = G.R.target;
  setTimeout(() => {
    if (!G.R || G.R.target !== target) return;
    if (G.R.paused) { G.R.resumeNext = true; return; }
    speak(pick(Math.random, PRAISE) + (G.R.after ? ' ' + G.R.after : ''), () => setTimeout(nextTask, 200));
  }, 250);
}
function burst(rect, texName) {
  const c = texCanvas(texName).getContext('2d').getImageData(0, 0, 16, 16).data;
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  for (let i = 0; i < 14; i++) {
    const d = document.createElement('div'); d.className = 'chip';
    const p = Math.floor(Math.random() * 256) * 4; d.style.background = `rgb(${c[p]},${c[p + 1]},${c[p + 2]})`;
    d.style.left = cx + (Math.random() - .5) * rect.width * .5 + 'px'; d.style.top = cy + (Math.random() - .5) * rect.height * .5 + 'px';
    document.body.appendChild(d);
    const dx = (Math.random() - .5) * rect.width * 1.2, up = -40 - Math.random() * 70, fall = 80 + Math.random() * 90;
    const an = d.animate([{ transform: 'translate(0,0)' }, { transform: `translate(${dx * .6}px,${up}px)`, offset: .35 }, { transform: `translate(${dx}px,${fall}px)`, opacity: 0 }], { duration: 650 + Math.random() * 250, easing: 'ease-out' });
    an.onfinish = () => d.remove();
  }
}
function flyTo(rect, pip, texName, cb) {
  const pr = pip.getBoundingClientRect();
  const f = document.createElement('div'); f.className = 'flyer';
  const s = Math.min(70, rect.width * .4);
  Object.assign(f.style, { width: s + 'px', height: s + 'px', left: rect.left + rect.width / 2 - s / 2 + 'px', top: rect.top + rect.height / 2 - s / 2 + 'px', backgroundImage: `url(${tex(texName)})` });
  document.body.appendChild(f);
  const dx = pr.left + pr.width / 2 - (rect.left + rect.width / 2), dy = pr.top + pr.height / 2 - (rect.top + rect.height / 2);
  const an = f.animate([{ transform: 'translate(0,0) scale(1) rotate(0)' }, { transform: `translate(${dx * .4}px,${dy * .4 - 40}px) scale(.9) rotate(90deg)`, offset: .4 }, { transform: `translate(${dx}px,${dy}px) scale(${pr.width / s}) rotate(180deg)` }], { duration: 600, easing: 'ease-in' });
  an.onfinish = () => { f.remove(); cb(); };
}
// obrázek na konci kola a tlačítko pod ním ukazují totéž: dům, nebo farmu
function showEndPlace(place) {
  (place === 'house' ? drawHouse : drawFarm)($('#endHouse'));
  $('#endOverlay').dataset.place = place;
  setBtn($('#btnEndHouse'), 'house', place === 'house' ? 'Můj dům' : 'Farma');
}
function endRound() {
  addBlocks(save.build, G.R.loot.map(l => l.t)); persist(); // vykopané kostky do zásoby na stavění
  if (G.R.level === 'boss') { const eb = $('#endBlocks'); eb.hidden = !G.R.loot.length || save.total < BUILD_UNLOCK; eb.textContent = `Vykopané kostky (${G.R.loot.length}) čekají ve Stavění.`; return bossVictory(); }
  const level = G.R.level;
  const need = needClean(save.strict, G.R.len);
  const ok = G.R.clean >= need;
  // text až podle toho, jestli kolo vyšlo: nepovedené 12. kolo dům nedostaví (review 3)
  { const n = G.R.loot.length, eb = $('#endBlocks'); eb.hidden = !n;
    eb.textContent = n ? (save.total >= BUILD_UNLOCK || (G.R.level !== 'boss' && ok && save.total + 1 >= BUILD_UNLOCK) ? `Vykopané kostky (${n}) čekají ve Stavění.` : `Vykopané kostky (${n}) si schovávám na Stavění. Otevře se, až dostavíš dům.`) : ''; }
  const perfect = G.R.clean === G.R.len;
  const earned = G.R.clean + (perfect ? PERFECT_BONUS : 0);
  if (perfect) { save.emeralds += PERFECT_BONUS; persist(); }
  const loot = $('#loot'); loot.innerHTML = '';
  G.R.loot.forEach(({ t, clean }) => { const sp = document.createElement('span'); sp.className = clean ? 'clean' : 'miss'; sp.style.backgroundImage = `url(${tex(t)})`; loot.appendChild(sp); });
  const newEnch = checkEnchants();
  const ne = $('#newEnch');
  if (newEnch.length) { ne.hidden = false; ne.innerHTML = ''; ne.appendChild(outfitIcon('enchant', { id: 'ano' })); ne.insertAdjacentHTML('beforeend', `<span>Nové očarování: ${newEnch.map(e => `${pieceName(e.pc)} ${e.name} ${ROMAN[e.lvl]}`).join(', ')}!</span>`); }
  else ne.hidden = true;
  const nc = checkCards(false), ncEl = $('#newCards');
  if (nc.length) { ncEl.hidden = false; ncEl.innerHTML = ''; nc.slice(0, 3).forEach(c => ncEl.appendChild(cardEl(c.w, true))); ncEl.insertAdjacentHTML('beforeend', `<span>${nc.length > 1 ? 'Nové kartičky' : 'Nová kartička'} do sbírky: ${nc.map(c => display(c.w)).join(', ')}!${nc[0].bonus ? ` Máš celou sbírku, +${nc[0].bonus} smaragdů!` : ''}</span>`); }
  else ncEl.hidden = true;
  const cardTalk = nc.length ? ` ${nc.length > 1 ? 'Máš nové kartičky' : 'Máš novou kartičku'} do sbírky: ${nc.map(c => c.w.toLocaleLowerCase('cs')).join(', ')}.${nc[0].bonus ? ' Máš celou sbírku!' : ''}` : '';
  const vil = checkVillage(false), nv = $('#newVillage');
  if (vil.length) { nv.hidden = false; nv.innerHTML = ''; nv.appendChild(signCanvas(vil[0].b.icon)); nv.insertAdjacentHTML('beforeend', `<span>Ve vesnici přibylo: ${vil.map(v => `${v.b.name} (${BLD_STAGES[v.st - 1]})`).join(', ')}${vil.some(v => v.st >= 8) ? `! Budova je hotová, +${VILLAGE_BONUS} smaragdů` : ''}!</span>`); }
  else nv.hidden = true;
  const vilTalk = vil.length ? ' Ve vesnici přibylo: ' + vil.map(v => v.st >= 8 ? `${v.b.name} je hotová a nastěhoval se ${v.b.who}` : `${v.b.name}, ${BLD_STAGES[v.st - 1]}`).join(' a ') + '.' : '';
  const enchTalk = newEnch.length ? ` Máš nové očarování: ${newEnch.map(e => `${pieceName(e.pc)}, ${e.name} ${e.lvl}`).join(' a ')}.` : '';
  const eg = $('#endGems');
  const lostR = G.R.lost || 0;
  const lostTalk = lostR ? ` Za chyby jsi ztratil ${lostR} ${gemWord(lostR)}.` : '';
  const showGems = (bonus = 0, quest = 0) => {
    const extra = [perfect ? `${PERFECT_BONUS} za kolo bez chyby` : '', bonus ? `${bonus} za řadu dní` : '', quest ? `${quest} za dnešní úkol` : ''].filter(Boolean).join(', ');
    eg.innerHTML = ''; eg.appendChild(sprIcon('emerald'));
    eg.append(`+${earned + bonus + quest}` + (extra ? ` (z toho ${extra})` : '') + (lostR ? `, za chyby −${lostR}` : '') + `, máš ${save.emeralds}`);
  };
  showGems();
  const np = $('#newPick'), no = $('#newOutfit');
  const title = $('#endTitle');
  const building = save.total < FARM_START;
  const farmDone = save.total >= FARM_START + FARM_STAGES.length;
  const grows = building ? 'Dům vyroste' : farmDone ? 'Kolo se započítá' : 'Farma vyroste';
  const grewNot = building ? 'dům nevyrostl' : farmDone ? 'se kolo nezapočítalo' : 'farma nevyrostla';
  $('#endOverlay').dataset.level = level;
  if (!ok) {
    // nepovedené kolo se nepočítá: nic neroste, nic se neodemyká, obtížnost se nezvedá (smaragdy za kostky bez chyby zůstanou)
    title.textContent = 'Skoro!'; title.classList.add('fail');
    $('#endLine').textContent = `Bez chyby: ${G.R.clean} z ${G.R.len}. ${grows}, když jich bude aspoň ${need}.`;
    np.hidden = true; no.hidden = true; $('#newNether').hidden = true; $('#newBaby').hidden = true; $('#newPrerov').hidden = true;
    setBtn($('#btnAgain'), 'retry', 'Zkusit znovu');
    showEndPlace(building ? 'house' : 'farm');
    const got = G.R.clean, R_len = G.R.len;
    logRound(false);
    G.R = null;
    $('#endOverlay').hidden = false;
    sfx.nope();
    const enc = cheerFor(false) + ytLine(false);
    speak(`Tentokrát ${grewNot}. Bez chyby jsi měl ${got} z ${R_len}, potřebuješ aspoň ${need}. ${enc}${lostTalk}${enchTalk}${vilTalk}${cardTalk}${rotate(level)}`);
    $('#btnAgain').focus({ preventScroll: true });
    return;
  }
  logRound(true);
  title.textContent = 'Výborně, Adame!'; title.classList.remove('fail');
  setBtn($('#btnAgain'), 'next', 'Další kolo');
  const before = tierOf(save.total);
  save.total++; if (level in save.rounds) save.rounds[level]++; else if (level === 'practice') save.practice = (save.practice || 0) + 1; persist();
  const day = registerDay();
  const questBonus = questAfterRound(level, true, perfect); // dnešní úkol (world/daily.js)
  if (day || questBonus) showGems(day ? day.bonus : 0, questBonus);
  const questTalk = questBonus ? ` Splnil jsi dnešní úkol! Bonus ${questBonus} ${gemWord(questBonus)}.` : '';
  const pn = $('#newPrerov'); let prerovTalk = '';
  const newPlaces = day ? PREROV.filter(x => day.prevBest < x.at && day.count >= x.at) : [];
  if (newPlaces.length) { pn.hidden = false; pn.innerHTML = ''; pn.appendChild(signCanvas('A')); pn.insertAdjacentHTML('beforeend', `<span>V Přerově přibylo: ${newPlaces.map(x => x.name).join(', ')}!</span>`); prerovTalk = ` Hraješ ${day.count} dní v řadě, a tak v Přerově přibylo: ${newPlaces.map(x => x.name).join(' a ')}!`; }
  else pn.hidden = true;
  const nb = $('#newBaby'); let babyTalk = '';
  if (day && day.baby) { nb.hidden = false; nb.innerHTML = ''; const bc = babyCanvas(day.baby); bc.style.width = '48px'; bc.style.height = '40px'; nb.appendChild(bc); nb.insertAdjacentHTML('beforeend', `<span>Tento týden jsi hrál ${BABY_DAYS} dny. Na farmě se narodilo ${day.baby.name}!</span>`); babyTalk = ` Tento týden jsi hrál už ${BABY_DAYS} dny, a tak se na farmě narodilo ${day.baby.name}!`; }
  else nb.hidden = true;
  const nn = $('#newNether'); let netherTalk = '';
  if (day) {
    nn.hidden = false; nn.innerHTML = ''; nn.appendChild(sprIcon('portalIcon'));
    const o = day.obsidian;
    const txt = o < PORTAL_NEED ? `Dnešní den: obsidián na portál (${o} z ${PORTAL_NEED})` : o === PORTAL_NEED ? 'Portál do Netheru se zapálil' : o - PORTAL_NEED <= NETHER_STAGES.length ? `V Netheru přibylo: ${NETHER_STAGES[o - PORTAL_NEED - 1]}` : 'Další den v Netheru';
    nn.insertAdjacentHTML('beforeend', `<span>${txt}!</span>`);
    netherTalk = o < PORTAL_NEED ? ` Za dnešní den máš obsidián, už ${o} z ${PORTAL_NEED} na portál.` : o === PORTAL_NEED ? ' Portál do Netheru se zapálil! Podívej se na úvodní obrazovce.' : o - PORTAL_NEED <= NETHER_STAGES.length ? ` V Netheru přibylo: ${NETHER_STAGES[o - PORTAL_NEED - 1]}.` : '';
  } else nn.hidden = true;
  const after = tierOf(save.total);
  const newTier = after !== before;
  const st = save.total;
  const fs = farmStage();
  const grew = st <= FARM_START ? `Přibylo na domě: ${STAGES[st - 1]}.` : st <= FARM_START + FARM_STAGES.length ? `Na farmě přibylo: ${FARM_STAGES[fs - 1]}.` : 'Dům i farma stojí. Ve vesnici staví každé patro svou budovu.';
  $('#endLine').textContent = (perfect ? 'Bez jediné chyby! ' : `Bez chyby: ${G.R.clean} z ${G.R.len}. `) + grew;
  const newTools = updateTools(save.stats, save.gear.stages); if (newTools.length) persist();
  if (newTier || newTools.length) {
    np.hidden = false; np.innerHTML = '';
    if (newTier) np.appendChild(pickCanvas(after)); newTools.forEach(n => np.appendChild(toolCanvas(n.tool, n.stage)));
    np.insertAdjacentHTML('beforeend', `<span>${[newTier ? `Nový krumpáč: ${after.name}` : '', ...newTools.map(n => `Nové v šatníku: ${toolName(n.tool, n.stage)}`)].filter(Boolean).join('. ')}!</span>`);
  } else np.hidden = true;
  const toolTalk = newTools.length ? ` V šatníku máš ${newTools.map(n => toolName(n.tool, n.stage)).join(' a ')}.` : '';
  const fresh = OUTFIT_CATS.flatMap(([cat]) => OUTFIT[cat].filter(it => it.at === st || (day && it.streak && day.prevBest < it.streak && day.count >= it.streak)).map(it => [cat, it]));
  if (fresh.length) { no.hidden = false; no.innerHTML = ''; fresh.forEach(([cat, it]) => no.appendChild(outfitIcon(cat, it))); no.insertAdjacentHTML('beforeend', `<span>Nové oblečení v šatníku: ${fresh.map(([, it]) => it.name).join(', ')}!</span>`); }
  else no.hidden = true;
  showEndPlace(st <= FARM_START ? 'house' : 'farm');
  G.R = null;
  $('#endOverlay').hidden = false;
  sfx.fanfare(); if (newTier || perfect) sfx.sparkle();
  if (st === FARM_START + 1) bark();
  const dn = dogName();
  const story = st === FARM_START ? ' Dům je hotový! Příště začneš stavět farmu. Stavění je otevřené.' : st === FARM_START + 1 ? ` Přiběhl k tobě pejsek${dn ? ' ' + dn : ''}! Je tvůj a bude s tebou kopat. Na úvodní obrazovce na něj klepni a vyber mu jméno a barvu.` : st === FARM_START + FARM_STAGES.length ? ' Farma je hotová!' : '';
  const milestone = st === FARM_START ? 'Dostavěl jsi dům, gratulujeme!' : st === FARM_START + FARM_STAGES.length ? 'Farma je hotová, jsme na tebe moc pyšní!' : (day && day.count === 7) ? 'Sedm dní v řadě, to je výkon!' : (day && day.count > 0 && day.count % 30 === 0) ? `${day.count} dní v řadě! Jsme na tebe pyšní.` : '';
  const cheer = cheerFor(true, milestone) + ytLine(true);
  const dayTalk = day ? (day.usedTotem ? ` Totem zachránil tvou řadu!` : '') + (day.count > 1 ? ` Hraješ ${day.count} ${dayWord(day.count)} v řadě, bonus ${day.bonus} ${gemWord(day.bonus)}.` : ` Dnešní den se počítá do řady, bonus ${day.bonus} ${gemWord(day.bonus)}.`) : '';
  // pokrok na domě nebo farmě říct nahlas (Ondřej 19. 10. 2026), po hotové farmě už ne
  const grewTalk = st <= FARM_START + FARM_STAGES.length ? ' ' + grew : '';
  const rot = rotate(level);
  speak((perfect ? 'Bez jediné chyby! ' : '') + cheer + lostTalk + grewTalk + (newTier ? ` Máš nový ${after.name} krumpáč!` : '') + story + questTalk + dayTalk + netherTalk + babyTalk + prerovTalk + toolTalk + enchTalk + vilTalk + cardTalk + (fresh.length ? ` V šatníku máš ${fresh.map(([, it]) => it.name).join(' a ')}.` : '') + rot);
  $('#btnAgain').focus({ preventScroll: true });
}
// Pauza (Ondřej 20. 10. 2026): zadání se schová, čas stojí; v deníku a tabulce se pauza odliší od odchodu z kola
function pauseRound(auto = false) {
  if (!G.R || G.R.paused || !$('#endOverlay').hidden) return;
  G.R.paused = true; G.R.pausedAt = Date.now(); G.R.pauses++;
  G.speechId++; if (synth) synth.cancel(); // nedořečená věta se po pauze nezopakuje sama: postará se resumeRound
  $('#game').classList.add('paused'); $('#pauseOverlay').hidden = false;
  if (!auto) speak('Pauza. Zadání jsem schoval. Až budeš chtít pokračovat, klepni na zelené tlačítko s trojúhelníkem, je na něm napsáno Pokračovat.');
}
function resumeRound() {
  if (!G.R || !G.R.paused) return;
  audio();
  const d = Date.now() - G.R.pausedAt;
  // čas pauzy se do doby úlohy ani kola nepočítá
  G.R.start += d; if (G.R.shownAt) G.R.shownAt += d; if (G.R.heardAt) G.R.heardAt += d; G.R.pauseMs += d;
  G.R.paused = false; G.speechId++; if (synth) synth.cancel();
  $('#game').classList.remove('paused'); $('#pauseOverlay').hidden = true;
  if (G.R.resumeNext || G.R.busy) { G.R.resumeNext = false; G.R.busy = true; nextTask(); }
  else if (G.R.say) speak(G.R.say);
}
// po 3 kolech stejného patra nabídne tlačítko jiné patro (logic/rotation.ts); vrací větu k přečtení
function rotate(level) {
  const rest = restingLevel(save.log, Object.keys(LEVELS));
  if (rest !== level) return '';
  const sug = suggestLevel(save.log, Object.keys(LEVELS), level), name = LEVELS[sug].name;
  $('#endOverlay').dataset.level = sug;
  setBtn($('#btnAgain'), 'next', `Hrát ${name}`);
  return ` Patro ${LEVELS[level].name} si teď dá pauzu. Zkus ${name}: tlačítko se šipkou, je na něm napsáno Hrát ${name}.`;
}
function goHome() {
  flushRate();
  stopMic();
  $('#game').classList.remove('paused'); $('#pauseOverlay').hidden = true;
  G.speechId++; if (synth) synth.cancel();
  if (G.R && G.R.level !== 'boss' && G.R.i > 0 && G.R.i < G.R.len) logRound(false, true); // rozehrané a opuštěné kolo: signál, že nebaví
  if (G.R && G.R.loot.length && $('#endOverlay').hidden) { addBlocks(save.build, G.R.loot.map(l => l.t)); persist(); } // už vykopané kostky se neztratí
  G.R = null; $('#endOverlay').hidden = true;
  renderHome(); show('home');
}

export { penalize, pauseRound, resumeRound, NEED_CLEAN, PRAISE, logTask, ROUND_LEN, STUCK_MS, breakBlock, burst, endRound, flyTo, goHome, layoutBlocks, nextTask, protectionLevels, retrigger, startRound, stuckMs, tapBlock };
