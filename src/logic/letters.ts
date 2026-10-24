// Písmena zapnutá rodičem (Schoolcraft): podle nich se skládají písmena, slabiky, slova, obrázky a psaní.
// Pole v content/* se mění na místě, takže moduly, které si je importovaly, vidí vždy aktuální obsah.
import { BASE_CONS, CONS_ORDER, E_CARON, HARD, MORE_WORDS, NO_SYLL, SOFT } from '../content/alphabet';
import { CONS, LETTERS, SYLL, SYL_V, VOWELS } from '../content/letters';
import { BASE_WORDS, WORDS } from '../content/words';
import { PIC, PLURAL, PIC_WORDS } from '../content/pictures';
import { CURSIVE_ORDER, SHAPE_NAMES, WRITING_ITEMS } from '../content/glyphs';

const VOWEL_LETTERS = ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý'];

// písmena ve slově (CH je jedno písmeno)
export function lettersOf(w: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < w.length; i++) {
    if (w[i] === 'C' && w[i + 1] === 'H') { out.push('CH'); i++; } else out.push(w[i]);
  }
  return out;
}
// slovo jde přečíst, když zná všechna jeho písmena (samohlásky zná vždy)
export const wordFits = (w: string, known: Set<string>): boolean => lettersOf(w).every(ch => VOWELS.has(ch) || known.has(ch));

// platný výběr: jen známá písmena, v pořadí slabikáře; prázdný = výchozí M, L, S
export function normalizeLetters(x: unknown): string[] {
  const set = new Set(Array.isArray(x) ? x.filter(c => typeof c === 'string') : []);
  const out = CONS_ORDER.filter(c => set.has(c));
  return out.length ? out : [...BASE_CONS];
}

// slabiky ze zapnutých souhlásek: MA, MÁ, ME… (po měkkých bez y, po tvrdých bez i, Ě jen po b p v m d t n)
export function syllablesFor(cons: string[]): string[] {
  const eCaron = cons.includes('Ě');
  return cons.filter(c => !NO_SYLL.has(c)).flatMap(c => [
    ...SYL_V.filter(v => !(SOFT.has(c) && /[YÝ]/.test(v)) && !(HARD.has(c) && /[IÍ]/.test(v))).map(v => c + v),
    ...(eCaron && E_CARON.has(c) ? [c + 'Ě'] : []),
  ]);
}

const fill = (arr: string[], items: string[]) => { arr.splice(0, arr.length, ...items); };
// přepočítá obsah hry podle zapnutých písmen
// psací písmena (Písanka II): samohlásky vždy, souhlásky l, t, p, m, n, j jen zapnuté
export const cursiveFor = (cons: string[]): string[] => CURSIVE_ORDER.filter(c => 'eiuůao'.includes(c) || cons.includes(c.toUpperCase())).map(c => 'c-' + c);
export function applyLetters(enabled: string[], cursive = false): void {
  const cons = normalizeLetters(enabled), known = new Set(cons);
  fill(CONS, cons.filter(c => c !== 'Ě'));
  fill(LETTERS, [...VOWEL_LETTERS, ...(known.has('Ě') ? ['Ě'] : []), ...CONS]);
  fill(SYLL, syllablesFor(cons));
  fill(WORDS, [...new Set([...BASE_WORDS, ...MORE_WORDS])].filter(w => wordFits(w, known)));
  fill(PIC_WORDS, [...Object.keys(PIC), ...Object.keys(PLURAL)].filter(w => wordFits(w, known)));
  // psaní: tiskací písmena bez čárek (Á se píše jako A), CH se obtahuje jako C a H
  const write = ['A', 'E', 'I', 'O', 'U', 'Y', ...cons.filter(c => c !== 'CH')];
  fill(WRITING_ITEMS, [...'0123456789', ...write, ...(cursive ? cursiveFor(cons) : []), ...Object.keys(SHAPE_NAMES)]);
}
