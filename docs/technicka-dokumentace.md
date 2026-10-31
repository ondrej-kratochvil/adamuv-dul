# Schoolcraft (Adamův důl): technická dokumentace

> **Co:** podrobný popis, jak je hra postavená: moduly, herní pravidla, uložený stav, server, upozornění, testy a nasazení
> **Stav:** aktivní
> **Stav k:** 31. 10. 2026 (hra verze 71, schéma uloženého stavu 12, databáze s migracemi 0001 až 0003)
> **Souhrn:**
> - Klientská hra (Vite, ES moduly, pravidla v TypeScriptu) běží jako PWA na https://schoolcraft.games, postup je v zařízení.
> - Server je Cloudflare Worker s databází D1 v EU: záloha postupu, statistiky, žebříček a upozornění (web push).
> - Pravidla (`src/logic`) jsou čisté funkce bez DOM, testované ve Vitestu; chování ve hře hlídá Playwright.
> - Push na `main` nasadí GitHub Pages i Cloudflare, ale jen se zelenými testy.
> **Souvisí:** [`../CLAUDE.md`](../CLAUDE.md) (závazná pravidla pro úpravy), [`../README.md`](../README.md) (rozcestník),
> [`prirucka.md`](prirucka.md) (uživatelská příručka), [`koncepce.md`](koncepce.md) (proč je hra takhle postavená),
> [`google-tabulka.md`](google-tabulka.md) (návod k tabulce Google)

Čísla a prahy v tomto dokumentu platí ke dni výše. Autoritativní je vždy kód (soubor je uvedený u každého pravidla);
když se něco změní, opravte to i tady.

---

## 1. Přehled

| Část | Technologie | Kde |
|---|---|---|
| Hra (klient) | Vite 6, ES moduly, TypeScript 5.9 pro pravidla, JavaScript pro obrazovky | `index.html`, `src/` |
| Uložený postup | `localStorage` (JSON), fotky v IndexedDB | `src/save/`, `src/app/photos.js` |
| Offline a upozornění | service worker, manifest PWA | `public/sw.js`, `public/manifest.webmanifest` |
| Server | Cloudflare Workers, databáze D1 (EU), cron | `worker/`, `wrangler.jsonc` |
| Testy | Vitest (pravidla), Playwright (Chromium, emulace Pixel 7) | `tests/unit/`, `tests/e2e/` |
| Nasazení | GitHub Actions: GitHub Pages (stará adresa) a Cloudflare | `.github/workflows/test-a-nasazeni.yml` |
| Statistiky navíc | Google Apps Script v tabulce rodiče (volitelné) | `docs/google-tabulka.gs` |

Hra se hraje i bez internetu. Server jen zálohuje a přidává sdílené funkce (žebříček, upozornění). Když neodpovídá, hra
pokračuje a pošle data později.

---

## 2. Sestavení a nástroje

**`package.json`** (`"type": "module"`)

| Příkaz | Co dělá |
|---|---|
| `npm run dev` | Vite s okamžitým překreslením na http://localhost:5173 |
| `npm run build` | sestavení do `dist/` |
| `npm run preview` | sestavená hra na http://127.0.0.1:4173 (pro testy v prohlížeči) |
| `npm test` | `tsc` + `vitest run` + `playwright test`; před každým commitem musí projít |
| `npm run test:unit` / `test:e2e` / `typecheck` | jednotlivé části |

- Závislosti za běhu: `qrcode-generator` 2.0.4 (kreslení QR) a `jsqr` 1.4.0 (čtení QR bez `BarcodeDetector`).
- Vývojové: Playwright 1.56, TypeScript 5.9, Vite 6, Vitest 3, wrangler 4.
- **`vite.config.js`**: `base: './'` (relativní cesty, hra funguje na kořeni domény i v podsložce GitHub Pages),
  `outDir: 'dist'`, `target: 'es2020'`, Vitest bere `tests/unit/**/*.test.{js,ts}`.
- **`tsconfig.json`**: `strict`, `noEmit`. Typy se kontrolují jen v `src/logic`, `src/content`, `src/save` a `tests/unit`.
  Moduly v `.js` a server (`worker/`) kontroluje TypeScript jen tehdy, když je importuje unit test (proto má každý
  serverový modul vlastní unit test).
- **`playwright.config.js`**: jeden projekt `Pixel 7` (Chromium), `cs-CZ`, `Europe/Prague`, timeout 60 s, 1 opakování,
  4 souběžné prohlížeče v CI a 2 lokálně (Avast na Ondřejově počítači zadrhává víc spojení). Před testy se hra sestaví
  a spustí přes `npm run preview`.

---

## 3. Struktura kódu

