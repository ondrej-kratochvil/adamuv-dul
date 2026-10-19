// Hlášky rodiny (odsouhlasil Ondřej 19. 10. 2026, návrh v docs/hlasky-navrh.md; místa jsou skutečná a smí být veřejně).
// cheers = po povedeném kole, enc = po nepovedeném kole, hello = „dnes ti fandí“ na úvodní obrazovce.
export interface Lines { cheers: string[]; enc: string[]; hello: string }

export const FAMILY_LINES: Record<string, Lines> = {
  iva: {
    cheers: [
      'Adame, jsem na tebe pyšná! Až přijedeš do Újezdce, všechno mi povíš.',
      'Takového šikovného kluka bych potřebovala na zahradě u rybníka!',
      'Výborně! To si zasloužíš jahody ze zahrady.',
      'Ty už čteš jako velký školák. Babička má radost!',
      'Paráda! Až budeš v Újezdci, postavíme spolu něco u rybníka.',
      'Šikula! Zahrada by potřebovala takového pomocníka.',
      'To je můj Adámek! Pošlu ti pusu až do Přerova.',
    ],
    enc: ['Nevadí, Adame. I na zahradě to někdy hned nevyroste.', 'Zkus to znovu, babička ti drží palce!', 'Pomaloučku a pozorně. Ty to zvládneš.'],
    hello: 'Ahoj Adame, tady babička Iva z Újezdce. Zahraj si, fandím ti!',
  },
  marek: {
    cheers: [
      'Výborně, Adame! Takového stavitele potřebuju na chatě.',
      'Na chatě zase něco opravujeme. Pomůžeš mi příště?',
      'Šikula! Ty bys postavil chatu sám.',
      'Takhle se kope! Ani já bych to líp nezvládl.',
      'Paráda! Na chatě by se hodil tvůj diamantový krumpáč.',
      'To je práce! Až přijedeš na chatu, postavíme něco spolu.',
      'Adame, ty jsi jednička. Děda má radost!',
    ],
    enc: ['Nevadí. Na chatě se taky něco napoprvé nepovede, a pak se to opraví.', 'Zkus to znovu, stavitel to nevzdává!', 'Pořádně se podívej a zkus to ještě jednou. Věřím ti.'],
    hello: 'Ahoj Adame, tady děda Marek. Na chatě zase něco stavím, a ty si zahraj!',
  },
  bob: {
    cheers: [
      'Výborně, Adame! Až půjdeš naproti k nám, ukážeš mi to?',
      'V Biskupicích máme domy na opravu. Takového stavitele potřebujeme!',
      'Postavíš nám k bytu výtah, Adame? Ty bys to zvládl!',
      'Šikovný kluk! Děda je na tebe pyšný.',
      'To je výkon! Mávám ti z okna naproti.',
      'Paráda! Až opravíme domy v Biskupicích, budeš tam stavbyvedoucí.',
      'Ty už čteš jako velký školák! Děda koukal.',
    ],
    enc: ['Nevadí, Adame. Zkus to znovu, děda ti fandí.', 'Pomalu a pozorně. Spěchat se nemusí.', 'I velcí stavitelé někdy něco pokazí. Zkus to ještě jednou.'],
    hello: 'Ahoj Adame, tady děda Bob z bytu naproti. Zahraj si, mávám ti z okna!',
  },
  jindra: {
    cheers: [
      'Výborně, Adame! Jsem na tebe pyšná.',
      'Na Zavadilce je na zahradě pořád práce. Takového pomocníka bych potřebovala!',
      'Šikulka! Až přijedeš na Zavadilku, zasadíme spolu kytičky.',
      'Paráda! Přijď k nám naproti, upeču ti něco dobrého.',
      'To je můj šikovný vnouček!',
      'Na Zavadilce bys mohl kopat záhonky. Kopat ti jde!',
      'Mám z tebe velkou radost, Adame.',
    ],
    enc: ['Nevadí, broučku. Zkus to znovu.', 'I na zahradě se musí čekat, než něco vyroste. Příště to dáš!', 'Babička ti drží palce. Ještě jednou!'],
    hello: 'Ahoj Adame, tady babička Jindra. Zahraj si, a pak přijď k nám naproti!',
  },
  ondra: {
    cheers: [
      'Šikovný jsi po mně, Adame!',
      'Jsem na tebe hrdý.',
      'To je můj kluk! Tohle bych v první třídě nezvládl.',
      'Výborně! Šikovnost máš po tátovi.',
      'Paráda, Adame. Jsem na tebe moc pyšný.',
      'Ty už čteš sám! Táta má velkou radost.',
      'Jedničkář! Plácneme si, až přijdu domů.',
    ],
    enc: ['Nevadí, Adame. I táta se musel učit. Zkus to znovu.', 'Chybami se člověk učí. Příště to dáš!', 'Pozorně poslouchej a jde to. Věřím ti.'],
    hello: 'Ahoj Adame, tady táta. Jsem na tebe hrdý, zahraj si!',
  },
  paja: {
    cheers: [
      'Výborně, Adame! Máma je na tebe pyšná.',
      'Ty jsi můj šikula!',
      'Paráda! Až dohraješ, dáme si pusu.',
      'To je můj velký školák!',
      'Šikovný! Ale nezapomeň se napít.',
      'Mám z tebe radost, broučku.',
    ],
    enc: ['Nevadí, broučku. Zkus to znovu.', 'Pomalu a pozorně, ty to dáš.', 'Máma ti fandí!'],
    hello: 'Ahoj Adame, tady máma. Zahraj si, ale ne moc dlouho!',
  },
  david: { // malý, ještě nevyslovuje (Ondřej): „popolu“ = Kofolu
    cheers: ['Do toho, Adam! Chceš popolu?', 'Hulá! Adam to umí!', 'Já taky kopat! Já taky!', 'Adam je silný!', 'Bláško, ty jsi nejlepší!', 'Ještě, ještě! Adam kope!'],
    enc: ['Nevadí, Adam! Znovu!', 'Adam, já ti fandím!'],
    hello: 'Ahoj Adam! Já fandím! Chceš popolu?',
  },
};

// Máma se stará: připomínky podle času v tabletu, každá jednou za den. Mají přednost před náhodnou pochvalou.
export interface MomSlot { id: string; from: string; to: string; text: string; weekday?: boolean; weekend?: boolean }
export const MOM_SLOTS: MomSlot[] = [
  { id: 'skola', from: '06:30', to: '08:00', weekday: true, text: 'Výborně, Adame! A teď hurá se nachystat do školy.' },
  { id: 'snidane', from: '06:30', to: '09:00', weekend: true, text: 'Výborně, Adame! A teď hurá nasnídat se.' },
  { id: 'obed', from: '11:30', to: '13:00', text: 'Šikula! Pojď na oběd, ať máš sílu na kopání.' },
  { id: 'vecere', from: '17:30', to: '19:00', text: 'Paráda! Za chvíli je večeře, tak už dohraj.' },
  { id: 'spat', from: '19:30', to: '23:59', text: 'Výborně! Teď ale čistit zuby, koupat a do postele.' },
];
export const MOM_PLAY_LIMIT_MIN = 30;
export const MOM_PLAY_TEXT = 'Dneska už jsi hrál dlouho, Adame. Pojď si odpočinout, hra počká.';
