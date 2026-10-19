// Zvuky
let ac = null;
function audio() { if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {} } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
function noiseHit(dur, freq, vol) {
  const a = audio(); if (!a) return;
  const n = a.createBuffer(1, a.sampleRate * dur, a.sampleRate), d = n.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 2);
  const s = a.createBufferSource(); s.buffer = n;
  const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
  const gn = a.createGain(); gn.gain.value = vol;
  s.connect(f).connect(gn).connect(a.destination); s.start();
}
function tone(freq, t0, dur, type = 'square', vol = .07) {
  const a = audio(); if (!a) return;
  const o = a.createOscillator(), gn = a.createGain(); o.type = type; o.frequency.value = freq;
  const t = a.currentTime + t0; gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(gn).connect(a.destination); o.start(t); o.stop(t + dur + .02);
}
const sfx = {
  dig: () => noiseHit(.09, 1400, .5),
  breakIt: () => { noiseHit(.22, 2400, .6); tone(660, .02, .08, 'square', .05); tone(990, .09, .12, 'square', .05); },
  nope: () => { tone(196, 0, .14, 'triangle', .14); tone(147, .12, .2, 'triangle', .14); },
  fanfare: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * .12, .22, 'square', .06)),
  sparkle: () => [1318, 1568, 2093, 2637].forEach((f, i) => tone(f, .55 + i * .07, .15, 'triangle', .07)),
};

export { ac, audio, noiseHit, sfx, tone };