| Složka | Zodpovědnost |
|---|---|
| `src/core/` | `state.js`: sdílený stav běžící hry `G = { R, TR, speechId }` (kolo, obtahování, pořadí promluv). `dom.js`: `$` a `REDUCED` (omezené animace) |
| `src/save/` | `schema.ts`: tvar uloženého stavu, výchozí hodnoty, `migrate()`, export a import textem. `save.ts`: načtení, uložení, aktivní profil |
| `src/logic/` | **čistá pravidla** v TypeScriptu: bez DOM, bez `localStorage`, náhoda jako parametr (`Rng`). Úkoly, zvládnutí, stupně, odměny, řada dní, dnešní úkol, kalendář, tabulka, online, upozornění, profily, QR, otisk, poklad, nástroje, procvičování, střídání pater |
| `src/content/` | **obsah jako data**: abeceda, slova, obrázky, tahy psaní, věty, očarování, hlášky a oblečení rodiny, zvířátka, nástroje, svátky, Mluvení, youtubeři, Adamův hráč |
| `src/game/` | `round.js`: běžící kolo (start, klepnutí, chyba, konec, pauza, odměny). `ctx.js`: kontext pro generátory a `updateStages()` |
| `src/levels/` | patra: `reading.js` (seznam `LEVELS`, slova, čtení), `math.js`, `writing.js` (obtahování prstem), `speech.js` (Mluvení), `practice.js` (Procvičit) |
| `src/world/` | scény a světy: dům, farma a obchod, stavění, vesnice, Nether, Přerov, mláďata, finále (End), rodina, převlékání, zvířátka, ranní karta, poklad, žebříček |
| `src/rewards/` | řada dní, očarování, kartičky |
| `src/gfx/` | pixelové textury, postava a krumpáče (`TIERS`, `OUTFIT`), nástroje |
| `src/audio/` | `sfx.js` (WebAudio), `speech.js` (hlas prohlížeče) |
| `src/ui/` | úvodní obrazovka (`screens.js`), nastavení a jeho karty, úvodní nastavení hráče (`setup.js`), QR, sdílení, ikony |
| `src/app/` | služby aplikace: verze a novinky, statistiky, tabulka Google, server (`cloud.js`), přestěhování, profily, upozornění, funkce zařízení, otisk, fotky, QR, hráč |
| `worker/` | server na Cloudflare: `index.ts` (API, cron), `logic.ts` a `push.ts` (čisté funkce), `migrations/` |
| `public/` | `version.json` (novinky), manifest, ikony, `sw.js` |

**Pravidla psaní kódu** (podrobně v `CLAUDE.md`):

- Obsah patří do `src/content/`, pravidla do `src/logic/`; ostatní složky jen volají logiku a kreslí.
- Moduly se navzájem importují v kruhu. Funkce volané z jiných modulů proto musí být `function` (vytáhne se na začátek),
  ne `const x = () =>` (při startu by ještě neexistovala).
- Každá nová funkce nebo oprava má test; oprava chyby začíná testem, který chybu ukáže.

### 3.1 Start hry (`src/main.js`)

1. Import `save/save.ts` načte seznam profilů a uložený stav aktivního profilu (už při importu).
2. Navázání tlačítek.
3. Příprava: `loadFamily()`, `applyLetters(save.letters, save.cursive)` (přepočítá písmena, slabiky, slova a psaní podle
   zapnutých písmen), ikony tlačítek, název a verze hry.
4. Jednorázové dopočty pro starší postup (obsidián, mláďata, kartičky, vesnice, nástroje), `checkEnchants()`.
5. `checkVersion()`, `initProfiles()`, `initDevice()`, `initPush()`, `persistStorage()`, `initShare()`.
6. `updateStages(); persist()`: zapíše stupně obtížnosti podle zvládnutých úloh (bez oznámení).
7. `moveIn()` / `moveOut()` (přestěhování z GitHub Pages), `flushSync()` a `syncCloud(true)` (co čeká na odeslání).
8. Posluchače: `online` (odeslat tabulku), `visibilitychange` (odchod z aplikace = pauza kola a odeslání, návrat =
   kontrola verze).
9. `renderHome()`, úvodní nastavení hráče (když ještě nikdo nehraje), QR odkaz `#kod=…`, ranní karta, zkratky `?go=…`,
   registrace service workeru (jen na https), `window.__adam` pro testy.

---

## 4. Herní pravidla

### 4.1 Patra

Seznam pater je `LEVELS` v `src/levels/reading.js`; Procvičit je `PRACTICE` v `src/levels/practice.js`, boj s drakem
`BOSS` v `src/world/finale.js`. Generátory úkolů jsou v `src/logic/tasks.ts` (moduly v `src/levels` je jen obalují).

