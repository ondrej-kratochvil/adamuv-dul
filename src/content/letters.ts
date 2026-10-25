// Obsah: písmena a slabiky. Pole se po spuštění přepočítají podle písmen zapnutých rodičem (logic/letters.ts applyLetters);
// výchozí obsah je to, co uměl Adam do verze 51 (samohlásky, M, L, S).
import { CONS_SAY } from './alphabet';
export const LETTERS: string[] = ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý', 'M', 'L', 'S'];
export const VOWELS: Set<string> = new Set(['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý']);
// samotné á, é, ů… čte český hlas sám jako „dlouhé á“, „ů s kroužkem“; slovo navíc by se zdvojilo
export const SAY_LETTER: Record<string, string> = { A: 'a', Á: 'á', E: 'e', É: 'é', I: 'i', Í: 'í', O: 'o', Ó: 'ó', U: 'u', Ú: 'ú', Ů: 'ů', Y: 'ypsilon', Ý: 'dlouhé ypsilon', ...CONS_SAY };
export const PARTNER: Record<string, string> = { A: 'Á', Á: 'A', E: 'É', É: 'E', I: 'Í', Í: 'I', O: 'Ó', Ó: 'O', U: 'Ú', Ú: 'U', Ů: 'U', Y: 'Ý', Ý: 'Y' };
export const SAME_SOUND: Record<string, string> = { Y: 'I', Ý: 'Í', Ů: 'Ú' };
export const CONS: string[] = ['M', 'L', 'S'];
// samohlásky ve slabikách: Ó a Ů (MÓ, MŮ) od review 25. 10. 2026; Ú po souhlásce ne, píše se jen na začátku slova (uvnitř je ů)
export const SYL_V: string[] = ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ů', 'Y', 'Ý'];
export const SYLL: string[] = CONS.flatMap(c => SYL_V.map(v => c + v));
// slabika ze dvou částí: souhláska (i CH) a samohláska
export const sylC = (s: string): string => s.startsWith('CH') ? 'CH' : s[0];
export const sylV = (s: string): string => s.slice(sylC(s).length);
export const vFam = (v: string): string | undefined => ({ I: 'i', Í: 'i', Y: 'y', Ý: 'y' } as Record<string, string>)[v];

