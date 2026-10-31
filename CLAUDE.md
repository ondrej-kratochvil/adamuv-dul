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
- **Vzácné věci v obchodě** (`RARE` ve `world/farm.js`, `rareLeft` v `logic/rewards.ts`): kromě smaragdů potřebují podíl
  zvládnutých úkolů (15, 30, 50, 75 %). Zavedeno 20. 10. 2026: Adam měl po prvním dni všechny obyčejné věci a 140 smaragdů.
  Až Adam koupí všechno, přidat další vzácné věci, ať smaragdy mají k čemu být.
- **Procvičování** (`logic/practice.ts`, `levels/practice.js`, dlaždice Procvičit): kolo z úloh s chybami, záměnami nebo dlouhým
  přemýšlením (`weakItems`), odměny jako za běžné kolo, počítá se do `save.practice`. Psaní ne (jiný druh úkolu).
  Otevře se od 3 slabých úloh. Pestré: úloha nejvýš 2× za kolo, ne dvakrát po sobě, doplní se úlohy „učí se“ (`practicePool`). Zavedeno 20. 10. 2026 (Ondřej: „kolik času strávil u které úlohy, abychom ji mohli opakovat“).
- **Převlékání rodiny** (`content/family-wear.ts`, `logic/family-wear.ts`, `world/dressup.js`, dlaždice Rodina): kousky za smaragdy,
  koupený kousek má Adam napořád a dá ho komukoli (na každé místo jeden). Vzácné (`need`) jen za podíl zvládnutých úkolů.
  Převlečený portrét je vidět všude (`famCanvas`). Zavedeno 20. 10. 2026 jako zábava a další využití smaragdů.
- **Nástroje** (`content/tools.ts`, `logic/tools.ts`): meč, sekera, lopata, motyka v 6 materiálech; materiál podle podílu
  zvládnutých úkolů v patrech nástroje (`MATERIAL_STEPS`), netherit až při 100 %, dosažený se nebere (`save.gear.stages`).
  Krumpáč dál podle povedených kol (`TIERS`). Nové patro přiřadit k nástroji (test to hlídá).
- **Střídání pater** (`logic/rotation.ts`): po 3 kolech stejného patra za sebou patro „odpočívá“ (dlaždice ztlumená, konec kola nabídne
  „Hrát …“ jiné patro, to nejdéle nehrané); otevře se po kole jiného patra. Ondřej 20. 10. 2026 (Adam hrál 10× za sebou Čísla).
- **Mluvení** (`content/speech.ts`, `logic/speech.ts`, `levels/speech.js`, od 20. 10. 2026): logopedie na R, Ř, L a sykavky.
  Hra výslovnost NEHODNOTÍ. Do zvládnutí se počítá jen sluch (`speech:slovo`); vyslovování hodnotí rodič (`say:slovo`),
  cvik a foukání se nehodnotí. Slova a cviky doladit podle sešitu z logopedie (fotky od Ondřeje). Patro patří k lopatě
  a k budově divadlo.
- **Stupně obtížnosti** (`logic/stages.ts`, Ondřej 24. 10. 2026): obsah patra přibývá podle zvládnutí, ne podle počtu kol.
  Další stupeň až při 70 % zvládnutých úloh všech otevřených stupňů (Počty: 12 zvládnutých příkladů do 10, pak `crossingReady`).
  Písmena: krátké samohlásky, dlouhé, Y/Ý/Ů, M L S. Slabiky: MA až MU, s L a S, dlouhé a s Y. Čísla 10, 20, 50, 100.
  Slova délka 3, 4, vše. Čtení jednotné, množné. Psaní snadné, vše, smyčka a spirála. Mluvení po jedné dvojici hlásek.
  Dosažený stupeň se pamatuje (`save.stages`) a nezavře se; po povedeném kole hra oznámí, co se otevřelo (`#newStage`).
  Počet kol řídí jen počet kostek (2, 3, 4). Nový obsah zařadit do stupně v `STAGES` (poslední stupeň = celý obsah, test to hlídá).
- **Zvládnutý úkol** = `mastery() === 'good'` (aspoň 3× správně a poslední dobou bez chyby).
- Odměny podle počtu kol (krumpáče, oblečení `at:`, dům 12 dílů, farma 10 dílů) končí kolem 22. kola;
  další dlouhodobé cíle mají být vázané na zvládnutí, ne na počet kol (jinak se vyplácí hrát lehké patro dokola).
- Získané odměny se nikdy neberou zpět. Jediná výjimka jsou smaragdy za chyby (viz níže), věci a stavby nikdy.

