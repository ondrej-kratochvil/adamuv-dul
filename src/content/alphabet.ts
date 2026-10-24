// Celá abeceda pro Schoolcraft (Ondřej 24. 10. 2026: „Adam se už učí P… připravit další písmenka dopředu a budeme mu je
// zapínat“). Samohlásky jsou zapnuté vždy, souhlásky a Ě zapíná rodič v nastavení (karta Hra).
// Pořadí podle běžných slabikářů pro 1. třídu (M, L, S, P, T, J, N, V, D…); každá škola jde trochu jinak, proto volba rodiče.
export const CONS_ORDER: string[] = ['M', 'L', 'S', 'P', 'T', 'J', 'N', 'V', 'D', 'Ě', 'Z', 'K', 'R', 'Ř', 'B', 'C', 'Č', 'Š', 'Ž', 'H', 'CH', 'F', 'G', 'Ď', 'Ť', 'Ň', 'X', 'W', 'Q'];
export const BASE_CONS: string[] = ['M', 'L', 'S']; // co uměl Adam do verze 51 (výchozí pro nového hráče)

// jak písmeno čte hlas (samotné „p“ by tablet řekl nesrozumitelně)
export const CONS_SAY: Record<string, string> = {
  M: 'em', L: 'el', S: 'es', P: 'pé', T: 'té', J: 'jé', N: 'en', V: 'vé', D: 'dé', Ě: 'e s háčkem', Z: 'zet', K: 'ká', R: 'er', Ř: 'eř',
  B: 'bé', C: 'cé', Č: 'čé', Š: 'eš', Ž: 'žet', H: 'há', CH: 'chá', F: 'ef', G: 'gé', Ď: 'ďé', Ť: 'ťé', Ň: 'eň', X: 'iks', W: 'dvojité vé', Q: 'kvé',
};

// slabiky: po měkkých souhláskách se nepíše y, po tvrdých (h, ch, k, r) i jen výjimečně; Ě jen po b, p, v, m, d, t, n
export const SOFT = new Set(['J', 'C', 'Č', 'Š', 'Ž', 'Ř', 'Ď', 'Ť', 'Ň']);
export const HARD = new Set(['H', 'CH', 'K', 'R']);
export const E_CARON = new Set(['B', 'P', 'V', 'M', 'D', 'T', 'N']);
export const NO_SYLL = new Set(['Ě', 'W', 'Q', 'X']); // samostatné slabiky z nich ve slabikáři nejsou