| Patro | Klíč | Úkol | Stupně obtížnosti (`src/logic/stages.ts`) |
|---|---|---|---|
| Písmena | `letters` | hlas řekne písmeno, dítě klepne na kostku | A E I O U → + Á É Í Ó Ú → + Y Ý Ů → + zapnuté souhlásky |
| ↳ první hláska | `letters` | od 2. kola asi čtvrtina úkolů: „Na jaké písmeno začíná slovo…?“ (`genFirstSound`) | slova z otevřeného stupně |
| Slabiky | `syllables` | hlas řekne slabiku | MA ME MI MO MU → + L a S s krátkými samohláskami → všechny (dlouhé, Y, Ó, Ů) |
| Slova | `words` | hlas řekne slovo, na výběr nejpodobnější slova (Levenshtein) | do 3 písmen → do 4 → všechna |
| Čtení | `reading` | slovo na ceduli (hlas ho neřekne), dítě vybere obrázek | jednotné číslo → i množné (OSY, ÚLY, LAMY, MÍSY) |
| ↳ věty | `reading` | od 3. kola a stupně 1 asi 30 % úkolů: věta „EMA MÁ MÍSU.“, vybere se obrázek předmětu (`genSentence`) | jen přečtitelné věty |
| Čísla | `numbers` | hlas řekne číslo; chytáky: prohozené číslice (85 %), sousední desítka (60 %) | 0–9 → 0–19 → 0–49 → 0–99 |
| Počty | `math` | příklad napsaný i řečený | viz níže |
| Psaní | `writing` | obtahování prstem ve vymezené dráze (5 úkolů v kole) | 1–5, I, L, O, vlnka, cikcak, kopečky → vše kromě smyčky a spirály → vše |
| Mluvení | `speech` | sluch (které ze dvou hlásek slyší), vyslovit s rodičem, cvik pusy, foukání do mlýna | po jedné dvojici: R/L, S/Š, Z/Ž, C/Č, R/Ř |
| Procvičit | `practice` | 8 úloh z těch, se kterými má dítě potíže (`src/logic/practice.ts`) | otevře se od 3 slabých úloh |
| Ender drak | `boss` | 20 smíšených úkolů (Slabiky, Slova, Čtení, Čísla, Počty) | až při 100 % zvládnutých úkolů |

**Počty** (`genMath`, `genCompare`, `genMissing`; stupně podle počtu zvládnutých příkladů, ne podílu):

- začátek do 6; do 10 po 8 zvládnutých příkladech do 6 (`MATH_TO_10`);
- stupeň 1 (do 20 bez přechodu přes desítku) po 12 zvládnutých příkladech do 10 (`MATH_TO_20`), z toho aspoň 5 s čísly 7 až 10 (`MATH_7_10`);
- stupeň 2 po 10 zvládnutých příkladech ve druhé desítce bez přechodu (`CROSSING_READY`): pak přechod přes desítku
  u 30 % příkladů (`CROSSING_SHARE`), jinak 40 % celých desítek do 100;
- ve stupních 0 a 1 podle učebnice ALTER: 20 % „Porovnej“ (`<`, `=`, `>`) a 20 % „Doplň“ (`a + ? = s`), viz `docs/ucebnice-alter.md`.

**Psaní** (`src/levels/writing.js`): dráha široká 16 jednotek, tolerance 10, vyjetí od 11,5. Vyjetí = úkol už není bez chyby
a platí `penalize()`, hotové části tahu zůstávají. Volitelné psací písmo (`save.cursive`): e, i, u, ů, a, o vždy, l, t, p, m, n, j
když jsou zapnuté. Tahy jsou v `src/content/glyphs.ts` a `MORE_GLYPHS` v `src/content/alphabet.ts`.

**Mluvení** (`src/logic/speech.ts`, `src/levels/speech.js`): kolo je sluch, sluch, vyslovit, sluch, cvik nebo foukání
(střídá se), sluch, vyslovit, sluch. Hra výslovnost **nehodnotí** (dítě chodí na logopedii); vyslovení hodnotí rodič
tlačítky Povedlo se / Ještě ne / Bez rodiče. Do zvládnutí se počítá jen sluch. Foukání: mikrofon, hlasitost nad 0,12
po dobu 2 s, nebo tlačítko.

**Procvičit**: skóre slabé úlohy = 2 × chyby, +1 za opakovanou záměnu, +1,5 když trvá aspoň 1,6× déle než obvykle v patře.
Úloha nejvýš 2× za kolo a ne dvakrát po sobě; když slabých není 8, doplní se úlohy „učí se“. Psaní a Mluvení se neprocvičují.

### 4.2 Písmena zapnutá rodičem (`src/logic/letters.ts`, `src/content/alphabet.ts`)

- Samohlásky jsou vždy zapnuté, souhlásky (a Ě) zapíná rodič. Nový hráč začíná s M, L, S; Adamův starší postup dostal M, L, S, P.
- Pořadí jako ve slabikářích (`CONS_ORDER`): M L S P T J N V D Ě Z K R Ř B C Č Š Ž H CH F G Ď Ť Ň X W Q.
- `applyLetters()` přepíše obsahová pole na místě:
  - **písmena** = samohlásky, Ě a zapnuté souhlásky;
  - **slabiky** = souhláska × samohláska, bez Y po měkkých (J C Č Š Ž Ř Ď Ť Ň), bez I po tvrdých (H CH K R),
    DĚ, TĚ… jen se zapnutým Ě, bez slabik z Ě, W, Q, X;
  - **slova a obrázky** jen ze známých písmen (`wordFits`, CH jako jedno písmeno);
  - **psaní**: číslice, A E I O U Y, zapnuté souhlásky (kromě CH), psací písmo, 5 cviků.
- Stupně obtížnosti berou jen úlohy ze zapnutých písmen; když v stupni nic nezbude, použije se všechno zapnuté.

