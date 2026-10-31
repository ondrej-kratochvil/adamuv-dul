// písma z vlastního serveru (Ondřej 31. 10. 2026: dřív z Google Fonts, Google tak viděl adresu zařízení); jen latinka a latinka s háčky
import '@fontsource/andika/latin-400.css';
import '@fontsource/andika/latin-ext-400.css';
import '@fontsource/andika/latin-700.css';
import '@fontsource/andika/latin-ext-700.css';
import '@fontsource/pixelify-sans/latin-500.css';
import '@fontsource/pixelify-sans/latin-ext-500.css';
import '@fontsource/pixelify-sans/latin-700.css';
import '@fontsource/pixelify-sans/latin-ext-700.css';
import './styles.css';
// Tlačítka
import { G } from './core/state.js';
import { updateTools } from './logic/tools.ts';
import { $ } from './core/dom.js';
import { persist, save } from './save/save.ts';
import { season } from './world/house.js';
import { speak, synth } from './audio/speech.js';
import { audio } from './audio/sfx.js';
import { traceDown, traceMove, traceUp } from './levels/writing.js';
import { openHouse, openWardrobe, paintTextures, renderHome } from './ui/screens.js';
import { openDog, openFarm, openShop, sprIcon } from './world/farm.js';
import { fitBuild, tapPlot } from './world/build.js';
import { openStreak } from './rewards/streak.js';
import { loadFamily, noteWho, renderNotes } from './world/family.js';
import { checkEnchants } from './rewards/enchant.js';
import { checkVillage } from './world/village.js';
import { openNether } from './world/nether.js';
import { checkCards } from './rewards/cards.js';
import { initBabies } from './world/babies.js';
import { startBoss } from './world/finale.js';
import { applyName, checkVersion, gameName, openNames, renderVersion } from './app/name.js';
import { iconizeButtons } from './ui/icons.js';
import { flushRate, openStats } from './app/stats.js';
import { goHome, pauseRound, resumeRound, startRound } from './game/round.js';
import { updateStages } from './game/ctx.js';
import { flushSync, initDevice } from './app/sync.js';
import { syncCloud } from './app/cloud.js';
import { moveIn, moveOut } from './app/move.js';
import { initProfiles } from './app/profiles.js';
import { clearFamily } from './world/dressup.js';
import { initDay } from './world/daily.js';
import { initPush } from './app/push.js';
import { persistStorage } from './app/device.js';
import { initShare } from './ui/share.js';
import { shortcutTarget } from './logic/shortcut.ts';
import { openDay } from './world/daily.js';
import { practiceReady } from './levels/practice.js';
import { codeFromText } from './logic/qr.ts';
import { askCodeRestore, initQrUi } from './ui/qr-ui.js';
import { initHunt } from './world/hunt.js';
import { initAbout } from './ui/about.js';
import { openGateForCode } from './ui/settings.js';
import { applyLetters } from './logic/letters.ts';
import { initSetup, needsSetup, openSetup } from './ui/setup.js';
import { profile } from './save/save.ts';
import { MAIN_ID } from './logic/profiles.ts';

$('#btnBack').addEventListener('click', goHome);
$('#btnPause').addEventListener('click', () => pauseRound());
$('#btnResume').addEventListener('click', resumeRound);
$('#btnHouseBack').addEventListener('click', goHome);
$('#btnWardBack').addEventListener('click', goHome);
$('#btnFarmBack').addEventListener('click', goHome);
$('#btnBuildBack').addEventListener('click', goHome);
$('#buildBig').addEventListener('pointerdown', tapPlot);
$('#btnVillageBack').addEventListener('click', goHome);
$('#btnNetherBack').addEventListener('click', goHome);
$('#btnAlbumBack').addEventListener('click', goHome);
$('#btnPrerovBack').addEventListener('click', goHome);
$('#btnEnderBack').addEventListener('click', goHome);
$('#btnFight').addEventListener('click', startBoss);
$('#btnVictoryHome').addEventListener('click', () => { G.speechId++; if (synth) synth.cancel(); $('#victoryOverlay').hidden = true; goHome(); });
$('#btnNetherMine').addEventListener('click', () => { audio(); save.netherMine = !save.netherMine; persist(); openNether(); speak(save.netherMine ? 'Teď kopeš v Netheru.' : 'Teď kopeš doma v dole.'); });
$('#btnShopBack').addEventListener('click', goHome);
$('#btnFamBack').addEventListener('click', goHome);
$('#btnLeadBack').addEventListener('click', goHome);
$('#btnFamClear').addEventListener('click', clearFamily);
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
$('#btnEndHouse').addEventListener('click', () => { $('#endOverlay').hidden = true; ($('#endOverlay').dataset.place === 'farm' ? openFarm : openHouse)(); });
$('#btnEndHome').addEventListener('click', goHome);
$('#cheer').addEventListener('click', () => { audio(); if ($('#cheer').dataset.say) speak($('#cheer').dataset.say); });

