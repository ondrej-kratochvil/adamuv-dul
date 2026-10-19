import './styles.css';
// Tlačítka
import { G } from './core/state.js';
import { $ } from './core/dom.js';
import { persist, save } from './save/save.ts';
import { season } from './world/house.js';
import { speak, synth } from './audio/speech.js';
import { audio } from './audio/sfx.js';
import { traceDown, traceMove, traceUp } from './levels/writing.js';
import { openHouse, openWardrobe, paintTextures, renderHome } from './ui/screens.js';
import { openDog, openShop, sprIcon } from './world/farm.js';
import { openStreak } from './rewards/streak.js';
import { noteWho, renderNotes } from './world/family.js';
import { checkEnchants } from './rewards/enchant.js';
import { checkVillage } from './world/village.js';
import { openNether } from './world/nether.js';
import { checkCards } from './rewards/cards.js';
import { initBabies } from './world/babies.js';
import { startBoss } from './world/finale.js';
import { applyName, checkVersion, gameName, openNames } from './app/name.js';
import { iconizeButtons } from './ui/icons.js';
import { openStats } from './app/stats.js';
import { goHome, startRound } from './game/round.js';

$('#btnBack').addEventListener('click', goHome);
$('#btnHouseBack').addEventListener('click', goHome);
$('#btnWardBack').addEventListener('click', goHome);
$('#btnFarmBack').addEventListener('click', goHome);
$('#btnVillageBack').addEventListener('click', goHome);
$('#btnNetherBack').addEventListener('click', goHome);
$('#btnAlbumBack').addEventListener('click', goHome);
$('#btnPrerovBack').addEventListener('click', goHome);
$('#btnEnderBack').addEventListener('click', goHome);
$('#btnFight').addEventListener('click', startBoss);
$('#btnVictoryHome').addEventListener('click', () => { G.speechId++; if (synth) synth.cancel(); $('#victoryOverlay').hidden = true; goHome(); });
$('#btnNetherMine').addEventListener('click', () => { audio(); save.netherMine = !save.netherMine; persist(); openNether(); speak(save.netherMine ? 'Teď kopeš v Netheru.' : 'Teď kopeš doma v dole.'); });
$('#btnShopBack').addEventListener('click', goHome);
$('#btnStreak').addEventListener('click', openStreak);
$('#btnStats').addEventListener('click', openStats);
$('#btnNoteAdd').addEventListener('click', () => { const t = $('#noteText').value.trim(); if (!t) return; save.notes.push({ who: noteWho, text: t, done: false, t: Date.now() }); persist(); $('#noteText').value = ''; renderNotes(); });
$('#dogName').addEventListener('input', e => { save.dogName = e.target.value; persist(); });
$('#btnStatsBack').addEventListener('click', goHome);
$('#traceCanvas').addEventListener('pointerdown', traceDown);
$('#traceCanvas').addEventListener('pointermove', traceMove);
['pointerup', 'pointercancel'].forEach(t => $('#traceCanvas').addEventListener(t, traceUp));
$('#btnStreakClose').addEventListener('click', () => { $('#streakOverlay').hidden = true; });
$('#btnFarmShop').addEventListener('click', openShop);
$('#btnFarmShop').appendChild(sprIcon('emerald'));
$('#heroPlayer').addEventListener('click', openWardrobe);
$('#heroDog').addEventListener('click', openDog);
$('#shopDog').addEventListener('click', openDog);
$('#btnDogClose').addEventListener('click', () => { $('#dogOverlay').hidden = true; renderHome(); });
$('#gameTitle').addEventListener('click', openNames);
$('#gameTitle').addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openNames(); } });
$('#btnNameClose').addEventListener('click', () => { $('#nameOverlay').hidden = true; speak(`Hra se jmenuje ${gameName()}.`); });
$('#btnListen').addEventListener('click', () => { audio(); if (G.R && G.R.say && !G.R.busy) speak(G.R.say); });
$('#btnAgain').addEventListener('click', () => { const lv = $('#endOverlay').dataset.level; $('#endOverlay').hidden = true; startRound(lv); });
$('#btnEndHouse').addEventListener('click', () => { $('#endOverlay').hidden = true; openHouse(); });
$('#btnEndHome').addEventListener('click', goHome);

if (season() === 'winter' || season() === 'xmas') document.body.classList.add('winter');
iconizeButtons();
applyName();
if (save.obsidian === null || save.obsidian === undefined) save.obsidian = save.streak.days.length; // obsidián i za dny odehrané před portálem
if (!save.babies) initBabies();
if (!save.cards) { save.cards = []; checkCards(true); } // kartičky za už zvládnutá slova
if (!save.village) { save.village = {}; checkVillage(true); } // vesnice začíná podle toho, co už Adam umí
checkEnchants(); // očarování za už zvládnuté úkoly
checkVersion(); // nová verze na serveru? (při startu a při návratu do hry)
document.addEventListener('visibilitychange', () => { if (!document.hidden) checkVersion(); });
paintTextures();
renderHome();
// ikona na ploše a hraní bez internetu
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
// pro automatické testy: přístup k běžícímu kolu a uloženému stavu
window.__adam = { get R() { return G.R; }, get TR() { return G.TR; }, get save() { return save; } };