### 4.3 Kolo (`src/game/round.js`)

1. **Start** (`startRound`): 8 úkolů (Psaní 5, drak 20), obrazovka nezhasne (Wake Lock), úvodní věta, první úkol.
   Zadání zazní 250 ms po objevení kostek.
2. **Klepnutí** (`tapBlock`): správná kostka potřebuje 3, 2 nebo 1 úder podle krumpáče (`TIERS` v `src/gfx/player.js`).
3. **Chyba**: úkol už není bez chyby, krumpáč se zasekne na `max(1200, 2000 − 50 × Ochrana)` ms, po druhé chybě
   správná kostka zazáří, zadání se zopakuje s nápovědou. Chyba do 1,2 s od konce zadání = rychlý tip (`QUICK_WRONG_MS`).
4. **Smaragdy za chyby** (`errorCost` v `src/logic/rewards.ts`): první 2 chyby v kole zdarma (po druhé varování),
   každá další 1 smaragd, nejvýš 5 za kolo, nikdy pod nulu. Krátká vibrace (Android).
5. **Rozbitá kostka** (`breakBlock`): zápis výsledku, úkol bez chyby +1 smaragd (+1 s pravděpodobností 15 % × Štěstí),
   pochvala, další úkol.
6. **Povedené kolo** (`needClean`): bez chyby aspoň 4 / 5 / 6 z 8 (přísnost mírná / střední / přísná), v Psaní z 5 povolené
   2 / 1 / 0 chyby. Nepovedené kolo („Skoro!“) nic nepřidá ani nevezme; vykopané kostky jdou do zásoby na stavění.
7. **Pořadí odměn po povedeném kole**: +3 za kolo bez chyby → očarování, kartičky, vesnice → `save.total++` a počet kol patra →
   den v řadě (bonus, obsidián, mláďata, Přerov) → dnešní úkol a zvířátko → nové stupně obtížnosti → díl domu nebo farmy →
   krumpáč a nástroje → oblečení → mluvené shrnutí a střídání pater.
8. **Pauza** (`pauseRound`, `resumeRound`): zadání se schová, čas úlohy ani kola neběží; i při odchodu z aplikace.
9. **Odchod z kola** (`goHome`): zapíše se odchod (signál, že nebaví), vykopané kostky zůstanou.
10. **Střídání pater** (`src/logic/rotation.ts`): po 3 kolech stejného patra za sebou patro „odpočívá“ a konec kola nabídne
    patro nejdéle nehrané.

### 4.4 Zvládnutí a statistiky (`src/logic/mastery.ts`)

- Statistika úlohy (klíč `patro:úloha`): `ok`, `miss`, `n`, `bad`, doba `t` (klouzavý průměr, váha nejnovější 0,4, nejvýš 60 s),
  `tn`, rychlé tipy `qw`, záměny `conf`.
- Správně napoprvé: `ok + 1` a jedna stará chyba se odpustí; jinak `miss + 1`.
- **Zvládnutá** úloha (`mastery() === 'good'`): aspoň 3× správně a teď bez chyb. Potíže (`bad`): aspoň 2 chyby.
- Celkový pokrok `masteryPoints()`: součet všech pater z `MASTERY_SETS()`; Čísla = 0 až 20 a desítky + nejvýš 20 dalších čísel
  21 až 99, Počty nejvýš 30 příkladů. Z tohoto podílu se počítají očarování, vesnice, nástroje, vzácné věci a oči Enderu.
- Váha při výběru úkolu: `clamp(1 + 1,5 × chyby − 0,25 × správně, 0,5, 5)`; nedávné úkoly se vynechávají.
- Počet kostek na výběr (`choiceCount`): 2, od 2. povedeného kola patra 3, od 5. kola 4. Kola řídí jen tohle, obsah řídí stupně.

### 4.5 Odměny

Pravidlo: maximum má dítě až po zvládnutí všeho obsahu; s novým obsahem se přidávají i odměny (`CLAUDE.md`). Získané se
nikdy nebere, výjimkou jsou jen smaragdy za chyby.

