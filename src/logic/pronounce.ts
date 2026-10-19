// Výslovnost slabik a slov pro hlas tabletu.
// Problém (Ondřej, 19. 10. 2026): hlas v tabletu čte krátké slabiky jako anglická slova („so“ jako „sou“),
// i když je nastavená čeština. Věty typu „Slabika so.“ nepomohly, proto pryč.
// Řešení: u rizikových slabik se po slabice řeknou i písmena („so, es, o“). Rodič v nastavení může u každé
// slabiky poslechnout varianty a vybrat tu, která na jeho tabletu zní česky.
import { SAY_LETTER } from '../content/letters';

export type PronMode = 'plain' | 'split' | 'letters';
export const PRON_MODES: PronMode[] = ['plain', 'split', 'letters'];

// slabiky bez čárky, které anglický hlas čte jako anglická slova nebo jinak (me = mí, so = sou, my = maj…)
export const RISKY_SYLLABLES = ['ME', 'MI', 'MO', 'MU', 'MY', 'LE', 'LI', 'LO', 'LY', 'SE', 'SI', 'SO', 'SU', 'SY'];
// slova, u kterých stojí za to výslovnost vyzkoušet (výchozí je obyčejně)
export const RISKY_WORDS = ['SUM', 'ALE', 'LES', 'LEO', 'LOS', 'EMIL'];

const SOFT_HYPHEN = '­'; // neviditelné dělítko: rozbije „anglické slovo“, výslovnost by měla zůstat celistvá

export function pronounceAs(item: string, mode: PronMode): string {
  const low = item.toLocaleLowerCase('cs');
  if (mode === 'split') return [...low].join(SOFT_HYPHEN);
  if (mode === 'letters') return `${low}, ${[...item].map(ch => SAY_LETTER[ch] || ch.toLocaleLowerCase('cs')).join(', ')}`;
  return low;
}

// Ondřej vyzkoušel na svém mobilu s Androidem (19. 10. 2026): „s písmeny“ jen u so a me, ostatní „obyčejně“; Adamův tablet (Android) čeká stejné chování
export const LETTERS_BY_DEFAULT = ['SO', 'ME'];
export const defaultMode = (item: string): PronMode => LETTERS_BY_DEFAULT.includes(item) ? 'letters' : 'plain';

// text pro hlas; volba rodiče (overrides) má přednost
export function pronounce(item: string, overrides: Record<string, string> = {}): string {
  const m = overrides[item];
  return pronounceAs(item, (PRON_MODES as string[]).includes(m) ? m as PronMode : defaultMode(item));
}
