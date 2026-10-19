# Adamův důl

Výuková hra ve stylu Minecraftu pro Adama (1. třída, *2020): čtení, psaní a počty. Adam kope do kostek se správnou
odpovědí a za pokrok staví svůj svět. Hra je jeden soubor `index.html` na GitHub Pages
(https://ondrej-kratochvil.github.io/adamuv-dul/), postup se ukládá v `localStorage` tabletu.
Pravidla pro úpravy jsou v [`CLAUDE.md`](CLAUDE.md), rodinný kontext v `osobni/deti.md` (sekce „Čtecí hra Adamův důl“).

## Soubory

| Soubor | Co to je |
|---|---|
| `index.html` | celá hra (HTML, CSS, JS v jednom; sekce JS oddělené komentáři `/* ---------- název ---------- */`) |
| `version.json` | číslo verze a novinky pro Adama; hra podle něj nabízí aktualizaci a novinky čte nahlas |
| `manifest.webmanifest`, `icon-*.png`, `apple-touch-icon.png` | instalace na plochu (PWA) |
| `sw.js` | service worker: nejdřív síť, bez internetu poslední verze; `version.json` nikdy z mezipaměti |
| `CLAUDE.md` | závazná pravidla (odměny, verze, ikony, hlas, rodina, testování) |

## Patra (úkoly)

| Patro | Klíč | Obsah | Postup obtížnosti |
|---|---|---|---|
| Písmena | `letters` | A Á E É I Í O Ó U Ú Ů Y Ý M L S, slyší a najde | 2 až 4 kostky podle odehraných kol |
| Slabiky | `syllables` | M/L/S + samohlásky (30) | totéž; I/Y a Ú/Ů nikdy spolu (znějí stejně) |
| Slova | `words` | 32 slov ze známých písmen (`WORDS`), distraktory podle Levenshteina | do 3 písmen, po 3 kolech do 4, po 6 vše |
| Čtení | `reading` | slovo na ceduli, vybere obrázek (`PIC`, 12 + množné č. OSY, ÚLY, LAMY, MÍSY) | množné číslo po 3 kolech |
| Čísla | `numbers` | slyší číslo, najde ho | do 10, po 3 kolech do 20, po 7 do 100 |
| Počty | `math` | sčítání a odčítání | do 10, do 20, pak i desítky do 100 |
| Psaní | `writing` | jízda prstem ve vymezené dráze: číslice, tiskací písmena, cviky (vlnka, cikcak, kopečky, smyčka, spirála) | nejdřív 1–5, I, L, O a cviky |

Kolo = 8 úkolů (psaní 5). Kolo se počítá, když je dost úkolů bez chyby (přísnost 4/5/6 z 8 v nastavení, `NEED_CLEAN`).
Za chybu se krumpáč zasekne (2 s, Ochrana zkracuje až na 1,2 s), v psaní vyjetí z dráhy = tah znovu.

## Odměny a jejich vazba

| Odměna | Za co | Kde v kódu |
|---|---|---|
| Dům (12 dílů), farma (10 dílů, první je pes), krumpáče, oblečení `at:` | povedená kola (`save.total`) | `houseCells`, `drawFarm`, `TIERS`, `OUTFIT` |
| Smaragdy | úkol bez chyby +1, kolo bez chyby +3, první kolo dne + délka řady (max 10), Štěstí | `breakBlock`, `endRound`, `registerDay` |
| Obchod | obojky, pamlsek, ozdoby farmy, totem (chrání řadu) | `renderShop`, `shopTap` |
| Řada dní, koruna (7 dní) | den s povedeným kolem | `registerDay`, `streakNow` |
| Obsidián, portál do Netheru, 12 fází Netheru, kopání v Netheru | každý odehraný den | `drawNether`, `NETHER_STAGES`, `mineTex` |
| Mláďata na farmě (8) | týden s aspoň 4 dny | `BABIES`, `weekKey` |
| Přerov z kostek (9 míst) | nejdelší řada 3–60 dní | `PREROV`, `drawPrerov` |
| Očarování (61 úrovní na 5 kusech výbavy) | podíl zvládnutých úkolů | `ENCHANTS`, `ENCH_ORDER`, `checkEnchants` |
| Vesnice (7 budov, každé patro jedna) | zvládnuté úkoly daného patra | `BUILDINGS`, `checkVillage` |
| Sbírka kartiček (32) | zvládnutá slova | `cardWords`, `checkCards` |
| Oči Enderu (12), portál do Endu, boj s Ender drakem | podíl zvládnutých úkolů; boj až při 100 % | `eyesHave`, `genBoss`, `bossVictory` |

Zvládnutý úkol = `mastery() === 'good'` (aspoň 3× správně a poslední dobou bez chyby); body `masteryPoints()`
z `MASTERY_SETS()` + max. 30 příkladů. Teď 177 úkolů celkem.

## Personalizace

- Rodina (`FAMILY`): máma Pája, táta Ondra, babička Jindra, děda Bob, babička Iva, děda Marek, brácha Davídek. Barvy vlasů
  podle Ondřeje (19. 10. 2026), děda Marek téměř holohlavý; nic dalšího nedomýšlet. Chválí, povzbuzují, „dnes ti fandí“.
- Vzkazy od rodiny (nastavení), jméno a barvu psa vybírá Adam, název hry volí Adam (`GAME_NAMES`, s čísly).
- České svátky s dárkem (`holiday()`), roční období ve scénách (`season()`), kimono na karate.
- Statistiky pro rodiče a hodnocení kola 1–10 (`renderStats`, `logRound`, `renderRate`), kopírování přehledu.

## Hlas

`speechSynthesis` prohlížeče, čeština (`loadVoices` volí lokální český hlas). Slabiky a slova ve větě (`inCzech`:
„Slabika me.“), jinak je český hlas čte anglicky. Samotná dlouhá písmena posílat bez slova „dlouhé“ (hlas ho říká sám).
Prohlížeč pustí hlas až po prvním doteku (novinky čekají na první klepnutí). **Neověřeno na tabletu:** zda „Slabika me.“
opravilo anglickou výslovnost me/so (hlášeno Ondřejem 19. 10. 2026).

## Testování

Playwright s Chromiem v `/opt/pw-browsers/chromium`. Postup, který se osvědčil:

1. Kopie `index.html` do scratchpadu s háčkem: `sed 's/^let R = null; \/\/ běžící kolo$/let R = null; window.__R = () => R;/'`.
2. Stav nastavit přes `localStorage.setItem('adamuv-dul-v1', JSON.stringify({...}))` a `reload`.
3. Kolo dohrát klikáním na správnou kostku: `r.els[r.choices.indexOf(r.target)].click()` (když `!r.busy && !r.stuck`).
4. Hlas mockovat přes `addInitScript` (`SpeechSynthesis.prototype.speak = u => …`); bez `onend` čeká hra na záložní časovač.
5. Datum přes `context.clock.setFixedTime(...)`; `fetch('version.json')` jen přes `python3 -m http.server`, ne `file://`.

## Nápady na další rozvoj

- Nová písmena podle školy (P, T, J, N…): nová slova, kartičky, slova se jmény rodiny (TÁTA, BOB, IVA…).
- Až Adam vybere název natrvalo, přepsat i `manifest.webmanifest` (ikona na ploše má pevný název).
- Až dojdou fáze Netheru, mláďata nebo místa v Přerově, přidat další (pravidlo v `CLAUDE.md`).