| Odměna | Za co | Kód |
|---|---|---|
| Dům 12 dílů, pak zahrada | povedená kola | `src/world/house.js` |
| Farma 10 dílů (pes, ohrada, mrkev, studna, pšenice, kuřata, ovce, kráva, úl, strašák) | povedená kola 13 až 22 | `src/world/farm.js` |
| Krumpáče (dřevo 0, kámen 2, železo 5, diamant 9, netherit 20 kol) | povedená kola | `TIERS` v `src/gfx/player.js` |
| Oblečení s `at:` (brnění, chrániče, boty, helmy) | povedená kola; koruna za 7 dní v řadě, dračí hlava za draka | `OUTFIT` v `src/gfx/player.js` |
| Očarování (98 položek na 9 kusech výbavy) | podíl zvládnutých úkolů, položka i = `ceil((i+1)/98 × max)` | `src/content/enchants.ts`, `src/rewards/enchant.js` |
| Nástroje (meč, sekera, lopata, motyka × 6 materiálů) | podíl zvládnutých v patrech nástroje (0, 20, 40, 60, 80, 100 %) | `src/content/tools.ts`, `src/logic/tools.ts` |
| Vesnice (8 budov, jedna za patro, 8 fází) | podíl zvládnutých v patře; hotová budova +20 smaragdů | `src/world/village.js` |
| Kartičky | každé zvládnuté slovo (Slova nebo Čtení); celá sbírka +30 | `src/rewards/cards.js` |
| Řada dní, bonus až 10 smaragdů, totem | den s povedeným kolem | `src/logic/streak.ts`, `src/rewards/streak.js` |
| Obsidián, portál (10), 12 fází Netheru | každý den s povedeným kolem | `src/world/nether.js` |
| Mláďata (8) | týden se 4 odehranými dny | `src/world/babies.js` |
| Přerov (9 míst za 3 až 60 dní nejdelší řady) | nejdelší řada | `src/world/prerov.js` |
| Dnešní úkol +5, zvířátko za každý splněný úkol | ranní karta | `src/logic/daily.ts`, `src/logic/pets.ts` |
| Svátky (narozeniny a Štědrý den 20, Den dětí 10, ostatní 5) | jednou za rok | `src/logic/calendar.ts` |
| Oči Enderu (12), boj s drakem (+100, hlava, vejce) | podíl zvládnutých, boj při 100 % | `src/world/finale.js` |
| Poklad +3 (nejvýš 3 denně) | rodič potvrdí fotku věci na písmeno | `src/logic/hunt.ts` |
| Stavění (plocha 16 × 9) | každá vykopaná kostka; otevře se po domě | `src/logic/build.ts` |

**Obchod** (`src/world/farm.js`, první klepnutí vybere, druhé koupí): pamlsek 2, obojky 0 až 15, totem 20, ozdoby 6 až 25,
vzácné věci (lama 30 / 15 %, kůň 45 / 30 %, helikoptéra 70 / 50 %, zlatá věž 100 / 75 % zvládnutých). Převlékání rodiny:
33 kousků za 6 až 18, zlatá koruna 40 (25 %) a svatozář 30 (35 %).

### 4.6 Hráč, rodina, hlas

- **Hráč** (`src/logic/player.ts`, `src/app/player.js`): jméno, 5. pád, přivlastnění, rod, narozeniny, svátek, rodina,
  kamarádi, zvířátka, hlášky. Adam je vestavěný (`src/content/player-adam.ts`); nový hráč vzniká v úvodním nastavení
  (`src/ui/setup.js`). Export hráče textem s předponou `SCHOOLCRAFT-HRAC:`.
- **Rodina** (`src/world/family.js`, `src/logic/family.ts`, `src/content/family-lines.ts`): každý den fandí někdo jiný,
  osobní hlášky v 90 % případů, žádná hláška dvakrát v posledních 5, připomínky mámy (škola, jídlo, spaní, dlouhé hraní),
  ranní ptáče do 7:30. Podoby a hlášky jen odsouhlasené rodičem (pravidlo v `CLAUDE.md`).
- **Hlas** (`src/audio/speech.js`): `speechSynthesis`, český hlas (přednost Google a Zuzana), rychlost 0,85 (pomalu 0,62).
  Slabiky a slova přes `pronounce()` (`src/logic/pronounce.ts`): varianty `plain`, `split`, `letters`; výchozí „s písmeny“
  jen u SO a ME, rodič vybere variantu podle tabletu (`save.pron`).

---

## 5. Uložený stav

### 5.1 Tvar (`src/save/schema.ts`, `SaveState`)

| Skupina | Pole |
|---|---|
| nastavení rodiče | `caseMode` (velká, malá, obojí), `slow`, `strict`, `letters`, `cursive`, `pron` |
| pokrok | `total` (povedená kola), `rounds` (po patrech), `stats`, `log` (deník kol), `stages`, `practice` |
| odměny | `emeralds`, `ench`, `village`, `cards`, `obsidian`, `netherMine`, `weeks`, `babies`, `eyes`, `dragon`, `outfit`, `gear`, `build`, `decor`, `dog`, `dogName`, `famWear`, `famOwned` |
| dny | `streak`, `daily` (dnešní úkol, karta), `questLog`, `questsDone`, `gifts`, `hunt` |
| rodina a hlas | `notes`, `recentLines`, `momSaid`, `lastCheer`, `bday`, `player` |
| aplikace | `schema`, `seenVersion`, `gameName`, `sync` (tabulka Google), `cloud` (server) |

### 5.2 Verze schématu a převod

`SCHEMA = 12`. Každá změna tvaru = nové číslo, krok v `migrate()` a test se vzorkem starého stavu v `tests/fixtures/`.

| Schéma | Verze hry | Co přibylo |
|---|---|---|
| 1 | do 15 | vše bez čísla schématu |
| 2 | | číslo schématu, nejvyšší fáze vesnice |
| 3 | 27 | doba řešení a záměny, procvičování, fronta pro tabulku |
| 4 | 28 | převlékání rodiny |
| 5 | 39 | název a značka zařízení pro tabulku |
| 6 | 51 | ranní karta a dnešní úkol |
| 7 | 52 | stupně obtížnosti |
| 8 | 53 | hráč a písmena zapnutá rodičem |
| 9 | 56 | psací písmo |
| 10 | 57 | počet splněných dnešních úkolů |
| 11 | 59 | online (`cloud`), dny splněných úkolů |
| 12 | 70 | poklad (`hunt`) |