## Statistiky

- U každé úlohy se ukládá doba řešení (klouzavý průměr `t`, počet `tn`), záměny (`conf`: co Adam vybral místo správné) a rychlé
  tipy (`qw`, chyba do 1,2 s od konce zadání), viz `recordResult` v `logic/mastery.ts`.
- **Pauza** (`pauseRound`/`resumeRound` v `game/round.js`, tlačítko vedle Zpět, i při odchodu z aplikace): zadání a kostky se schovají,
  čas úlohy ani kola neběží; v deníku `pauses`/`pauseSecs`, v tabulce sloupce Pauzy a Pauza (s). Odliší přerušení od odchodu z kola.
- **Tabulka Google** (`logic/sync.ts`, `app/sync.js`, skript `docs/google-tabulka.gs`, návod `docs/google-tabulka.md`): po každé úloze,
  kole a hodnocení řádek do fronty v uloženém stavu, odeslání hned, při startu, při návratu do hry a po připojení. Řádky mají ID,
  skript duplicity přeskočí. Víc zařízení do jedné tabulky: sloupec Zařízení (`sync.device`, název v nastavení), značka `sync.uid` v ID,
  list „Stav <zařízení>“; vložený postup nepřebírá `sync` (patří zařízení). Adresa skriptu jen v nastavení (repo je veřejné), nikdy v kódu. Nic o rodině se neposílá.

## Profily hráčů

- `logic/profiles.ts`, `app/profiles.js`, nastavení pro rodiče „Profily hráčů“ (Ondřej 20. 10. 2026: testovat bez zásahu do Adamových
  statistik, hrát může i někdo jiný). Adamův profil (`adam`) zůstává pod původním klíčem `adamuv-dul-v1`, ostatní `adamuv-dul-v1:<id>`,
  seznam v `adamuv-dul-profily`. Nový profil od začátku nebo jako kopie postupu; kopie nepřebírá tabulku Google (adresu má každý profil zvlášť, karta Tabulka to u jiného profilu vysvětlí) a zkopírovaná kola znovu neposílá (`backfilled`); jiný profil má v tabulce sloupec Profil i ve starších kolech a vlastní list „Stav <zařízení> (<profil>)“ (21. 10. 2026: kopie „Ondra“ poslala Adamova kola podruhé). Přepnutí = nové načtení hry.
  Na úvodní obrazovce je u jiného profilu červený štítek „Profil: …“ (na mobilu jen jméno a verze „v48“, hlavička na jeden řádek, test `verze-cislo`); v tabulce sloupec Profil. Hlas zatím oslovuje „Adame“ každého.

## Nastavení pro rodiče

- Karty (Ondřej 21. 10. 2026, nastavení bylo dlouhé): Hra (písmo, přísnost), Hlas (hlas, výslovnost slabik), Rodina (vzkazy, jméno psa),
  Postup (statistiky, od začátku, záloha, přenos), Profily, Tabulka (Google). Nová volba patří do karty podle tématu, ne na konec.
  Při dalším otevření zůstane poslední karta; karta Hlas má „!“, když chybí český hlas. V testech `openSettings(page, 'karta')`.

## Verze a novinky

Každá úprava, která jde na `main`, zvýší `APP_VERSION` v `index.html` a přidá do `version.json` záznam se stejným
číslem: 1 až 3 krátké věty pro Adama (hra je umí přečíst nahlas), co je nového. Hra podle `version.json` nabídne
aktualizaci a po ní novinky ukáže.

## Další zásady

- **Ztráta smaragdů za chyby** (Ondřej 20. 10. 2026, Adamovi byly chyby jedno; `errorCost` v `logic/rewards.ts`): první 2 chyby v kole
  zdarma (po druhé varování), každá další 1 smaragd, nejvýš 5 za kolo, nikdy pod nulu; v deníku `lost`, v tabulce „Ztracené smaragdy“.
  Jinak se za chybu nic nebere (zaseknutý krumpáč, kolo se nepočítá). Zaseknutí trvá 2 s; Ochrana na výbavě ho zkracuje o 50 ms za úroveň, nejvíc na 1,2 s (`stuckMs()`). Kratší ne, aby se tipování nevyplatilo.
- Texty pro Adama musí jít přečíst nahlas (hlas prohlížeče, čeština). Každé tlačítko pro Adama má ikonu (`data-icon` / `setBtn`, sada `ICONS`), aby mu rozuměl i bez čtení.
  Když text pro Adama (hlas, novinky) odkazuje na tlačítko, popiš ho obrázkem a barvou a přidej i nápis
  („zelené tlačítko s fajfkou, je na něm napsáno Rozumím“), ať si Adam nápis postupně spojí s tlačítkem.
