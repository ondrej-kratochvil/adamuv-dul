// Řeč: přirozený hlas Google přes server (logic/tts.ts, worker /api/tts), jinak hlas tabletu (speechSynthesis).
// Přirozený hlas si hra ukládá do mezipaměti prohlížeče, takže už slyšené věty jdou i bez internetu a hned.
// logic/tts.ts jako první: ui/settings.js (kruhový import) volá updateVoiceInfo už při načtení tohoto modulu
import { TTS_DEVICE, gameText, ttsChoice, ttsKey, ttsRate } from '../logic/tts.ts';
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { save } from '../save/save.ts';
import { updateHint } from '../ui/hint.js';
import { updateVoiceInfo } from '../ui/settings.js';
import { audio } from './sfx.js';

const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
let csVoice = null, voicesKnown = false;
function loadVoices() {
  if (!synth) return;
  const vs = synth.getVoices();
  if (vs.length) voicesKnown = true;
  const cs = vs.filter(v => /^cs([-_]|$)/i.test(v.lang));
  // přednost má hlas uložený v tabletu (funguje i bez internetu), pak Google nebo Zuzana
  csVoice = cs.find(v => v.localService && /google|zuzana/i.test(v.name)) || cs.find(v => /zuzana|google/i.test(v.name)) || cs.find(v => v.localService) || cs[0] || null;
  updateVoiceInfo(); updateHint();
}

// --- přirozený hlas ---
const TTS_URL = (location.hostname === 'schoolcraft.games' ? '' : 'https://schoolcraft.games') + '/api/tts';
const CACHE = 'schoolcraft-hlas-1';
const COOLDOWN_MS = 30000;   // po chybě (výpadek sítě) chvíli hlas tabletu, pak zkusit znovu
const CAP_MS = 10 * 60000;   // server je přes strop znaků nebo limit (429): nové věty chvíli čte tablet
const FETCH_MS = 4000;       // déle se na větu nečeká, radši ji řekne tablet
let cloudOffUntil = 0, cloudMissing = false; // cloudMissing: server nemá klíč (503), v tomto spuštění už se neptat
const urls = new Map();      // věta → adresa zvuku v paměti (blob:), záloha bez Web Audio
const bufs = new Map();      // věta → rozbalený zvuk pro Web Audio
let source = null;           // právě hraná věta (Web Audio)
// Přirozený hlas hraje přes Web Audio jako zvuky hry (audio/sfx.js): na iPhonu stačí jednou při klepnutí rozjet
// AudioContext a pak hraje i věty, které přijdou až po stažení. Přes <audio> Safari na iPhonu vynechávalo
// každou druhou větu (Ondřej 10. 11. 2026, patro Slova). <audio> zůstává jako záloha.
// Tlačítko ztlumení na iPhonu by Web Audio umlčelo: audioSession „playback“ (iOS 17+) hraje jako přehrávač hudby.
try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* starší iOS */ }

// záznam posledních vět (nastavení, karta Hlas): jak se věta přehrála, nebo proč ne
const LOG_MAX = 40, voiceLog = [];
let ctxRef = null;
const ctxState = () => (ctxRef ? ctxRef.state : 'bez Web Audio');
function logVoice(text, how) {
  const d = new Date(), t = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  voiceLog.push(`${t} ${how} [${ctxState()}]: ${String(text).slice(0, 40)}`);
  if (voiceLog.length > LOG_MAX) voiceLog.shift();
}
const refused = new Set();   // věty, které server odmítl (422: není ze hry)
let player = null;
// iPhone a iPad pustí zvuk bez klepnutí (přirozený hlas přijde až po stažení věty), jen když se přehrávač
// i hlas zařízení jednou rozjely při klepnutí. Safari bere jako klepnutí touchend a click, ne pointerdown
// (verze 84: přehrávač zůstal zamčený, hra na iPhonu občas mlčela, Honza 10. 11. 2026). Zkouší se, dokud se nepovede.
const UNLOCK_EVENTS = ['touchend', 'click', 'keydown'];
let mediaUnlocked = false, synthUnlocked = false;
// 0,1 s ticha jako WAV (přes blob:, CSP ve vite.config.js data: pro zvuk nepouští)
function silence() {
  const n = 800, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o, s) => [...s].forEach((c, i) => { b[o + i] = c.charCodeAt(0); });
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true);
  b.fill(128, 44);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