// Slova pro patro Slova a kartičky. Hra bere jen ta, která jdou složit ze zapnutých písmen (logic/letters.ts).
export const MORE_WORDS: string[] = [
  // P
  'PES', 'PSI', 'PÁS', 'SUP', 'PUSA', 'PILA', 'LÍPA', 'LUPA', 'MAPA', 'POLE', 'PLES', 'POPEL', 'PÍSMO', 'SLEPÝ', 'PEPA',
  // T
  'TÁTA', 'TETA', 'AUTO', 'TOPOL', 'STŮL', 'LÉTO', 'MOST', 'MÍSTO', 'SÍTO', 'TELE', 'PATA', 'TAM', 'TOM',
  // J
  'JÁ', 'JE', 'JÁMA', 'MOJE', 'JÍST', 'JÍL', 'JOJO',
  // N
  'NOS', 'ANO', 'NE', 'NÁS', 'SEN', 'SENO', 'LANO', 'NOTA', 'NULA', 'SLON', 'ON', 'ONA', 'NIT',
  // V
  'VŮL', 'VOSA', 'VLNA', 'VÍLA', 'VÍNO', 'SOVA', 'LEV', 'VANA', 'VLASY',
  // D
  'DŮM', 'DÁMA', 'VODA', 'DOMOV', 'DOLE', 'MED', 'LED', 'SAD', 'DÍLO', 'DEN', 'DOMA',
  // Ě
  'DĚDA', 'DÍTĚ', 'MĚSTO', 'PĚT', 'TĚLO', 'VĚŽ', 'KOTĚ', 'SNĚH', 'BĚH', 'ZEMĚ',
  // Z
  'ZIMA', 'VÁZA', 'ZÁDA', 'ZLATO', 'ZOO',
  // K
  'KOLO', 'KOS', 'KOZA', 'OKO', 'MLÉKO', 'KÁMEN', 'KOST', 'SKOK', 'MAK', 'KAPSA', 'DEKA', 'KYTKA',
  // R
  'RAK', 'RUKA', 'ROK', 'SÝR', 'TRÁVA', 'KRÁVA', 'DORT', 'ROSA', 'PERO', 'RÁNO', 'MRAK', 'KRTEK', 'SRNA',
  // Ř
  'MOŘE', 'ŘEKA', 'ŘEPA', 'DVEŘE', 'TŘI', 'KEŘ', 'PEPŘ', 'ŘÍJEN',
  // B
  'BOTA', 'BOTY', 'BUBEN', 'RYBA', 'ZUB', 'DUB', 'BALÓN', 'BÍLÝ', 'OBR', 'BRÁNA', 'BLESK', 'BOB',
  // C
  'OCAS', 'CESTA', 'OVOCE', 'PEC', 'NOC', 'CUKR', 'VEJCE', 'OPICE', 'CIBULE', 'CITRON', 'MĚSÍC',
  // Č
  'ČAJ', 'OČI', 'MÍČ', 'KLÍČ', 'KOČKA', 'ČERT', 'ČÁP', 'ČÍSLO', 'ČEPICE', 'ČOČKA',
  // Š
  'MYŠ', 'KOŠ', 'ŠÁLA', 'ŠNEK', 'ŠKOLA', 'ŠATY', 'KAŠE', 'MAŠLE', 'ŠIŠKA', 'LIŠKA',
  // Ž
  'ŽÁBA', 'NŮŽ', 'JEŽEK', 'ŽIRAFA', 'ŽÍDLE', 'LŽÍCE', 'ŽELVA', 'ŽALUD', 'RŮŽE', 'TUŽKA',
  // H
  'HAD', 'HORA', 'NOHA', 'HUSA', 'HRAD', 'HLAVA', 'HOUBA', 'DUHA', 'HOLUB',
  // CH
  'CHLÉB', 'MUCHA', 'CHATA', 'CHOBOT', 'STŘECHA', 'ÚCHO', 'PRACH',
  // F
  'FARMA', 'FÍK', 'FOTKA', 'FIALKA', 'FÉN', 'FLÉTNA', 'FOTBAL', 'KOFOLA',
  // G
  'GUMA', 'GÓL', 'GEPARD', 'GLÓBUS', 'MAGNET', 'IGLÚ', 'GORILA',
  // Ď, Ť, Ň
  'LOĎ', 'ZEĎ', 'TEĎ', 'LABUŤ', 'MASŤ', 'ŤAPKA', 'KŮŇ', 'LAŇ', 'DLAŇ', 'SKŘÍŇ',
  // X
  'TAXI', 'BOX', 'TEXT', 'XYLOFON',
];
export const MORE_NAMES: string[] = ['PEPA', 'TOM', 'BOB'];

// tahy tiskacích písmen pro patro Psaní (rámeček 100 × 140 jako u ostatních; háček nad písmenem)
const CARON = 'M36 1 L50 11 L64 1';
export const MORE_GLYPHS: Record<string, string[]> = {
  P: ['M28 125 L28 15', 'M28 15 L58 15 C88 15 88 72 58 72 L28 72'],
  T: ['M18 15 L82 15', 'M50 15 L50 125'],
  J: ['M66 15 L66 98 C66 132 22 132 20 104'],
  N: ['M22 125 L22 15 L78 125 L78 15'],
  V: ['M18 15 L50 125 L82 15'],
  D: ['M26 15 L26 125', 'M26 15 L48 15 C94 15 94 125 48 125 L26 125'],
  Z: ['M22 15 L78 15 L22 125 L78 125'],
  K: ['M26 15 L26 125', 'M78 15 L26 80', 'M44 60 L80 125'],
  R: ['M28 125 L28 15', 'M28 15 L56 15 C86 15 86 70 56 70 L28 70', 'M50 70 L80 125'],
  B: ['M28 15 L28 125', 'M28 15 L54 15 C82 15 82 66 54 68 L28 68', 'M28 68 L58 68 C90 68 90 125 58 125 L28 125'],
  C: ['M78 32 C66 6 20 12 20 70 C20 128 66 134 78 108'],
  H: ['M24 15 L24 125', 'M76 15 L76 125', 'M24 70 L76 70'],
  F: ['M28 15 L28 125', 'M28 15 L78 15', 'M28 68 L68 68'],
  G: ['M78 32 C66 6 20 12 20 70 C20 128 66 134 80 104 L80 76 L56 76'],
  X: ['M20 15 L80 125', 'M80 15 L20 125'],
  W: ['M10 15 L30 125 L50 50 L70 125 L90 15'],
  Q: ['M50 15 C14 15 14 125 50 125 C86 125 86 15 50 15', 'M60 100 L84 132'],
};
// písmena s háčkem: tahy základního písmena + háček (S a E jsou mezi původními písmeny v content/glyphs.ts)
export const CARON_OF: Record<string, string> = { Ř: 'R', Č: 'C', Š: 'S', Ž: 'Z', Ď: 'D', Ť: 'T', Ň: 'N', Ě: 'E' };
export const CARON_STROKE = CARON;
