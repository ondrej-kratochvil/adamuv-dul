// Adam: vestavěný hráč (Ondřej 24. 10. 2026: „v repu může zůstat Adam“). Ostatní hráči jsou jen v souboru u rodiny.
// Podoba rodiny, hlášky (content/family-lines.ts) a věty o youtuberech (content/youtuber-lines.ts) jsou odsouhlasené Ondřejem.
import type { Player, Person } from '../logic/player';
import { EARLY_BIRD, FAMILY_LINES, MOM_OPEN, MOM_PLAY_LIMIT_MIN, MOM_PLAY_TEXT, MOM_SLOTS } from './family-lines';
import { YOUTUBER_LINES, YT_SHARE } from './youtuber-lines';

const LOOKS: Omit<Person, 'lines'>[] = [
  // barvy vlasů podle Ondřeje (19. 10. 2026); děda Marek téměř holohlavý (Ondřej), krátké vousy podle fotek; babičky krátké vlasy
  // podle fotek (Ondřej 20. 10. 2026: „ano, uprav je“), Iva po bradu, Jindra kratší; dřív drdol jen pro odlišení od dědů
  { id: 'paja', name: 'máma Pája', gen: 'mámy Páji', f: true, hair: '#e2c06c', long: true, top: '#c84a8a' },
  { id: 'ondra', name: 'táta Ondra', gen: 'táty Ondry', f: false, hair: '#a07a52', grey: '#c4bcb2', top: '#2f6fb0' },
  { id: 'jindra', name: 'babička Jindra', gen: 'babičky Jindry', f: true, hair: '#4a2a14', bob: 6, top: '#7d4bc2' },
  { id: 'bob', name: 'děda Bob', gen: 'dědy Boba', f: false, hair: '#cfcfcf', top: '#7a5230' },
  { id: 'iva', name: 'babička Iva', gen: 'babičky Ivy', f: true, hair: '#e2c06c', bob: 9, top: '#3f9b3a' },
  { id: 'marek', name: 'děda Marek', gen: 'dědy Marka', f: false, hair: '#dcc274', top: '#c0392b', bald: true, beard: '#c9a26a' }, // téměř holohlavý, zbytek vlasů blond
  { id: 'david', name: 'brácha Davídek', gen: 'bráchy Davídka', f: false, hair: '#ecd27e', top: '#e0b324', small: true },
  // rodina Pájina bratra (Ondřej 20. 10. 2026): barvy vlasů z jeho odpovědí, brýle u Terky a vousy u Vaška podle jeho fotek;
  // délku vlasů Terky Ondřej neuvedl, má stejný střih jako máma
  { id: 'vasek', name: 'strejda Vašek', gen: 'strejdy Vaška', f: false, hair: '#4a2a14', top: '#2a4f8a', beard: true, own: true },
  { id: 'terka', name: 'teta Terka', gen: 'tety Terky', f: true, hair: '#4a2a14', long: true, glasses: true, top: '#d86a9a', own: true },
  // bratranec Víťa: stejně starý jako Adam, taky 1. třída. Noví příbuzní (own) říkají jen své odsouhlasené věty
  // (Ondřej 20. 10. 2026, docs/hlasky-navrh-2.md), ne společné typu „To je můj šikovný kluk!“
  { id: 'vita', name: 'bratranec Víťa', gen: 'bratrance Víti', f: false, hair: '#a07a52', top: '#3f9b3a', kid: true, own: true },
  // praděda Ruda (Ivin táta), Šárka (Markova žena) a její syn Tomáš (18): oslovení podle Ondřeje, podoba podle jeho fotek 20. 10. 2026.
  { id: 'ruda', name: 'praděda Ruda', gen: 'pradědy Rudy', f: false, hair: '#ececec', top: '#5a6e8a', own: true },
  { id: 'sarka', name: 'Šárka', gen: 'Šárky', f: true, hair: '#5a3418', long: true, top: '#f2f2f2', own: true },
  // prababička Marcelka (Markova máma): krátké tmavě hnědé vlasy a brýle podle Ondřejovy fotky 20. 10. 2026, hlášky odsouhlasené
  { id: 'marcelka', name: 'prababička Marcelka', gen: 'prababičky Marcelky', f: true, hair: '#3a2414', bob: 6, glasses: true, top: '#9ad8c8', own: true },
  { id: 'tomas', name: 'Tomáš', gen: 'Tomáše', f: false, hair: '#a07a52', buzz: true, top: '#f2f2f2', own: true },
];