loadFamily(); // rodina a kamarádi aktivního hráče (app/player.js)
applyLetters(save.letters, save.cursive); // písmena, slabiky a slova podle toho, co rodič zapnul
if (season() === 'winter' || season() === 'xmas') document.body.classList.add('winter');
iconizeButtons();
applyName();
renderVersion();
if (save.obsidian === null || save.obsidian === undefined) save.obsidian = save.streak.days.length; // obsidián i za dny odehrané před portálem
if (!save.babies) initBabies();
if (!save.cards) { save.cards = []; checkCards(true); } // kartičky za už zvládnutá slova
if (!save.village) { save.village = {}; checkVillage(true); } // vesnice začíná podle toho, co už Adam umí
if (!save.gear) save.gear = { held: 'pick', stages: {} };
if (updateTools(save.stats, save.gear.stages).length) persist(); // materiály nástrojů podle už zvládnutých úkolů (bez hlášení)
checkEnchants(); // očarování za už zvládnuté úkoly
checkVersion(); // nová verze na serveru? (při startu a při návratu do hry)
initProfiles();
initDevice();
initPush(); // text ranního upozornění podle hráče (service worker ho zobrazí se zavřenou hrou)
persistStorage(); // prohlížeč pak uložený postup sám nesmaže (app/device.js)
initShare(); // Poslat obrázek u domu, farmy, Přerova a Netheru
updateStages(); persist(); // stupně obtížnosti ze zvládnutých úloh (u staršího postupu poprvé, bez oznámení)
moveIn().then(m => { if (!m) moveOut(); }); // přestěhování z GitHub Pages na schoolcraft.games (app/move.js)
flushSync(); syncCloud(true); // co čeká na odeslání do tabulky Google a na server Schoolcraft (třeba z doby bez internetu)
addEventListener('online', () => flushSync());
document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseRound(true); flushRate(); syncCloud(true); } else { checkVersion(); flushSync(); } }); // odchod z aplikace = pauza
paintTextures();
renderHome();
// otočení tabletu: pozdrav a úkol se přesunou mezi nebe a dlaždice (ui/screens.js)
let wasWide = matchMedia('(min-width: 700px)').matches;
addEventListener('resize', () => { const w = matchMedia('(min-width: 700px)').matches; if (w !== wasWide && !$('#home').hidden) renderHome(); wasWide = w; });
initSetup(); initQrUi(); initHunt(); initAbout();
// QR kód hráče naskenovaný fotoaparátem telefonu otevře hru s #kod=…: nové zařízení stáhne hráče, jinak přes zámek pro rodiče
const qrCode = codeFromText(location.hash);
if (qrCode) history.replaceState(null, '', location.pathname + location.search);
if (needsSetup()) openSetup(profile.id !== MAIN_ID ? profile.name : ''); // nová hra: kdo hraje
if (qrCode) { if (needsSetup()) askCodeRestore(qrCode); else openGateForCode(qrCode); }
initDay(); // ranní karta při prvním otevření dne
// zkratka z ikony aplikace (manifest shortcuts): karta dnešního úkolu (tlačítko na ní spustí patro) nebo procvičování
{ const go = shortcutTarget(location.search); if (go && !needsSetup()) { history.replaceState(null, '', location.pathname); if (go === 'quest') openDay(); else if (practiceReady()) startRound('practice'); } }
// ikona na ploše a hraní bez internetu
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
// pro automatické testy: přístup k běžícímu kolu a uloženému stavu
window.__adam = { get R() { return G.R; }, get TR() { return G.TR; }, get save() { return save; } };

