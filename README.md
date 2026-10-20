# Adamův důl

Výuková hra ve stylu Minecraftu pro Adama (1. třída, *2020): čtení, psaní a počty. Adam kope do kostek se správnou
odpovědí a za pokrok staví svůj svět. Hra je projekt ve Vite (ES moduly, herní pravidla v TypeScriptu) sestavený na GitHub Pages
(https://ondrej-kratochvil.github.io/adamuv-dul/), postup se ukládá v `localStorage` tabletu.
Pravidla pro úpravy jsou v [`CLAUDE.md`](CLAUDE.md), rodinný kontext v `osobni/deti.md` (sekce „Čtecí hra Adamův důl“).

## Struktura

| Kde | Co tam je |
|---|---|
| `index.html` | kostra stránky (obrazovky a dialogy), skript `src/main.js` |
| `src/content/` | **obsah jako data** (TypeScript): písmena a slabiky, slova, obrázky ke čtení, tahy psaní, očarování |
| `src/logic/` | **herní pravidla bez obrazovky** (TypeScript, testovaná): kalendář a svátky, řada dní, zvládnutí, generátory úkolů, odměny, stavění, náhoda |
| `src/save/` | uložený postup: tvar dat a výchozí hodnoty (`schema.ts`, číslo `SCHEMA`, `migrate()`), načtení se zálohou (`save.ts`), export a import |
| `src/game/` | běžící kolo (`round.js`), kontext pro generátory (`ctx.js`) |
| `src/levels/` | patra: seznam `LEVELS` a pomůcky (`reading.js`), čísla a počty, psaní prstem (obtahování) |
| `src/world/` | dům, farma a obchod, vesnice, Nether, Přerov, mláďata, finále (End), rodina, stavění |
| `src/rewards/` | řada dní, očarování, kartičky |
| `src/gfx/`, `src/audio/`, `src/ui/`, `src/app/` | pixelové textury a postava, hlas a zvuky, obrazovky a nastavení, verze, název, statistiky |
| `src/core/state.js` | sdílený stav běžící hry `G` (kolo `R`, obtahování `TR`, pořadí promluvy `speechId`) |
| `public/` | `version.json` (novinky pro Adama), manifest, ikony, `sw.js` (offline) |
| `tests/unit/` | Vitest: pravidla, obsah a odměny (invarianty), uložený stav, verze |
| `tests/e2e/` | Playwright: hra v prohlížeči (kola všech pater, uložení, řada dní, rozložení, opravy z review, stavění) |
| `docs/koncepce.md` | proč a jak vznikla tahle struktura |
| `.github/workflows/` | testy při každém pushi; nasazení na Pages jen z `main` a jen při zelených testech |

## Patra (úkoly)

| Patro | Klíč | Obsah | Postup obtížnosti |
|---|---|---|---|
| Písmena | `letters` | A Á E É I Í O Ó U Ú Ů Y Ý M L S, slyší a najde | 2 až 4 kostky podle odehraných kol |
| Slabiky | `syllables` | M/L/S + samohlásky (30) | totéž; I/Y a Ú/Ů nikdy spolu (znějí stejně) |
| Slova | `words` | 32 slov ze známých písmen (`WORDS`), distraktory podle Levenshteina | do 3 písmen, po 3 kolech do 4, po 6 vše |
| Čtení | `reading` | slovo na ceduli, vybere obrázek (`PIC`, 12 + množné č. OSY, ÚLY, LAMY, MÍSY) | množné číslo po 3 kolech |
| Čísla | `numbers` | slyší číslo, najde ho | do 10, po 3 kolech do 20, po 7 do 100 |
| Počty | `math` | sčítání a odčítání | do 10, do 20, pak i desítky do 100 |
| Psaní | `writing` | jízda prstem ve vymezené dráze: číslice, tiskací písmena, cviky (vlnka, cikcak, kopečky, smyčka, spirála) | nejdřív 1–5, I, L, O, vlnka, cikcak, kopečky, od 3. kola vše ostatní; smyčka a spirála od 8. povedeného kola |

Kolo = 8 úkolů (psaní 5). Kolo se počítá, když je dost úkolů bez chyby (přísnost 4/5/6 z 8, v psaní 3/4/5 z 5; `needClean()` v `logic/rewards.ts`).
Za chybu se krumpáč zasekne (2 s, Ochrana zkracuje až na 1,2 s), v psaní vyjetí z dráhy = tah znovu.

## Odměny a jejich vazba

| Odměna | Za co | Kde v kódu |
|---|---|---|
| Dům (12 dílů), farma (10 dílů, první je pes), krumpáče, oblečení `at:` | povedená kola (`save.total`) | `houseCells`, `drawFarm`, `TIERS`, `OUTFIT` |
| Smaragdy | úkol bez chyby +1, kolo bez chyby +3, první kolo dne + délka řady (max 10), Štěstí | `breakBlock`, `endRound`, `registerDay` |
| Obchod | obojky, pamlsek, ozdoby farmy (i tank a vojáček), totem (chrání řadu); vzácné věci (lama, kůň, helikoptéra, zlatá věž) navíc za 15–75 % zvládnutých úkolů | `renderShop`, `shopTap`, `DECOR`, `RARE` |
| Řada dní, koruna (7 dní) | den s povedeným kolem | `registerDay`, `streakNow` |
| Obsidián, portál do Netheru, 12 fází Netheru, kopání v Netheru | každý odehraný den | `drawNether`, `NETHER_STAGES`, `mineTex` |
| Mláďata na farmě (8) | týden s aspoň 4 dny | `BABIES`, `weekKey` |
| Přerov z kostek (9 míst) | nejdelší řada 3–60 dní | `PREROV`, `drawPrerov` |
| Očarování (61 úrovní na 5 kusech výbavy) | podíl zvládnutých úkolů | `ENCHANTS`, `ENCH_ORDER`, `checkEnchants` |
| Vesnice (7 budov, každé patro jedna) | zvládnuté úkoly daného patra; kreslí se nejvyšší dosažená fáze (nikdy nespadne) | `BUILDINGS`, `checkVillage`, `buildingStage` |
| Stavění (plocha 16 × 9) | každá vykopaná kostka jde do zásoby; otevře se po dostavěném domě | `logic/build.ts`, `world/build.js` |
| Sbírka kartiček (32) | zvládnutá slova | `cardWords`, `checkCards` |
| Oči Enderu (12), portál do Endu, boj s Ender drakem | podíl zvládnutých úkolů; boj až při 100 % | `eyesHave`, `genBoss`, `bossVictory` |

Zvládnutý úkol = `mastery() === 'good'` (aspoň 3× správně a poslední dobou bez chyby); body `masteryPoints()` v `logic/mastery.ts`
z `MASTERY_SETS()` + max. 30 příkladů + max. 20 čísel 21 až 99 mimo desítky. Teď 197 úkolů celkem.

## Statistiky a procvičování

- Ve Statistikách (Pro rodiče) u každého patra: zvládnuté úlohy, nad čím Adam nejdéle přemýšlí, co si s čím plete, podíl rychlých tipů;
  nahoře „Co procvičit“. Pod každou dlaždicí patra na úvodní obrazovce pruh „zvládnuto x z y“ (`levelProgress`).
- Dlaždice **Procvičit** skládá kolo ze slabých úloh (`logic/practice.ts`).
- Výsledky mohou samy chodit do tabulky Google: [docs/google-tabulka.md](docs/google-tabulka.md).

## Personalizace

- Rodina (`FAMILY`): máma Pája, táta Ondra, babička Jindra, děda Bob, babička Iva, děda Marek, brácha Davídek. Barvy vlasů
  podle Ondřeje (19. 10. 2026), děda Marek téměř holohlavý; nic dalšího nedomýšlet. Chválí, povzbuzují, „dnes ti fandí“.
- Další příbuzní (Ondřej 20. 10. 2026, podoba podle jeho odpovědí a fotek, fotky v repu nejsou): strejda Vašek, teta Terka
  a bratranec Víťa (rodina Pájina bratra; Víťa je stejně starý a kamarádsky popichuje), praděda Ruda (Ivin táta), Šárka
  (Markova žena) a její syn Tomáš (18). Hlášky v `docs/hlasky-navrh-2.md` (odsouhlaseno).
  Prababička Marcelka (Markova máma) od verze 30, hlášky odsouhlaseny (`docs/hlasky-navrh-3.md`).
- Dlaždice **Rodina**: převlékání portrétů za smaragdy (`content/family-wear.ts`, `world/dressup.js`).
- Vzkazy od rodiny i od kamarádů Toma a Médi (nastavení; kamarádi bez podoby, jen obálka), jméno a barvu psa vybírá Adam,
  název hry volí Adam (`GAME_NAMES`).
- Nastavení pro rodiče se otevře jen po vyřešení příkladu pro dospělého (násobení, `logic/gate.ts`); přenos postupu na jiný tablet (zkopírovat, vložit).
- České svátky s dárkem (`holiday()`), roční období ve scénách (`season()`), kimono na karate.
- Statistiky pro rodiče a hodnocení kola 1–10 (`renderStats`, `logRound`, `renderRate`), kopírování přehledu.

## Hlas

`speechSynthesis` prohlížeče, čeština (`loadVoices` volí lokální český hlas). Slabiky a slova přes `pronounce()`:
rizikové slabiky (so, me, my…) výchozí „s písmeny“ („so, es, o“), rodič v nastavení zvolí variantu podle tabletu. Samotná dlouhá písmena posílat bez slova „dlouhé“ (hlas ho říká sám).
Prohlížeč pustí hlas až po prvním doteku (novinky čekají na první klepnutí). „Slabika so.“ anglickou výslovnost
nespravilo (Ondřej 19. 10. 2026), varianta „rozděleně“ (neviditelné dělítko) je pokus, ověří se jen na tabletu.

## Vývoj a testování

```
npm install                  # jednou
npx playwright install chromium
npm run dev                  # hra na http://localhost:5173 s okamžitým překreslením
npm test                     # typy + unit testy + testy v prohlížeči (vše musí projít)
npm run test:unit            # jen pravidla (sekundy)
```

- Testy v prohlížeči běží proti sestavené hře (`npm run build` + `vite preview` na 127.0.0.1:4173), hlas je nahrazený
  náhražkou (`window.__said`), písma z Google se nestahují. Hra vystavuje `window.__adam` (běžící kolo a uložený stav).
- Lokálně běží nejvýš 2 prohlížeče: Avast na Ondřejově počítači zadrhává víc souběžných spojení na 127.0.0.1.
- Datum v testech: `page.clock.setFixedTime(...)`. Vzorky uloženého stavu: `tests/fixtures/`.

## Nápady na další rozvoj

- Nová písmena podle školy (P, T, J, N…): nová slova, kartičky, slova se jmény rodiny (TÁTA, BOB, IVA…).
- Z review 19. 10. 2026 zatím neudělané: kratší řeč po kole, slabiky s Ú a Ů, jména psa podle čtení, máma u slova MÁMA blond,
  účinek Efektivity, vyjetí z dráhy vrátí prst jen kousek.
- Až Adam vybere název natrvalo, přepsat i `manifest.webmanifest` (ikona na ploše má pevný název).
- Až dojdou fáze Netheru, mláďata nebo místa v Přerově, přidat další (pravidlo v `CLAUDE.md`).
