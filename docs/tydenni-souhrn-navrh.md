# Týdenní souhrn pro rodiče (návrh)

> **Co:** souhrn toho, co dítě za týden zvládlo, aby ho rodič mohl konkrétně pochválit
> **Stav:** hotovo ve verzi 93 (schválil Ondřej 11. 11. 2026: všechny tři části); „nově otevřené stupně“ zatím ne (stupně datum otevření nemají)
> **Souhrn:**
> - Podnět: Adam i Víťa 8. 11. odehráli desítky kol a pak skoro přestali; u šestiletého dítěte nejvíc zabere konkrétní pochvala od dospělého.
> - Souhrn je v nastavení (rodič), jde poslat rodině (babička, děda) a v pondělí ho hra krátce řekne dítěti.
> - Všechno se počítá v zařízení, nic nového se neposílá na server.
> - Nově se ukládá datum, kdy dítě úlohu zvládlo; první souhrn bude jen za dny od nasazení.

## Kde a kdy

1. **Nastavení → Postup a data → Týden** (za zámkem pro rodiče): souhrn tohoto a minulého týdne (pondělí až neděle).
2. **Tlačítko „Poslat rodině“**: text souhrnu přes sdílení (WhatsApp, SMS, e-mail), bez sdílení se zkopíruje.
3. **V pondělí při prvním otevření** hra řekne dítěti jednu větu o minulém týdnu (jen když hrálo aspoň 1 den).
4. **Ranní upozornění v neděli** (jen když ho rodič zapnul): místo běžného textu „Souhrn týdne je připravený“. *Volitelné, viz otázky.*

## Co souhrn obsahuje

| Část | Odkud | Příklad |
|---|---|---|
| Dny hraní | deník kol (`save.log`), den s aspoň jedním povedeným kolem | ●●○●○●○ 4 ze 7 dní |
| Povedená kola | deník kol | 18 povedených kol, nejvíc Písmena a Psaní |
| Nově zvládnuté | nové datum zvládnutí (`save.got`) | Slova: MÁMA, LES, OSA · Písmena: Ř, Š · Počty: 7 + 2 |
| Na čem pracovat | 3 nejslabší úlohy (`weakItems`) s nejčastější záměnou | B a D se pletou; slovo LEPÍ |
| Tip pro rodiče | podle slabé úlohy | Zkuste spolu najít doma něco na B. |

Bez porovnávání s jinými dětmi a bez času stráveného ve hře (motivuje to k dlouhému sezení, ne k pravidelnosti).

## Texty (ke schválení)

**Nadpis v nastavení:** Týden 3. až 9. 11.

**Text ke sdílení:**

> Schoolcraft, týden 3. až 9. 11.: Adam hrál 4 ze 7 dní a zvládl 12 nových úkolů.
> Nově umí: MÁMA, LES, OSA, Ř, Š, 7 + 2…
> Ještě se učí: B a D, slovo LEPÍ.

**Pondělní věta pro dítě (čte hlas):**

- hrálo 5 a víc dní: „Minulý týden jsi hrál skoro každý den a naučil ses {počet} nových věcí. Jsi šampion!“
- hrálo 2 až 4 dny: „Minulý týden ses naučil {počet} nových věcí. Tento týden to zkusíme ještě o den víc?“
- hrálo 1 den: „Minulý týden jsi hrál jeden den. Dnes můžeš začít novou řadu!“

(V ženském rodě „hrála“, „naučila“ podle oslovení hráče, jako ostatní hlášky.)

**Nedělní upozornění:** „Souhrn týdne je připravený. Podívejte se, co se {jméno} naučil.“

## Technicky

- `save.got: Record<string, number>`: klíč úlohy → čas prvního zvládnutí (`mastery` přejde na `good`). Nové číslo `SCHEMA`, migrace
  nic nepřepočítává (staré úlohy datum nemají).
- Pravidla v `src/logic/weekly.ts` (týden od pondělí podle českého času, výběr položek), obrazovka `src/ui/weekly.js`, testy
  jednotkové i e2e.
- Data o hráči zůstávají v zařízení; se zapnutým online jsou v záloze jako dosud (Data safety se nemění).
