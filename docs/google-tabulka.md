# Statistiky do tabulky Google

Hra může po každém kole poslat výsledky do tabulky Google ve vašem účtu, takže je není potřeba posílat z tabletu.
Bez internetu záznamy čekají v tabletu (nejvýš 5000) a odejdou při dalším spuštění nebo po připojení.

## Co v tabulce bude

| List | Řádek za | Sloupce |
|---|---|---|
| **Úlohy** | každou vyřešenou úlohu | čas, patro, úloha, napoprvé (ano/ne), sekundy, záměny (co vybral místo správné), tipy (chyby do 1,2 s), kolo (patro nebo Procvičování) |
| **Kola** | každé kolo | čas, patro, bez chyby, úloh, hotovo, povedené, odešel, sekundy |
| **Hodnocení** | každé hodnocení kola 1–10 | čas, patro, hodnocení |
| **Stav** | přepisuje se | zvládnuto z celku v každém patře, smaragdy, řada dní |

Každý řádek má ID, takže opakované odeslání (výpadek spojení) nic nezdvojí. Jména ani nic jiného o rodině se neposílá.

## Nastavení (asi 5 minut, na počítači)

1. Na [sheets.new](https://sheets.new) založte novou tabulku a pojmenujte ji třeba „Adamův důl – statistiky“.
2. V tabulce **Rozšíření → Apps Script**. V editoru (soubor Kód.gs) označte všechno (Ctrl+A) a smažte, ať tam nezůstane
   ani výchozí `function myFunction`. Pak otevřete čistý text skriptu
   <https://raw.githubusercontent.com/ondrej-kratochvil/adamuv-dul/main/docs/google-tabulka.gs>, označte vše (Ctrl+A),
   zkopírujte a vložte. Uložte (ikona diskety). Skript má asi 70 řádků; když editor hlásí chybu na řádku za koncem
   skriptu, vložilo se něco navíc nebo dvakrát.
3. Vpravo nahoře **Nasadit → Nové nasazení**. U „Vyberte typ“ (ozubené kolo) zvolte **Webová aplikace**.
   - Popis: Adamův důl
   - Spustit jako: **Já**
   - Kdo má přístup: **Kdokoli**
4. **Nasadit**. Google se zeptá na oprávnění: vyberte svůj účet, „Rozšířené“ → „Přejít na … (nebezpečné)“ → Povolit.
   (Varování je obvyklé u vlastních skriptů; skript zapisuje jen do této tabulky.)
5. Zkopírujte **adresu webové aplikace** (končí `/exec`).
6. Na tabletu ve hře: ozubené kolo → příklad pro dospělého → **Statistiky do tabulky Google** → vložit adresu →
   **Uložit adresu**. Hra hned odešle, co čeká, a ukáže „Odesláno N záznamů“.

Adresa je jako heslo: kdo ji zná, může do tabulky zapisovat (číst ne). Proto není v kódu hry ani v repu,
je jen v tabletu (a v exportu postupu). Když unikne, v Apps Scriptu udělejte nové nasazení a starou adresu archivujte.

## Když skript změníte

Po úpravě kódu je potřeba **Nasadit → Spravovat nasazení → upravit (tužka) → Verze: Nová verze → Nasadit**.
Adresa zůstane stejná.

## Čtení tabulky v Claude

Tabulku umí Claude přečíst přes připojený Disk Google („podívej se na Adamovy statistiky“).
