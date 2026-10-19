// Obsah: písmena a slabiky
const LETTERS = ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý', 'M', 'L', 'S'];
const VOWELS = new Set(['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'Ó', 'U', 'Ú', 'Ů', 'Y', 'Ý']);
// samotné á, é, ů… čte český hlas sám jako „dlouhé á“, „ů s kroužkem“; slovo navíc by se zdvojilo
const SAY_LETTER = { A: 'a', Á: 'á', E: 'e', É: 'é', I: 'i', Í: 'í', O: 'o', Ó: 'ó', U: 'u', Ú: 'ú', Ů: 'ů', Y: 'ypsilon', Ý: 'dlouhé ypsilon', M: 'em', L: 'el', S: 'es' };
const PARTNER = { A: 'Á', Á: 'A', E: 'É', É: 'E', I: 'Í', Í: 'I', O: 'Ó', Ó: 'O', U: 'Ú', Ú: 'U', Ů: 'U', Y: 'Ý', Ý: 'Y' };
const SAME_SOUND = { Y: 'I', Ý: 'Í', Ů: 'Ú' };
const CONS = ['M', 'L', 'S'];
const SYL_V = ['A', 'Á', 'E', 'É', 'I', 'Í', 'O', 'U', 'Y', 'Ý'];
const SYLL = CONS.flatMap(c => SYL_V.map(v => c + v));
const vFam = v => ({ I: 'i', Í: 'i', Y: 'y', Ý: 'y' })[v];

export { CONS, LETTERS, PARTNER, SAME_SOUND, SAY_LETTER, SYLL, SYL_V, VOWELS, vFam };