`migrate(raw)` začne výchozím stavem, přepíše ho uloženými daty a vnořené objekty (`NESTED`: rounds, outfit, dog, gifts, streak,
build, pron, momSaid, sync, famWear, daily, stages, cloud, hunt) sloučí s výchozími hodnotami. Opraví rozbitá pole na prázdná,
novější schéma nikdy nesníží. Před převodem starší verze i při nečitelných datech se původní text uloží jako záloha.

### 5.3 Klíče v zařízení

| Úložiště | Klíč | Obsah |
|---|---|---|
| localStorage | `adamuv-dul-v1` (Adam), `adamuv-dul-v1:<id>` | uložený postup profilu |
| localStorage | `adamuv-dul-zaloha[:<id>]` | záloha před mazáním, vložením, převodem, stažením |
| localStorage | `adamuv-dul-profily` | seznam profilů `{ active, list }` |
| localStorage | `schoolcraft-upozorneni` | upozornění na zařízení `{ on, hour, endpoint, rank }` |
| localStorage | `schoolcraft-otisk` | id přihlašovacích klíčů pro otisk `{ local, phone }` |
| localStorage | `schoolcraft-vibrace` | `on` / `off` |
| localStorage | `schoolcraft-presun` | přestěhování z GitHub Pages hotové (na staré adrese) |
| Cache Storage | `adamuv-dul-v1` | soubory hry pro offline |
| Cache Storage | `schoolcraft-upozorneni` → `/__upozorneni` | text ranního upozornění pro service worker |
| IndexedDB | `schoolcraft-fotky` (store `photos`) | fotky pokladů a obrázků po profilech (JPEG do 640 px) |

Údaje zařízení (upozornění, otisk, vibrace, tabulka Google) nepatří postupu: nepřenášejí se exportem, QR kódem ani kopií profilu.

### 5.4 Profily a přenos

- `src/logic/profiles.ts`: Adamův profil `adam` nejde smazat; jiné profily mají id `p…`. Přepnutí = nové načtení hry.
  Kopie profilu nepřebírá tabulku Google ani adresu upozornění a zkopírovaná kola znovu neposílá.
- Přenos textem: `exportText` (předpona `ADAMUV-DUL-POSTUP:`, base64, bez údajů o serveru), `importText` (snese i text
  zalomený nebo poškozený Messengerem, `src/logic/transfer.ts`).
- Přenos přes server kódem hráče `id.tajemstvi` nebo QR kódem s adresou `https://schoolcraft.games/#kod=…`
  (`src/logic/qr.ts`; kód je jen za `#`, na server ani do záznamů se nedostane).

---

## 6. Server (Cloudflare)

### 6.1 Konfigurace (`wrangler.jsonc`)

- Worker `schoolcraft`, vstup `worker/index.ts`, statické soubory z `dist/` (`ASSETS`), API má přednost (`/api/*`).
- Databáze D1 `schoolcraft` v EU (binding `DB`), migrace ve `worker/migrations/` (nasazený soubor se nikdy nemění, změna = nový soubor).
- Vlastní doména `schoolcraft.games`, cron `0 * * * *` (každou celou hodinu UTC), zapnuté záznamy (observability).

### 6.2 API

Přihlášení: `Authorization: Bearer <uuid>.<64 hex>`; v databázi je jen SHA-256 tajemství. Odpovědi JSON s `Cache-Control: no-store`,
CORS jen pro `ORIGINS` (`worker/logic.ts`).

| Metoda | Cesta | Přihlášení | Tělo | Odpověď |
|---|---|---|---|---|
| POST | `/api/players` | ne | `{ nick, public }` | `{ id, secret }` |
| PUT | `/api/me` | ano | `{ nick, public, week, weekPoints, summary, save }` (záloha do 1,5 mil. znaků) | `{ ok }`; může spustit upozornění na předběhnutí |
| GET | `/api/me/save` | ano | | `{ nick, save, updated }` |
| POST | `/api/events` | ano | `{ rows }` (nejvýš 300) | `{ ok, n }` |
| DELETE | `/api/me` | ano | | smaže hráče, statistiky i upozornění |
| GET | `/api/leaderboard` | volitelně | | `{ week, players: [{ nick, points, summary, me }] }` (nejvýš 100) |
| GET | `/api/push/key` | ne | | `{ key }` (veřejný klíč VAPID) |
| POST | `/api/push` | volitelně (propojí hráče) | `{ endpoint, keys, hour, rank }` | `{ ok }`; 503 při 5000 zařízeních |
| DELETE | `/api/push` | ne | `{ endpoint }` | `{ ok }` |
| POST | `/api/push/news` | ne | `{ endpoint }` | čekající text `{ title, body }` (do hodiny), jinak `{}` |

