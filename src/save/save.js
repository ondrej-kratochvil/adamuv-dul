// Uložený postup
const KEY = 'adamuv-dul-v1';
function defaults() { return { caseMode: 'both', slow: false, strict: 'normal', total: 0, rounds: { letters: 0, syllables: 0, words: 0, numbers: 0, math: 0, writing: 0, reading: 0 }, stats: {}, log: [], ench: [], emeralds: 0, notes: [], dogName: '', gifts: {}, bday: 0, lastCheer: '', village: null, obsidian: null, netherMine: false, cards: null, weeks: null, babies: null, eyes: 0, dragon: 0, seenVersion: 0, gameName: 'Adamův důl', dog: { collar: 'cerveny', owned: ['cerveny'], coat: 'bily' }, decor: [], streak: { count: 0, best: 0, last: '', totem: 0, days: [] }, outfit: { shirt: 'oranzove', pants: 'modre', shoes: 'sede', hat: 'nic', enchant: 'ne' } }; }
function load() {
  try { const s = JSON.parse(localStorage.getItem(KEY)); if (s) { const d = defaults(); return Object.assign(d, s, { rounds: Object.assign(d.rounds, s.rounds || {}), outfit: Object.assign(d.outfit, s.outfit || {}), dog: Object.assign(d.dog, s.dog || {}), gifts: Object.assign(d.gifts, s.gifts || {}), streak: Object.assign(d.streak, s.streak || {}) }); } } catch (e) {}
  return defaults();
}
const save = load();
function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }

// nahradí celý obsah uloženého stavu (save zůstává stejný objekt, ostatní moduly na něj drží odkaz)
function replaceSave(next) { for (const k of Object.keys(save)) delete save[k]; Object.assign(save, next); }

export { replaceSave, KEY, defaults, load, persist, save };
