// Obsah: písmena a slabiky
export const LETTERS: string[] = ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý', 'M', 'L', 'S'];
export const VOWELS: Set<string> = new Set(['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý']);
// samotné á, é, ů… čte český hlas sám jako „dlouhé á“, „ů s kroužkem“; slovo navíc by se zdvojilo
export const SAY_LETTER: Record<string, string> = { A: 'a', Á: 'á', E: 'e', É: 'é', I: 'i', Í: 'í', O: 'o', Ó: 'ó', U: 'u', Ú: 'ú', Ů: 'ů', Y: 'ypsilon', Ý: 'dlouhé ypsilon', M: 'em', L: 'el', S: 'es' };
export const PARTNER: Record<string, string> = { A: 'Á', Á: 'A', E: 'É', É: 'E', I: 'Í', Í: 'I', O: 'Ó', Ó: 'O', U: 'Ú', Ú: 'U', Ů: 'U', Y: 'Ý', Ý: 'Y' };
export const SAME_SOUND: Record<string, string> = { Y: 'I', Ý: 'Í', Ů: 'Ú' };
export const CONS: string[] = ['M', 'L', 'S'];
export const SYL_V: string[] = ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'U', 'Y', 'Ý'];
export const SYLL: string[] = CONS.flatMap(c => SYL_V.map(v => c + v));
export const vFam = (v: string): string | undefined => ({ I: 'i', Í: 'i', Y: 'y', Ý: 'y' } as Record<string, string>)[v];

