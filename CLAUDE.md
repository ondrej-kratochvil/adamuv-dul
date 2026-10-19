# Adamův důl: pravidla pro úpravy

Hra je jeden soubor `index.html` (GitHub Pages, větev `main`). Hraje ji Adam (1. třída) na tabletu s Family Link.
Obsah (písmena, slova, čísla) se řídí tím, co Adam umí ve škole; souhrn a rozhodnutí jsou v osobní znalostní bázi
(`osobni/deti.md`, sekce „Čtecí hra Adamův důl“).

## Odměny musí držet krok s obsahem (Ondřej, 19. 10. 2026)

Maximální vybavení má Adam mít až ve chvíli, kdy zvládne všechno, co hra obsahuje. Když přidáváš úkoly,
přidej i odměny, aby Adam nedošel na strop dřív, než dojde obsah.

- **Očarování** (`ENCHANTS`, `ENCH_ORDER`) se odemykají podle podílu zvládnutých úkolů (`masteryPoints()`):
  odměna č. i potřebuje `ceil((i + 1) / počet_odměn × počet_úkolů)` zvládnutých. Když přidáš nové patro nebo
  položky, přidej je do `MASTERY_SETS()`; prahy se posunou samy. Když přidáš velký blok obsahu, přidej i nová
  očarování nebo jiné odměny, aby krok mezi odměnami nebyl příliš dlouhý (teď zhruba 3 zvládnuté úkoly na odměnu).
- **Zvládnutý úkol** = `mastery() === 'good'` (aspoň 3× správně a poslední dobou bez chyby).
- Odměny podle počtu kol (krumpáče, oblečení `at:`, dům 12 dílů, farma 10 dílů) končí kolem 22. kola;
  další dlouhodobé cíle mají být vázané na zvládnutí, ne na počet kol (jinak se vyplácí hrát lehké patro dokola).
- Získané odměny se nikdy neberou zpět.

## Další zásady

- Za chybu se nic nebere, jen se nic nepřidá (zaseknutý krumpáč, kolo se nepočítá). Zaseknutí trvá 2 s; Ochrana na výbavě ho zkracuje o 50 ms za úroveň, nejvíc na 1,2 s (`stuckMs()`). Kratší ne, aby se tipování nevyplatilo.
- Texty pro Adama musí jít přečíst nahlas (hlas prohlížeče, čeština); tlačítka bez čtení musí dávat smysl obrázkem.
- Podoby rodiny jen podle toho, co řekl Ondřej (`FAMILY`); nic nedomýšlet.
- Před nahráním vyzkoušet v Playwrightu (Chromium v `/opt/pw-browsers/chromium`) aspoň jedno kolo dotčeného patra.