Bez přihlášení vrací chráněné cesty 401, neznámé 404, chyba serveru 500 `{ error: 'server' }`.

### 6.3 Databáze

| Tabulka | Migrace | Sloupce |
|---|---|---|
| `players` | 0001 | `id`, `secret_hash`, `nick`, `public`, `created`, `updated`, `week`, `week_points`, `summary` (JSON), `save` (JSON), `save_updated` |
| `events` | 0001 | `id`, `player_id`, `ts`, `kind`, `data` (řádky jako do tabulky Google) |
| `push_subs` | 0002, 0003 | `endpoint`, `p256dh`, `auth`, `hour`, `player_id`, `created`, `last_day`, `fails`, `rank`, `rank_day`, `news`, `news_t` |
| `config` | 0002 | `key`, `value` (klíč VAPID pod `vapid`) |

Do žebříčku jde jen přezdívka, postavička, týdenní body a co je postavené (`sanitizeSummary`); nikdy jméno rodiny, chyby ani statistiky.
Týdenní body (`weekPoints` v `src/logic/cloud.ts`): 1 za povedené kolo + 3 za splněný dnešní úkol, týden od pondělí.

### 6.4 Upozornění (web push)

- **Klíč**: server si klíč VAPID (ECDSA P-256) vytvoří při prvním použití a uloží do `config`; nikde jinde není.
- **Zpráva je prázdná** (bez šifrování obsahu), podepsaná JWT ES256 (`vapidAuth` v `worker/push.ts`, platnost 12 h,
  TTL 4 h). Posílá se jen na známé služby (Google, Mozilla, Apple, Microsoft; `validEndpoint`).
- **Ranní**: cron každou hodinu vybere zařízení s `hour` = aktuální hodina v Praze a `last_day` ≠ dnes, pošle zprávu,
  zapíše den; zrušená zařízení (404, 410) nebo 10 neúspěchů za sebou smaže.
- **Předběhnutí**: po `PUT /api/me` veřejného hráče, jehož body stouply, server najde hráče, které přeskočil (`overtaken`),
  a těm, kdo to chtějí (`rank = 1`), pošle zprávu jen mezi 8 a 19 h a nejvýš jednou denně (`rank_day`). Text uloží do `news`.
- **Zobrazení** (`public/sw.js`): service worker si po zprávě zkusí vyzvednout text z `POST /api/push/news`; když tam nic není,
  ukáže ranní text z mezipaměti (`/__upozorneni`, píše ho hra při startu podle hráče). Nastaví číslo na ikoně; klepnutí otevře hru.
- **Zařízení** (`src/app/push.js`): souhlas, `pushManager.subscribe` s veřejným klíčem, registrace na serveru; zkušební upozornění
  jde bez serveru (`showNotification`).

### 6.5 Přestěhování z GitHub Pages (`src/app/move.js`)

Na staré adrese `ondrej-kratochvil.github.io/adamuv-dul/` hra zaregistruje všechny profily na serveru a přesměruje na
`https://schoolcraft.games/#presun=…`. Nová adresa postupy stáhne (jen když tam ještě nic není) a uloží profily.

---

## 7. Funkce zařízení (PWA)

| Funkce | Kód | Poznámka |
|---|---|---|
| Offline | `public/sw.js` | nejdřív síť, bez sítě mezipaměť; `version.json` nikdy z mezipaměti |
| Aktualizace a novinky | `src/app/name.js`, `public/version.json` | při startu a návratu do hry; novinky čte hlas |
| Trvalé úložiště | `src/app/device.js` `persistStorage` | stav na kartě Postup |
| Obrazovka nezhasne | `keepAwake` | v kole, pustí se při konci, odchodu a pauze |
| Vibrace | `buzz` | při chybě a po povedeném kole (jen Android), vypínač |
| Číslo na ikoně | `setBadge` | dokud čeká dnešní úkol |
| Sdílení obrázku | `shareCanvas`, `src/ui/share.js` | dům, farma, Přerov, Nether; bez Web Share stažení |
| Zkratky na ikoně | manifest `shortcuts`, `src/logic/shortcut.ts` | `?go=ukol`, `?go=procvicit` |
| Otisk prstu | `src/logic/passkey.ts`, `src/app/passkey.js` | WebAuthn: na zařízení (`platform`) a telefonem přes QR (`hybrid`); ověřuje se výzva, typ a příznak UV |
| QR kód hráče | `src/app/qr.js`, `src/ui/qr-ui.js` | kreslí `qrcode-generator`, čte `BarcodeDetector` nebo `jsqr` |
| Fotky (Poklad) | `src/app/photos.js` | IndexedDB, po profilech, nikdy na server |

Záměrně nepoužité: rozpoznávání řeči (dítě chodí na logopedii, hra by mu křivdila) a poloha (Ondřej 31. 10. 2026).

---

## 8. Statistiky do tabulky Google

