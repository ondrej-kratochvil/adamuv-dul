// Řeč: přirozený hlas Google přes server (logic/tts.ts, worker /api/tts), jinak hlas tabletu (speechSynthesis).
// Přirozený hlas si hra ukládá do mezipaměti prohlížeče, takže už slyšené věty jdou i bez internetu a hned.
// logic/tts.ts jako první: ui/settings.js (kruhový import) volá updateVoiceInfo už při načtení tohoto modulu
import { TTS_DEVICE, gameText, ttsChoice, ttsKey, ttsRate } from '../logic/tts.ts';
import { G } from '../core/state.js';
import { $ } from '../core/dom.js';
import { save } from '../save/save.ts';
import { updateHint } from '../ui/hint.js';
import { updateVoiceInfo } from '../ui/settings.js';

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
const urls = new Map();      // věta → adresa zvuku v paměti (blob:)
const refused = new Set();   // věty, které server odmítl (422: není ze hry)
let player = null;
// iPhone a iPad pustí zvuk bez klepnutí, jen když se přehrávač jednou rozjel při klepnutí (krátké ticho)
// (přes blob:, CSP ve vite.config.js data: pro zvuk nepouští)
const SILENCE = 'UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
function unlock() {
  document.removeEventListener('pointerdown', unlock, true);
  if (!cloudWanted() || player) return;
  try { player = new Audio(); player.src = URL.createObjectURL(new Blob([Uint8Array.from(atob(SILENCE), c => c.charCodeAt(0))], { type: 'audio/wav' })); const p = player.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* nic */ }
}
document.addEventListener('pointerdown', unlock, true);

const cloudWanted = () => ttsChoice(save.tts) !== TTS_DEVICE;
const cloudNet = () => !cloudMissing && Date.now() >= cloudOffUntil && navigator.onLine !== false;
const query = text => ({ text: String(text).replace(/\s+/g, ' ').trim(), voice: ttsChoice(save.tts), slow: !!save.slow });
const cacheReq = q => new Request(TTS_URL.replace(/^\//, location.origin + '/') + '?k=' + encodeURIComponent(ttsKey({ text: q.text, voice: q.voice, rate: ttsRate(q.slow) })));

async function fromCache(q) {
  try { if (!('caches' in window)) return null; const c = await caches.open(CACHE); const r = await c.match(cacheReq(q)); return r ? await r.blob() : null; } catch (e) { return null; }
}
// net: smí se ptát serveru; bez toho jen věty už uložené v tabletu
async function cloudBlob(q, net) {
  const k = ttsKey({ text: q.text, voice: q.voice, rate: ttsRate(q.slow) });
  if (urls.has(k)) return urls.get(k);
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
  const url = URL.createObjectURL(blob);
  if (urls.size > 300) { const [old, u] = urls.entries().next().value; URL.revokeObjectURL(u); urls.delete(old); }
  urls.set(k, url);
  return url;
}

function stopSpeech() {
  if (synth) synth.cancel();
  if (player) { try { player.pause(); } catch (e) { /* nic */ } }
}
const isSpeaking = () => !!((synth && synth.speaking) || (player && !player.paused && !player.ended));
const noVoice = () => !(cloudWanted() && cloudNet()) && (!synth || (voicesKnown && !csVoice));
const cloudVoiceOn = () => cloudWanted() && !cloudMissing;

function deviceSpeak(text, id, fin) {
  if (!synth) { setTimeout(fin, 500); return; }
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
    const fallback = () => { if (id === G.speechId) deviceSpeak(text, id, fin); };
    cloudBlob(q, net).then(url => {
      if (id !== G.speechId) return;
      if (!player) player = new Audio();
      player.onended = fin; player.onerror = () => { cloudOffUntil = Date.now() + COOLDOWN_MS; fallback(); };
      player.onloadedmetadata = () => { if (isFinite(player.duration)) setTimeout(fin, player.duration * 1000 + 1500); };
      player.src = url;
      // přehrání může prohlížeč odmítnout (zvuk bez klepnutí): pak řekne větu tablet
      player.play().catch(fallback);
    }).catch(() => { if (net && !cloudMissing && !refused.has(q.text) && Date.now() >= cloudOffUntil) cloudOffUntil = Date.now() + COOLDOWN_MS; fallback(); });
  }, 60);
}

// až na konci: loadVoices volá updateVoiceInfo a updateHint, které potřebují funkce a proměnné výše
if (synth) { loadVoices(); synth.addEventListener ? synth.addEventListener('voiceschanged', loadVoices) : (synth.onvoiceschanged = loadVoices); }

export { cloudVoiceOn, csVoice, isSpeaking, loadVoices, noVoice, speak, stopSpeech, synth, voicesKnown };
