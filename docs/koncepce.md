# Koncepce: robustnější stavba hry a testy

> **Co:** návrh, jak hru převést z jednoho souboru na strukturovaný projekt s automatickými testy, aby šla dál bezpečně rozvíjet
> **Stav:** hotovo (19. 10. 2026, Ondřej schválil celý převod: TypeScript postupně, nasazení přes Actions, export a import)
> **Stav k:** 19. 10. 2026 (hra verze 15, `index.html` 2 938 řádků, 216 kB)
> **Souhrn:**
> - Dnes: jeden soubor bez testů, ověřování ručně a jednorázově, testovací skripty se nikde neukládají.
> - Cíl: moduly + čistá herní logika oddělená od zobrazení + dvě vrstvy testů + nasazení přes GitHub Actions jen při zelených testech.
> - Nástroje: Vite (sestavení), TypeScript postupně, Vitest (logika), Playwright (prohlížeč).
> - Adamovi se nic nezmění: stejná adresa, stejný uložený postup, hra dál funguje offline.
> - Přechod po krocích, první krok jsou testy proti dnešní hře, aby převod nic nerozbil.
> **Souvisí:** `CLAUDE.md` (pravidla hry), `README.md` (přehled), `osobni/deti.md` (sekce Čtecí hra)

## Proč měnit

Hra má 30 vzájemně provázaných částí (7 pater, dům, farma, vesnice, očarování, Nether, Přerov, mláďata, kartičky, drak, řada dní, rodina, statistiky). Rizika dnešního stavu:

1. **Regrese bez povšimnutí.** Úprava odměn nebo řady dní může rozbít jinou část a nikdo to nezjistí, dokud to nenahlásí Adam.
2. **Ztráta postupu.** Uložený stav (`localStorage`, klíč `adamuv-dul-v1`) se rozšiřuje bez verze schématu. Chyba v načítání může Adamovi smazat dům a smaragdy. To je nejhorší možná chyba hry.
3. **Rovnováha odměn se hlídá ručně.** Pravidlo „maximum až po zvládnutí všeho“ je jen text v `CLAUDE.md`, nic ho neověřuje.
4. **Jeden soubor 216 kB** se špatně čte, porovnává v gitu a upravuje po částech; roste s každou funkcí.
5. **Testování je vázané na cloudové prostředí** (`/opt/pw-browsers/chromium`), na Ondřejově počítači nejde spustit.

## Cílová podoba

### Struktura projektu

```
adamuv-dul/
  index.html              jen kostra stránky
  src/
    main.ts               start hry
    save/                 načtení, uložení, migrace mezi verzemi schématu
    content/              DATA: písmena, slabiky, slova, obrázky, tahy psaní, rodina, svátky, budovy, očarování
    logic/                ČISTÁ LOGIKA bez DOM: generátory úkolů, zvládnutí, odměny, řada dní, kalendář, svátky
    ui/                   obrazovky (domů, kolo, šatník, farma, vesnice, …), kreslení pixelů, zvuk, hlas
  tests/
    unit/                 Vitest: logika a data
    e2e/                  Playwright: hra v prohlížeči
  public/                 ikony, manifest, version.json
  .github/workflows/      test + nasazení
```

Klíčové pravidlo: **logika nesahá na obrazovku ani na `localStorage`**. Dostane stav a vrátí nový stav nebo výsledek. Díky tomu jde otestovat tisíckrát za sekundu bez prohlížeče, a hlavně se dá přesně říct, co která změna ovlivní.

### Obsah jako data

Patra, slova, odměny a jejich prahy budou deklarativní seznamy v `src/content/`. Přidat nové písmeno, slovo nebo budovu = upravit data, ne kód. Testy pak automaticky zkontrolují, že nový obsah nerozbil pravidla (viz invarianty níž).

### Uložený postup

- Stav dostane **číslo verze schématu** a řadu migrací `v1 → v2 → …`. Každá migrace má test se skutečným vzorkem starého stavu.
- Před každou migrací se původní stav uloží jako záloha (`adamuv-dul-backup`), aby šel obnovit.
- V nastavení pro rodiče přibude **export a import postupu** (text ke zkopírování). Řeší i přechod na nový tablet, což dnes nejde.
- Stejná adresa a stejný klíč v `localStorage`: Adam o nic nepřijde.

## Testy