export const ADAM: Player = {
  v: 1, name: 'Adam', voc: 'Adame', poss: 'Adamův', gender: 'm',
  birthday: '06-17', nameday: '12-24', // *17. 6. 2020; svátek na Štědrý den (Adam a Eva)
  family: LOOKS.map(p => ({
    ...p, ...(FAMILY_LINES[p.id] ? { lines: FAMILY_LINES[p.id] } : {}),
    ...(p.id === 'paja' ? { role: 'mom' as const } : {}),
    ...(p.id === 'david' ? { birthday: '06-04', nameday: '12-30' } : {}), // David *4. 6. 2023
  })),
  // kamarádi ze třídy: jen vzkazy, bez podoby ve hře (dokud ji neřekne Ondřej), místo obličeje obálka
  friends: [
    { id: 'tom', name: 'kamarád Tom', gen: 'kamaráda Toma', friend: true },
    { id: 'meda', name: 'kamarád Méďa', gen: 'kamaráda Médi', friend: true },
  ],
  mom: { slots: MOM_SLOTS, open: MOM_OPEN, playLimitMin: MOM_PLAY_LIMIT_MIN, playText: MOM_PLAY_TEXT },
  earlyBird: EARLY_BIRD,
  // zvířátka (Ondřej 25. 10. 2026); odemykají se postupně za splněné dnešní úkoly v tomto pořadí.
  // Barvy u Žofinky, Karla, Mazlíka, Shadowa, Harryho a Marva rodina zatím neřekla, obrázky mají provizorní barvy.
  pets: [
    { id: 'sunny', name: 'Sunny', what: 'had, užovka červená', kind: 'snake', owner: 'home' },
    { id: 'zofinka', name: 'Žofinka', what: 'zakrslý králíček', kind: 'rabbit', owner: 'home' },
    { id: 'mysky', name: 'bílé myšky', what: 'dvě bílé myšky, které musí utíkat před Sunnym', kind: 'mice', owner: 'home' },
    { id: 'mourek', name: 'Mourek', what: 'mourovatý kocour', kind: 'cat', owner: 'iva', stripes: true },
    { id: 'argo', name: 'Argo', what: 'pes, bernský salašnický', kind: 'dog', owner: 'iva' },
    { id: 'karel', name: 'Karel', what: 'papoušek, kterého babička našla', kind: 'parrot', owner: 'iva' },
    { id: 'skalary', name: 'skaláry', what: 'rybičky v akváriu s vodními rostlinami, děda je na ně odborník', kind: 'aquarium', owner: 'ruda' },
    { id: 'mazlik', name: 'Mazlík', what: 'kocour', kind: 'cat', owner: 'sarka', color: '#c98a4a' },
    { id: 'shadow', name: 'Shadow', what: 'kocour', kind: 'cat', owner: 'sarka', color: '#555a60' },
    { id: 'harry', name: 'Harry', what: 'křeček, jako lump z filmu Sám doma', kind: 'hamster', owner: 'vita' },
    { id: 'marv', name: 'Marv', what: 'křeček, jako lump z filmu Sám doma', kind: 'hamster', owner: 'vita', color: '#b98a5a' },
  ],
  fanLines: { ok: YOUTUBER_LINES.ok, fail: YOUTUBER_LINES.fail, share: YT_SHARE },
};
