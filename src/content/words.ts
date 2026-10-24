import { MORE_NAMES } from './alphabet';
// Slova z prvních písmen (samohlásky, M, L, S). Další slova jsou v content/alphabet.ts; WORDS se po spuštění přepočítá
// podle zapnutých písmen (logic/letters.ts applyLetters).
export const BASE_WORDS: string[] = ['MÁMA', 'EMA', 'ELA', 'EMIL', 'LEO', 'OSA', 'OSY', 'OSEL', 'LES', 'LOS', 'ÚL', 'ÚLY', 'MASO', 'MÍSA', 'MÍSY', 'SÍLA', 'SŮL', 'SUM', 'SUMA', 'LAMA', 'LAMY', 'MALÝ', 'MALÁ', 'MALÉ', 'SÁM', 'SAMA', 'SLÁMA', 'ALE', 'MÁ', 'MÉ', 'MÍLE', 'OSLÍ'];
export const WORDS: string[] = [...BASE_WORDS];
// jména se píšou s velkým písmenem i v malém písmu
export const NAMES: string[] = ['EMA', 'ELA', 'EMIL', 'LEO', ...MORE_NAMES];
