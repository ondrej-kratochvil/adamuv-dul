# Adamův důl: pravidla pro úpravy

Hra je projekt ve Vite: kostra v `index.html`, kód v `src/` (struktura v `README.md`), nasazení na GitHub Pages
automaticky z větve `main` přes GitHub Actions, jen když projdou testy. Hraje ji Adam (1. třída) na tabletu s Family Link.
Obsah (písmena, slova, čísla) se řídí tím, co Adam umí ve škole; souhrn a rozhodnutí jsou v osobní znalostní bázi
(`osobni/deti.md`, sekce „Čtecí hra Adamův důl“).

## Odměny musí držet krok s obsahem (Ondřej, 19. 10. 2026)

Maximální vybavení má Adam mít až ve chvíli, kdy zvládne všechno, co hra obsahuje. Když přidáváš úkoly,
přidej i odměny, aby Adam nedošel na strop dřív, než dojde obsah.

- **Očarování** (`content/enchants.ts`) se odemykají podle podílu zvládnutých úkolů (`masteryPoints()` v `logic/mastery.ts`):
  odměna č. i potřebuje `ceil((i + 1) / počet_odměn × počet_úkolů)` zvládnutých. Když přidáš nové patro nebo
  položky, přidej je do `MASTERY_SETS()`; prahy se posunou samy. Když přidáš velký blok obsahu, přidej i nová
  očarování nebo jiné odměny, aby krok mezi odměnami nebyl příliš dlouhý (teď zhruba 3 zvládnuté úkoly na odměnu).
- **Vesnice** (`BUILDINGS`): každé patro staví svou budovu podle podílu svých zvládnutých úkolů (8 fází, hotovo až při 100 %).
  Kreslí se vždy nejvyšší dosažená fáze (`save.village`), budova nikdy nespadne (review 19. 10. 2026).
- **Stavění** (`logic/build.ts`): každá vykopaná kostka jde do zásoby (i z nedohraného kola), kostky se nikdy neztratí (test).
  Klepnutí na trávu staví od země (`tapGround`); klepnutí, které nic neudělá, vždy řekne proč.
- **Záloha** (`adamuv-dul-zaloha`): vzniká před mazáním, vložením postupu a převodem starých dat; v nastavení jde vrátit
  (vrácení stav a zálohu vymění, takže jde vrátit i zpátky).
  Nové patro = nová budova v `BUILDINGS` (a položky v `MASTERY_SETS()`).
- **Sbírka kartiček** (`cardWords()`): kartička za každé zvládnuté slovo (Slova nebo Čtení), celá sbírka = 30 smaragdů.
  Nová slova ve `WORDS` přidají kartičky sama; slova s obrázkem v `PIC` mají kartičku s obrázkem.
- **Portál do Netheru** odměňuje pravidelnost, ne zvládnutí: 1 obsidián za každý den s povedeným kolem (`registerDay`),
  10 = portál, každý další den kus Netheru (`NETHER_STAGES`). Až dojdou fáze, přidat další (nebo End).
- **Mláďata na farmě** (`BABIES`) odměňují pravidelnost: týden (po až ne) s aspoň 4 odehranými dny = jedno mládě.
  Až dojdou, přidat další.
- **Přerov z kostek** (`PREROV`) odměňuje nejdelší řadu dní (3, 5, 7, 10, 14, 21, 30, 45, 60). Jen skutečná místa z Adamova
  okolí (škola a sokolovna podle `osobni/deti.md`), nic smyšleného.
- **Finále (End a Ender drak)**: 12 očí Enderu podle podílu zvládnutých úkolů, portál a boj až při 100 % (`endOpen()`).
  Boj = 20 smíšených úkolů ze všech pater (`genBoss`), odměna jednou (dračí hlava, dračí vejce, 100 smaragdů), opakovat jde.
  Když přibude obsah, oči se přepočítají samy (získané oči `save.eyes` zůstávají).
- **Zvládnutý úkol** = `mastery() === 'good'` (aspoň 3× správně a poslední dobou bez chyby).
- Odměny podle počtu kol (krumpáče, oblečení `at:`, dům 12 dílů, farma 10 dílů) končí kolem 22. kola;
  další dlouhodobé cíle mají být vázané na zvládnutí, ne na počet kol (jinak se vyplácí hrát lehké patro dokola).
- Získané odměny se nikdy neberou zpět.

## Verze a novinky

Každá úprava, která jde na `main`, zvýší `APP_VERSION` v `index.html` a přidá do `version.json` záznam se stejným
číslem: 1 až 3 krátké věty pro Adama (hra je umí přečíst nahlas), co je nového. Hra podle `version.json` nabídne
aktualizaci a po ní novinky ukáže.

## Další zásady

- Za chybu se nic nebere, jen se nic nepřidá (zaseknutý krumpáč, kolo se nepočítá). Zaseknutí trvá 2 s; Ochrana na výbavě ho zkracuje o 50 ms za úroveň, nejvíc na 1,2 s (`stuckMs()`). Kratší ne, aby se tipování nevyplatilo.
- Texty pro Adama musí jít přečíst nahlas (hlas prohlížeče, čeština). Každé tlačítko pro Adama má ikonu (`data-icon` / `setBtn`, sada `ICONS`), aby mu rozuměl i bez čtení.
  Když text pro Adama (hlas, novinky) odkazuje na tlačítko, popiš ho obrázkem a barvou a přidej i nápis
  („zelené tlačítko s fajfkou, je na něm napsáno Rozumím“), ať si Adam nápis postupně spojí s tlačítkem.
- Slabiky a slova hlas říká v krátké české větě (`inCzech`: „Slabika me.“), jinak je český hlas čte anglicky (me = mí, so = sou).
- Podoby rodiny jen podle toho, co řekl Ondřej (`FAMILY`); nic nedomýšlet.
## Kód a testy

- **Obsah patří do `src/content/`, pravidla do `src/logic/`** (TypeScript, bez DOM a bez `localStorage`, náhoda jako parametr).
  Moduly v `src/levels`, `src/world` atd. jen volají logiku a kreslí.
- **Každá nová funkce nebo oprava má test**: pravidlo v `tests/unit/`, chování ve hře v `tests/e2e/`. Oprava chyby = nejdřív test,
  který chybu ukáže.
- **Změna tvaru uloženého stavu** = nové číslo `SCHEMA` v `src/save/schema.ts`, krok v `migrate()` a test se vzorkem
  starého stavu v `tests/fixtures/`. Získané věci se nikdy nesmí ztratit.
- Obaly volané z jiných modulů psát jako `function`, ne `const x = () =>`: moduly se navzájem importují v kruhu
  a konstanta by při startu ještě neexistovala.
- Před commitem `npm test` (typy, unit testy, prohlížeč). Push na `main` nasazuje: jen se zelenými testy.
