// Patro Mluvení (logopedie, Ondřej 20. 10. 2026): hlásky R, Ř, L a sykavky S Š, Z Ž, C Č.
// Hra výslovnost NEHODNOTÍ (Adam chodí na logopedii, hra by mu křivdila). Hodnotí jen sluch (co slyší ve slově),
// u vyslovování rozhoduje rodič tlačítkem. Slova a cviky se doladí podle sešitu z logopedie (fotky pošle Ondřej).

// zvuk = písmeno + obrázek, který si dítě s hláskou spojí (Adam písmena R, Š… ještě nezná)
export interface Sound { id: string; letter: string; icon: string; hint: string }
export const SOUNDS: Record<string, Sound> = {
  R: { id: 'R', letter: 'R', icon: '🐕', hint: 'pejsek vrčí rrr' },
  L: { id: 'L', letter: 'L', icon: '🍭', hint: 'lízátko lll' },
  Ř: { id: 'Ř', letter: 'Ř', icon: '🌊', hint: 'ř jako v moře' },
  S: { id: 'S', letter: 'S', icon: '🐍', hint: 'had syčí sss' },
  Š: { id: 'Š', letter: 'Š', icon: '🤫', hint: 'tichounce ššš' },
  Z: { id: 'Z', letter: 'Z', icon: '🐝', hint: 'včelka bzučí zzz' },
  Ž: { id: 'Ž', letter: 'Ž', icon: '🐞', hint: 'brouček žžž' },
  C: { id: 'C', letter: 'C', icon: '🦗', hint: 'cvrček ccc' },
  Č: { id: 'Č', letter: 'Č', icon: '🚂', hint: 'vláček ččč' },
};

// dvojice, které se rozlišují sluchem (nejdřív R a L, pak sykavky)
export const PAIRS: [string, string][] = [['R', 'L'], ['S', 'Š'], ['Z', 'Ž'], ['C', 'Č'], ['R', 'Ř']];

// slova s obrázkem; každé má jednu cvičenou hlásku a nesmí obsahovat druhou hlásku z dvojice (hlídá test)
export interface SpeechWord { w: string; pic: string; s: string }
export const SPEECH_WORDS: SpeechWord[] = [
  // R
  { w: 'ryba', pic: '🐟', s: 'R' }, { w: 'rak', pic: '🦞', s: 'R' }, { w: 'ruka', pic: '✋', s: 'R' }, { w: 'raketa', pic: '🚀', s: 'R' },
  { w: 'robot', pic: '🤖', s: 'R' }, { w: 'hrad', pic: '🏰', s: 'R' }, { w: 'traktor', pic: '🚜', s: 'R' }, { w: 'duha', pic: '🌈', s: '' },
  // L
  { w: 'lžíce', pic: '🥄', s: 'L' }, { w: 'lev', pic: '🦁', s: 'L' }, { w: 'loď', pic: '⛵', s: 'L' }, { w: 'jablko', pic: '🍎', s: 'L' },
  { w: 'kolo', pic: '🚲', s: 'L' }, { w: 'mléko', pic: '🥛', s: 'L' }, { w: 'list', pic: '🍃', s: 'L' },
  // Ř
  { w: 'moře', pic: '🌊', s: 'Ř' }, { w: 'dveře', pic: '🚪', s: 'Ř' }, { w: 'tři', pic: '3️⃣', s: 'Ř' }, { w: 'řetěz', pic: '⛓️', s: 'Ř' },
  // S
  { w: 'sova', pic: '🦉', s: 'S' }, { w: 'sýr', pic: '🧀', s: 'S' }, { w: 'pes', pic: '🐶', s: 'S' }, { w: 'sáně', pic: '🛷', s: 'S' }, { w: 'salát', pic: '🥗', s: 'S' },
  // Š
  { w: 'šála', pic: '🧣', s: 'Š' }, { w: 'myš', pic: '🐭', s: 'Š' }, { w: 'koš', pic: '🧺', s: 'Š' }, { w: 'šnek', pic: '🐌', s: 'Š' }, { w: 'hruška', pic: '🍐', s: 'Š' },
  // Z
  { w: 'zebra', pic: '🦓', s: 'Z' }, { w: 'zub', pic: '🦷', s: 'Z' }, { w: 'koza', pic: '🐐', s: 'Z' }, { w: 'váza', pic: '🏺', s: 'Z' }, { w: 'zámek', pic: '🔒', s: 'Z' },
  // Ž
  { w: 'žába', pic: '🐸', s: 'Ž' }, { w: 'žirafa', pic: '🦒', s: 'Ž' }, { w: 'nůž', pic: '🔪', s: 'Ž' }, { w: 'žralok', pic: '🦈', s: 'Ž' }, { w: 'ježek', pic: '🦔', s: 'Ž' },
  // C
  { w: 'cibule', pic: '🧅', s: 'C' }, { w: 'citron', pic: '🍋', s: 'C' }, { w: 'opice', pic: '🐒', s: 'C' }, { w: 'palec', pic: '👍', s: 'C' },
  // Č
  { w: 'čaj', pic: '🍵', s: 'Č' }, { w: 'oči', pic: '👀', s: 'Č' }, { w: 'míč', pic: '⚽', s: 'Č' }, { w: 'klíč', pic: '🔑', s: 'Č' }, { w: 'kočka', pic: '🐱', s: 'Č' },
].filter(x => x.s); // „duha“ jen jako vzor bez hlásky, ve hře ne

// gymnastika mluvidel (nic se nehodnotí, jen se napodobuje a počítá do pěti)
export const EXERCISES: { icon: string; text: string }[] = [
  { icon: '👅', text: 'Vyplázni jazyk a zkus dosáhnout na nos.' },
  { icon: '👅', text: 'Jazyk dolů, jako bys chtěl olíznout bradu.' },
  { icon: '😋', text: 'Olízni si rty dokola, jako po zmrzlině.' },
  { icon: '🐴', text: 'Cvakej jazykem jako koník: klap, klap.' },
  { icon: '🐡', text: 'Nafoukni tváře jako ryba a pak je pomalu vyfoukni.' },
  { icon: '😁', text: 'Velký úsměv, pak pusinka. Úsměv, pusinka.' },
  { icon: '🕰️', text: 'Hodiny: jazyk z pusy doprava a doleva, tik, tak.' },
  { icon: '🦷', text: 'Dej špičku jazyka nahoru za horní zuby a podrž ji tam.' },
];

export const speechKey = (w: SpeechWord): string => w.w;
