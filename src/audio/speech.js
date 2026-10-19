// Řeč
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
if (synth) { loadVoices(); synth.addEventListener ? synth.addEventListener('voiceschanged', loadVoices) : (synth.onvoiceschanged = loadVoices); }
const noVoice = () => !synth || (voicesKnown && !csVoice);
function speak(text, onend) {
  const id = ++G.speechId;
  const fin = () => { if (id !== G.speechId) return; G.speechId++; $('#btnListen').classList.remove('talking'); onend && onend(); };
  if (!synth) { setTimeout(fin, 500); return; }
  synth.cancel();
  setTimeout(() => {
    if (id !== G.speechId) return;
    const u = new SpeechSynthesisUtterance(text);
    // hlasy se v tabletu načítají se zpožděním; bez českého hlasu by tablet četl anglicky ("me" jako "mí")
    if (!csVoice) loadVoices();
    u.lang = 'cs-CZ'; if (csVoice) { u.voice = csVoice; u.lang = csVoice.lang.replace('_', '-'); }
    u.rate = save.slow ? 0.62 : 0.85; u.pitch = 1.05;
    u.onend = fin; u.onerror = fin;
    $('#btnListen').classList.add('talking');
    synth.speak(u);
    setTimeout(fin, 1600 + text.length * 140);
  }, 60);
}

export { csVoice, loadVoices, noVoice, speak, synth, voicesKnown };