| Vrstva | Nástroj | Co hlídá | Kolik času |
|---|---|---|---|
| Logika | Vitest | generátory (stovky úkolů na patro: správná odpověď vždy mezi možnostmi, nic dvakrát, nic záporného), zvládnutí, řada dní a totem přes přelom měsíce a roku, Velikonoce, svátky, prahy odměn | sekundy |
| Invarianty obsahu | Vitest | **strop odměn:** se vším zvládnutým má Adam vše, s čímkoli nezvládnutým ne vše; žádná odměna se nikdy nebere; každé slovo jen z písmen, která Adam zná; každé tlačítko pro Adama má ikonu; `version.json` odpovídá `APP_VERSION` | sekundy |
| Uložený stav | Vitest | migrace všech starších schémat, poškozená nebo prázdná data nesmažou postup | sekundy |
| Prohlížeč | Playwright | hra se načte bez chyb; kolo každého patra (správně → počítá se, s chybami → nepočítá); konec kola, šatník, obchod, vesnice; aktualizace a novinky; hlas mockovaný | do minuty |
| Rozložení | Playwright | mobil a tablet na výšku i na šířku: nic nepřetéká, tlačítka na konci kola vidět | do minuty |

**Charakterizační testy jako první.** Před převodem se napíšou Playwright testy proti dnešnímu `index.html`. Ty pak musí projít i po každém kroku převodu. Tím se dokáže, že převod chování nezměnil.

Testy půjde spustit u Ondřeje na Windows (`npm test`) i v cloudu; Playwright si Chromium stáhne sám.

## Nasazení

- GitHub Actions: při pushi na `main` spustí všechny testy, sestaví hru a **teprve při zelených testech** ji nasadí na GitHub Pages (Pages přepnout ze „Deploy from a branch“ na „GitHub Actions“).
- Pull requesty dostanou stejné testy, takže se dá úprava zkontrolovat ještě před nasazením.
- `APP_VERSION` a záznam ve `version.json` se ověřují testem; zapomenutá verze = červený test.
- Service worker generuje sestavení (seznam souborů pro offline se nedrží ručně).

## Co nedoporučuju

- **Herní engine (Phaser apod.):** hra je převážně tlačítka, panely a obrázky z pixelů, ne fyzika a animovaná scéna. Engine by přidal složitost a velikost bez užitku.
- **React nebo jiný framework hned:** obrazovky jsou jednoduché; přechod by byl přepis místo převodu. Může přijít později pro složitější obrazovky (Preact, 4 kB), až to bude dávat smysl.
- **Jen testy nad jedním souborem:** pomohlo by to proti regresím, ale ne proti rostoucí nepřehlednosti a logiku by šlo testovat jen přes prohlížeč (pomalu, křehce).

## Postup převodu

Každý krok je samostatně nasaditelný a Adam mezi kroky normálně hraje.

1. **Záchranná síť:** Playwright testy proti dnešnímu `index.html` + GitHub Actions (zatím jen test, nasazení beze změny). Uložit vzorky skutečného stavu jako testovací data.
2. **Vite bez změn kódu:** stejný kód, jen sestavení a nasazení přes Actions. Testy z kroku 1 musí projít.
3. **Rozdělení do modulů** podle dnešních 30 oddílů, nejdřív `content/` a `save/` (s verzí schématu a zálohou).
4. **Vytažení logiky** do `logic/` + unit testy a invarianty, oblast po oblasti (generátory → zvládnutí a odměny → řada dní a kalendář).
5. **TypeScript postupně:** nejdřív typ uloženého stavu a obsahu (tam chyby bolí nejvíc), zbytek průběžně.
6. **Export a import postupu** v nastavení pro rodiče.
7. Úprava `CLAUDE.md` a `README.md`: nová pravidla (test ke každé funkci, data v `content/`, migrace k každé změně stavu).

Hrubý odhad: kroky 1 až 2 jedna session, 3 až 4 dvě až tři session, zbytek průběžně při dalším vývoji.

## Rozhodnutí

Ondřej 19. 10. 2026: „Zpracuj vše“ (celý převod, TypeScript postupně, nasazení jen při zelených testech, export a import).
Původní otázky:

1. **Rozsah:** celý převod (kroky 1 až 7), nebo zatím jen záchranná síť (krok 1) a o zbytku rozhodnout podle zkušenosti?
2. **TypeScript:** ano postupně (doporučeno), nebo zůstat u JavaScriptu?
3. **Nasazení jen při zelených testech** přes GitHub Actions: souhlas s přepnutím zdroje GitHub Pages (jedno nastavení v repu, udělá Ondřej)?
4. **Export a import postupu** pro přechod na jiný tablet: chceme?