function unlock() {
  try { ctxRef = audio(); } catch (e) { /* nic */ } // klepnutí rozjede AudioContext (resume)
  if (synth && !synthUnlocked) { synthUnlocked = true; try { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; synth.speak(u); } catch (e) { /* nic */ } }
  if (!mediaUnlocked && !(player && !player.paused && !player.ended)) {
    try {
      if (!player) player = new Audio();
      player.onended = player.onerror = player.onloadedmetadata = null;
      player.src = silence();
      const p = player.play();
      if (p && p.then) p.then(() => { mediaUnlocked = true; }, () => {}); else mediaUnlocked = true;
    } catch (e) { /* nic */ }
  }
  if (mediaUnlocked && synthUnlocked && ctxRef && ctxRef.state === 'running') UNLOCK_EVENTS.forEach(ev => document.removeEventListener(ev, unlock, true));
}
UNLOCK_EVENTS.forEach(ev => document.addEventListener(ev, unlock, true));

const cloudWanted = () => ttsChoice(save.tts) !== TTS_DEVICE;
const cloudNet = () => !cloudMissing && Date.now() >= cloudOffUntil && navigator.onLine !== false;
const query = text => ({ text: String(text).replace(/\s+/g, ' ').trim(), voice: ttsChoice(save.tts), slow: !!save.slow });
const cacheReq = q => new Request(TTS_URL.replace(/^\//, location.origin + '/') + '?k=' + encodeURIComponent(ttsKey({ text: q.text, voice: q.voice, rate: ttsRate(q.slow) })));

async function fromCache(q) {
  try { if (!('caches' in window)) return null; const c = await caches.open(CACHE); const r = await c.match(cacheReq(q)); return r ? await r.blob() : null; } catch (e) { return null; }
}
// net: smí se ptát serveru; bez toho jen věty už uložené v tabletu
async function cloudData(q, net) {
  let blob = await fromCache(q);
  if (!blob) {
    if (!net) throw new Error('offline');
    const ac = new AbortController(), t = setTimeout(() => ac.abort(), FETCH_MS);
    try {
      const r = await fetch(TTS_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(q), signal: ac.signal });
      if (r.status === 503) cloudMissing = true;
      if (r.status === 422) refused.add(q.text);
      if (r.status === 429) cloudOffUntil = Date.now() + CAP_MS;
      if (!r.ok) throw new Error('tts ' + r.status);
      blob = await r.blob();
    } finally { clearTimeout(t); }
    try { if ('caches' in window) { const c = await caches.open(CACHE); await c.put(cacheReq(q), new Response(blob, { headers: { 'Content-Type': 'audio/mpeg' } })); } } catch (e) { /* plné úložiště: nevadí */ }
  }
  return blob;
}
const keyOf = q => ttsKey({ text: q.text, voice: q.voice, rate: ttsRate(q.slow) });
// zvuk pro Web Audio (null = prohlížeč ho neumí rozbalit, hraje se přes <audio>)
async function cloudBuffer(q, net, a) {
  const k = keyOf(q);
  if (bufs.has(k)) return bufs.get(k);
  const blob = await cloudData(q, net);
  let buf = null;
  try { buf = await a.decodeAudioData(await blob.arrayBuffer()); } catch (e) { buf = null; }
  if (buf) { if (bufs.size > 300) bufs.delete(bufs.keys().next().value); bufs.set(k, buf); }
  else urlFor(k, blob);
  return buf;
}
async function cloudBlob(q, net) {
  const k = keyOf(q);
  if (urls.has(k)) return urls.get(k);
  return urlFor(k, await cloudData(q, net));
}
function urlFor(k, blob) {
  const url = URL.createObjectURL(blob);
  if (urls.size > 300) { const [old, u] = urls.entries().next().value; URL.revokeObjectURL(u); urls.delete(old); }
  urls.set(k, url);
  return url;
}

function stopSpeech() {
  if (synth) synth.cancel();
  if (source) { const s0 = source; source = null; s0.onended = null; try { s0.stop(); } catch (e) { /* už skončila */ } }
  if (player) { try { player.pause(); } catch (e) { /* nic */ } }
}
const isSpeaking = () => !!(source || (synth && synth.speaking) || (player && !player.paused && !player.ended));
const noVoice = () => !(cloudWanted() && cloudNet()) && (!synth || (voicesKnown && !csVoice));
const cloudVoiceOn = () => cloudWanted() && !cloudMissing;

function deviceSpeak(text, id, fin) {
  if (!synth) { logVoice(text, 'bez hlasu'); setTimeout(fin, 500); return; }
  logVoice(text, 'hlas zařízení');
  // zrušit jen to, co opravdu mluví: hned po cancel() Safari a některé tablety další větu spolknou (verze 83, Honza 9. 11. 2026)
  if (synth.speaking || synth.pending) synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  // hlasy se v tabletu načítají se zpožděním; bez českého hlasu by tablet četl anglicky ("me" jako "mí")
  if (!csVoice) loadVoices();
  u.lang = 'cs-CZ'; if (csVoice) { u.voice = csVoice; u.lang = csVoice.lang.replace('_', '-'); }
  u.rate = save.slow ? 0.62 : 0.85; u.pitch = 1.05;
  u.onend = fin; u.onerror = fin;
  synth.speak(u);
  setTimeout(fin, 1600 + text.length * 140);
}

function speak(text, onend) {
  const id = ++G.speechId;
  const fin = () => { if (id !== G.speechId) return; G.speechId++; $('#btnListen').classList.remove('talking'); onend && onend(); };
  stopSpeech();
  setTimeout(() => {
    if (id !== G.speechId) return;
    $('#btnListen').classList.add('talking');
    const q = query(text);
    // přirozený hlas jen pro věty ze hry (logic/tts.ts gameText); bez sítě nebo po chybě jen věty už uložené v tabletu
    if (!cloudWanted() || !q.text || !gameText(q.text) || refused.has(q.text)) { deviceSpeak(text, id, fin); return; }
    const net = cloudNet();
    if (!net && cloudMissing) { deviceSpeak(text, id, fin); return; }
    setTimeout(fin, FETCH_MS + 3000 + text.length * 200); // pojistka, kdyby zvuk neskončil
    const fallback = why => { logVoice(text, 'chyba ' + why); if (id === G.speechId) deviceSpeak(text, id, fin); };
    const failed = e => { if (net && !cloudMissing && !refused.has(q.text) && Date.now() >= cloudOffUntil) cloudOffUntil = Date.now() + COOLDOWN_MS; fallback(String(e && e.message || e).slice(0, 30)); };
    // Web Audio, když běží (rozjel ho dotyk); jinak <audio>
    let a = null; try { a = audio(); ctxRef = a; } catch (e) { a = null; }
    if (a && a.state === 'running') {
      cloudBuffer(q, net, a).then(buf => {
        if (id !== G.speechId) return;
        if (!buf) { playElement(q, net, id, fin, fallback, failed); return; }
        const s1 = a.createBufferSource(); s1.buffer = buf; s1.connect(a.destination);
        s1.onended = () => { if (source === s1) source = null; fin(); };
        stopSpeech(); source = s1; s1.start();
        logVoice(text, 'přirozený (Web Audio)');
      }).catch(failed);
      return;
    }
    playElement(q, net, id, fin, fallback, failed);
  }, 60);
}

// záloha přes <audio> (prohlížeč bez Web Audio nebo AudioContext ještě nerozjetý)
function playElement(q, net, id, fin, fallback, failed) {
  cloudBlob(q, net).then(url => {
    if (id !== G.speechId) return;
    if (!player) player = new Audio();
    player.onended = fin; player.onerror = () => { cloudOffUntil = Date.now() + COOLDOWN_MS; fallback('zvuk'); };
    player.onloadedmetadata = () => { if (isFinite(player.duration)) setTimeout(fin, player.duration * 1000 + 1500); };
    player.src = url;
    // přehrání může prohlížeč odmítnout (zvuk bez klepnutí): pak řekne větu tablet
    player.play().then(() => { mediaUnlocked = true; logVoice(q.text, 'přirozený (audio)'); }, e => fallback(e && e.name || 'play'));
  }).catch(failed);
}
const voiceLogText = () => voiceLog.join('\n') || 'Zatím nic.';

// až na konci: loadVoices volá updateVoiceInfo a updateHint, které potřebují funkce a proměnné výše
if (synth) { loadVoices(); synth.addEventListener ? synth.addEventListener('voiceschanged', loadVoices) : (synth.onvoiceschanged = loadVoices); }

export { cloudVoiceOn, csVoice, isSpeaking, loadVoices, noVoice, speak, stopSpeech, synth, voiceLogText, voicesKnown };