- Fronta v uloženém stavu (`src/logic/sync.ts`): řádky s ID (`[uid-]čas-pořadí`), nejvýš 5000, odesílání po 300.
- Druhy řádků: **kolo** (patro, bez chyby, úloh, hotovo, povedené, odešel, sekundy, pauzy, ztracené smaragdy),
  **úloha** (patro, úloha, napoprvé, sekundy, záměny, tipy, kolo), **hodnocení** (patro, hodnocení 1 až 10).
  Každý řádek má i čas, zařízení a u jiného profilu sloupec Profil.
- Skript `docs/google-tabulka.gs` rozdělí řádky do listů Kola, Úlohy, Hodnocení, duplicity podle ID přeskočí a přepisuje
  list „Stav <zařízení>“. Adresa skriptu je jen v nastavení (repo je veřejné). Návod: [`google-tabulka.md`](google-tabulka.md).
- Stejné řádky jdou i na server (`POST /api/events`), když je zapnuté online.

---

## 9. Testy

- **Unit** (`tests/unit/`, 34 souborů): pravidla, obsah a invarianty odměn, uložený stav a převody, generátory úkolů
  (tisíce náhodných úkolů v každém stupni), server (`worker.test.ts`, `push.test.ts`), QR, otisk, poklad.
- **Prohlížeč** (`tests/e2e/`, 31 souborů): kola všech pater, uložení a staré postupy, řada dní, rozložení na mobilu, tabletu
  a počítači, nastavení, online a žebříček, upozornění, otisk, QR, poklad, funkce zařízení.
- **Pomůcky** (`tests/e2e/helpers.js`): `openGame(page, stav)` (nasadí stav, zablokuje písma z Googlu i server,
  hlas nahradí záznamem do `window.__said`), `openSettings(page, karta)` (spočítá příklad), `playRound(page, patro)`
  (dohraje kolo, umí i chyby, obtahování a Mluvení), `saved(page)`.
- **Napodobená zařízení**: otisk (WebAuthn), fotoaparát a `BarcodeDetector`, service worker a souhlas s upozorněními,
  Wake Lock, vibrace, sdílení se v testech napodobují init skriptem přímo v souboru testu.
- **Datum**: `page.clock.setFixedTime(...)`. Vzorky starých postupů: `tests/fixtures/`.
- Server lokálně: `npx wrangler d1 migrations apply schoolcraft --local` a `npx wrangler dev --local`
  (`--test-scheduled` a `/__scheduled` spustí cron).

---

## 10. Nasazení a provoz

1. Push na `main` spustí `.github/workflows/test-a-nasazeni.yml` (změny jen v `docs/` a `*.md` testy ani nasazení nespouští).
2. Úloha `test`: typy, unit testy, Playwright, sestavení.
3. Při zelených testech: `deploy` (GitHub Pages, stará adresa jen přestěhuje postup) a `cloudflare`
   (`wrangler d1 migrations apply --remote` a `wrangler deploy`).
4. Tajné proměnné repozitáře: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. Bez nich se Cloudflare přeskočí s varováním.
5. Kontrola po nasazení: `https://schoolcraft.games/version.json` (číslo verze), `GET /api/push/key` (server a databáze).
6. Každá úprava hry zvýší `APP_VERSION` v `src/app/version.js` a přidá do `public/version.json` záznam se stejným číslem
   (1 až 3 věty pro dítě); test `verze.test.ts` to hlídá.

---

## 11. Jak na typické úpravy

**Nové slovo nebo obrázek**: přidat do `src/content/words.ts` / `src/content/alphabet.ts` (`MORE_WORDS`) nebo
`src/content/pictures.ts`; stupně a kartičky se přepočítají samy, zobrazí se jen se zapnutými písmeny.

**Nové patro**:
1. obsah do `src/content/`, generátor do `src/logic/tasks.ts` (nebo vlastní logický modul), test v `tests/unit/`;
2. záznam v `LEVELS` (`src/levels/reading.js`) a modul v `src/levels/`;
3. položky do `MASTERY_SETS()`, stupně do `STAGES`, budova do `BUILDINGS`, patro k nástroji v `src/content/tools.ts`;
4. přidat odměny, aby krok mezi očarováními zůstal zhruba 2 až 3 zvládnuté úkoly;
5. kolo patra v `tests/e2e/zaklad.spec.js` a pomůcka `playRound`.

**Změna uloženého stavu**: nové číslo `SCHEMA`, pole v `defaults()` (případně do `NESTED`), krok v `migrate()`,
vzorek starého stavu v `tests/fixtures/` a test v `tests/unit/save.test.ts`. Nic získaného se nesmí ztratit.

**Nová serverová funkce**: čistá logika do `worker/logic.ts` nebo vlastního modulu s unit testem; změna databáze jen
novým souborem ve `worker/migrations/`; vyzkoušet lokálně přes `wrangler dev --local`.

**Nový text pro dítě**: musí jít přečíst nahlas; tlačítko pro dítě má ikonu (`setBtn`); když text odkazuje na tlačítko,
popsat ho obrázkem, barvou a nápisem. Nové hlášky rodiny nejdřív schválí rodič.

---

## 12. Známé nesrovnalosti (k opravě)

- Komentář nad `genNumbers` v `src/logic/tasks.ts` ještě popisuje rozsah čísel podle počtu kol; platí stupně (oddíl 4.1).