- Slabiky a slova hlas říká přes `pronounce()` (`logic/pronounce.ts`). Hlas tabletu čte krátké slabiky anglicky (so = sou);
  věta „Slabika so.“ to nespravila (Ondřej 19. 10. 2026), proto pryč. Rizikové slabiky (`RISKY_SYLLABLES`) jdou v nastavení
  vyzkoušet; výchozí „s písmeny“ („so, es, o“) jen u so a me (`LETTERS_BY_DEFAULT`, ověřeno Ondřejem na jeho mobilu s Androidem 19. 10. 2026, na Adamově tabletu předpoklad), rodič v nastavení vybere variantu, která na tabletu zní česky (`save.pron`).
  Novou slabiku bez čárky, která je anglickým slovem, přidat do `RISKY_SYLLABLES`.
- Podoby rodiny jen podle toho, co řekl nebo ukázal Ondřej (`FAMILY`; Vašek, Terka, Víťa, Ruda, Šárka, Tomáš a úpravy babiček a Marka podle jeho odpovědí a fotek 20. 10. 2026); nic nedomýšlet.
  Fotky rodiny do repa nikdy (je veřejné), jen znaky v komentáři. Člen bez odsouhlasených hlášek má `quiet` (nefandí); `own` = říká jen své věty, ne společné (noví příbuzní, Víťa a Tomáš nejsou rodiče). Hlášky rodiny jsou v `content/family-lines.ts`
  (odsouhlasené Ondřejem 19. 10. 2026; místa jako Újezdec, Zavadilka, Biskupice smí být ve veřejném repu). Nové hlášky
  nejdřív navrhnout Ondřejovi, nevymýšlet nové údaje o rodině.
- Věty o youtuberech (`content/youtuber-lines.ts`, Sir Yakari a Bouchal, které Adam sleduje): jen ověřená veřejná fakta, žádné domyšlené
  postavy; zazní po kole ve čtvrtině případů.
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

## Server a nasazení (Schoolcraft, 25. 10. 2026)

- Hra běží na **https://schoolcraft.games** (Cloudflare Workers, `wrangler.jsonc`): statické soubory z `dist` a API
  `worker/index.ts` (čistá logika `worker/logic.ts`, testy `tests/unit/worker.test.ts`). Databáze D1 `schoolcraft`
  v EU, změny jako nové soubory ve `worker/migrations/` (nikdy neměnit už nasazený soubor).
- Push na `main` nasazuje GitHub Pages (stará adresa, jen přestěhuje postup, `src/app/move.js`) i Cloudflare
  (úloha `cloudflare` v `.github/workflows/test-a-nasazeni.yml`, tajné proměnné `CLOUDFLARE_API_TOKEN`
  a `CLOUDFLARE_ACCOUNT_ID`). Funguje tedy i z cloudové session.
- Lokálně: token je v uživatelské proměnné prostředí Windows `CLOUDFLARE_API_TOKEN` (hodnotu nikdy nevypisovat).
  `npx wrangler dev --local` pro zkoušení API, `npx wrangler d1 migrations apply schoolcraft --local`.
- Online ve hře: `src/app/cloud.js` (přihlášení zařízení kódem, záloha postupu, statistiky, žebříček), pravidla
  v `src/logic/cloud.ts`. V testech je server zablokovaný (`tests/e2e/helpers.js`), testy online si ho napodobí.
- Do žebříčku jde jen přezdívka, postavička, týdenní body a co je postavené; nikdy jméno rodiny, chyby ani statistiky.
- **Ranní upozornění** (web push, Ondřej 31. 10. 2026): rodič zapne na kartě Hra (`src/ui/push-settings.js`, `src/app/push.js`,
  pravidla `src/logic/push.ts`), hodina 5 až 9, výchozí 7. Server (`worker/push.ts`, tabulky `push_subs` a `config`
  v `worker/migrations/0002_push.sql`) každou celou hodinu (cron v `wrangler.jsonc`) pošle prázdnou zprávu zařízením
  s tou hodinou českého času; text zobrazí `public/sw.js` z mezipaměti (`PUSH_TEXT_URL`, píše ho hra při startu).
  Klíč VAPID si server vytvoří sám a drží v D1 (`config`), nikde jinde není. Jen známé služby upozornění (`validEndpoint`).
  Family Link: rodič musí povolit oprávnění pro weby (Ovládací prvky, Google Chrome a web). Stav patří zařízení (`schoolcraft-upozorneni`).
