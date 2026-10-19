// Patra a společné pomůcky úkolů (logika v logic/tasks.ts)
import { save } from '../save/save.ts';
import { LETTERS, SYLL } from '../content/letters.ts';
import { NAMES } from '../content/words.ts';
import { PIC, PIC_WORDS, PLURAL } from '../content/pictures.ts';
import { genMath, genNumbers } from './math.js';
import { genWriting } from './writing.js';
import { ctx } from '../game/ctx.js';
import * as T from '../logic/tasks.ts';
import { choiceCount as choiceCountL, weight as weightL } from '../logic/mastery.ts';
import { shuffle } from '../logic/random.ts';

function picCanvas(word) {
  const one = document.createElement('canvas'); one.width = one.height = 16;
  const g1 = one.getContext('2d'); PIC[PLURAL[word] || word]((x, y, w, h, c) => { g1.fillStyle = c; g1.fillRect(x, y, w, h); });
  const c = document.createElement('canvas'); c.width = c.height = 32; c.className = 'pic px';
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  if (PLURAL[word]) { g.drawImage(one, 0, 15); g.drawImage(one, 16, 15); g.drawImage(one, 8, 1); }
  else g.drawImage(one, 0, 0, 32, 32);
  return c;
}
function genWords() { return T.genWords(ctx()); }
// slovo na ceduli se ukazuje velkým nebo malým písmem podle nastavení
function genReading() { const t = T.genReading(ctx()); return { ...t, task: display(t.answer) }; }

const LEVELS = {
  letters: { name: 'Písmena', tex: 'dirt', items: LETTERS, sample: ['A', 'm'], intro: 'Poslouchej a kopej do správného písmenka.' },
  syllables: { name: 'Slabiky', tex: 'stone', items: SYLL, sample: ['MA', 'lo'], small: true, intro: 'Poslouchej a kopej do správné slabiky.' },
  words: { name: 'Slova', tex: 'ironOre', gen: genWords, sample: ['MÁMA'], small: true, intro: 'Poslouchej slovo a kopej do správné kostky.' },
  reading: { name: 'Čtení', tex: 'diamondOre', gen: genReading, picture: true, sample: ['OSA'], small: true, intro: 'Přečti slovo na ceduli a kopni do správného obrázku.' },
  numbers: { name: 'Čísla', tex: 'goldOre', gen: genNumbers, sample: ['3', '7'], intro: 'Poslouchej číslo a kopej do správné kostky.' },
  math: { name: 'Počty', tex: 'lapisOre', gen: genMath, sample: ['2+3'], small: true, intro: 'Spočítej příklad a kopej do správného výsledku.' },
  writing: { name: 'Psaní', tex: 'redstoneOre', trace: genWriting, len: 5, sample: ['1 A'], intro: 'Jeď prstem po dráze a nevyjeď z ní. Začni u zelené tečky a jeď po šipce.' },
};
const inCzech = (_kind, w) => T.pronounce(w, save.pron || {}); // dřív „Slovo w.“, teď jen výslovnost
function sayText(level, it) { return T.sayText(level, it, save.pron || {}); }
const conflict = T.conflict, partnerOf = T.partnerOf, similar = T.similar;
function weight(level, it) { return weightL(save.stats, level, it); }
function pickTarget(level, avoid) { return T.pickTarget(level, { ...ctx(), recent: avoid }); }
function choiceCount(level) { return choiceCountL(save.rounds[level] || 0); }
function makeChoices(level, target) { return T.makeChoices(level, target, ctx()); }
function display(it) {
  const m = save.caseMode;
  const lower = m === 'lower' || (m === 'both' && Math.random() < .5);
  if (!lower) return it;
  const low = it.toLocaleLowerCase('cs');
  return NAMES.includes(it) ? it[0] + low.slice(1) : low; // jména s velkým písmenem
}

export { LEVELS, PIC, PIC_WORDS, PLURAL, choiceCount, conflict, display, genReading, genWords, inCzech, makeChoices, partnerOf, picCanvas, pickTarget, sayText, shuffle, similar, weight };
