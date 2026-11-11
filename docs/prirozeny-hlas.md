# Přirozený hlas (Google Cloud Text-to-Speech)

> **Co:** proč a jak hra mluví hlasem Google místo hlasu tabletu, odkud řešení pochází, kolik stojí a jak je chráněné.
> **Stav:** aktivní, nasazeno ve verzi 83, pojistky proti útratě ve verzi 84; vypnuté, dokud na serveru není API klíč (server vrací 503 a hra čte hlasem tabletu).
> **Stav k:** 9. 11. 2026
> **Souhrn:**
> - Podnět: Honza ve Slacku (#domeny) a Jan Tobolík na LinkedInu: „mechanická paní“ snižuje celkový dojem, inspirace aplikací ping.
> - Řešení je převzaté z repa ping (Sensio-cz/ping, dříve tobolik/ping) a upravené pro Cloudflare Workers.
> - Výchozí hlas `cs-CZ-Chirp3-HD-Kore`, rodič volí v nastavení (karta Hlas, „Kdo čte“), hlas tabletu zůstává jako záloha.
> - Odhad nákladů: při Adamovi a Víťovi zdarma, s desítkami spolužáků na hraně volného limitu (1 mil. znaků měsíčně).
> - Pojistky (podmínka Honzy 9. 11. 2026): jen věty ze hry, sdílená mezipaměť, strop 100 tisíc znaků denně a 1 milion měsíčně, limit na IP.
> - Chybí: API klíč Google (Honza založí samostatný projekt jen na Text-to-Speech, pošle přes RoboForm) v tajné proměnné GitHubu `SCHOOLCRAFT_GOOGLE_TTS_KEY`.
> **Souvisí:** [technicka-dokumentace.md](technicka-dokumentace.md) (API `/api/tts`), `CLAUDE.md` (Přirozený hlas), [hosting-a-domena.md](hosting-a-domena.md)

## Jak to funguje

1. Hra (`src/audio/speech.js`) pošle větu na `POST /api/tts` s `{ text, voice, slow }`.
2. Worker (`worker/index.ts`) zkontroluje požadavek (`src/logic/tts.ts`: hlas ze seznamu, text do 300 znaků, věta ze hry),
   podívá se do mezipaměti Cloudflare a do databáze (D1 `tts_audio`) a jen novou větu pošle Googlu, pokud nepřelezla denní
   nebo měsíční strop znaků (klíč v hlavičce `X-Goog-Api-Key`, ne v adrese).
3. Hra si MP3 uloží do mezipaměti prohlížeče (`schoolcraft-hlas-1`). Jednou slyšená věta jde příště hned a i bez internetu.
4. Když server nemá klíč (503), hra se v tom spuštění už neptá a čte hlasem tabletu. Při chybě sítě nebo pomalé odpovědi
   (nad 4 s) čte 30 s hlas tabletu a pak zkusí Google znovu.

Rychlost: normálně 0,92, pomalu 0,75 (přirozený hlas mluví rychleji než hlas tabletu). Když hlas rychlost odmítne,
server to zkusí znovu bez ní.

## Oprava zvuku (verze 84)

Honza 9. 11. 2026: ve verzi 83 hra nemluvila ani s hlasem tabletu. Příčina: řeč se zrušila a hned znovu
spustila (`cancel()` těsně před `speak()`), což Safari a některé tablety berou tak, že novou větu zahodí. Teď se ruší jen to,
co opravdu mluví. Navíc se při prvním klepnutí rozjede přehrávač (krátké ticho), aby iPhone a iPad pustily přirozený hlas.

## Co je převzaté z pingu a co jinak

Zdroj: Sensio-cz/ping, větev master k 6. 11. 2026 (`lib/tts_google.php`, `api/tts.php`, `js/audio.js`).

| | ping | Schoolcraft |
|---|---|---|
| Server | PHP, MP3 v souborech na disku | Cloudflare Worker, MP3 v mezipaměti Cloudflare |
| Kdo smí volat | jen přihlášený uživatel | kdokoli (hra jde hrát i bez online účtu), proto limit 120 nových vět za minutu na IP |
| Klíč Googlu | v adrese požadavku | v hlavičce (neukáže se v logu) |
| Seznam hlasů | Chirp3 HD Kore, Aoede, Zephyr, Leda, Charon, Puck, Wavenet B, Standard B | stejný bez Standard B |
| Výchozí hlas | Wavenet B | Chirp3 HD Kore (vybráno bez poslechu, vyzkoušet s Adamem) |
| Rychlost | 1,0 | 0,92, pomalu 0,75 |
| Paměť v zařízení | jen do zavření stránky | trvale (Cache Storage), funguje i bez internetu |
| Výpadek | 20 s hlas prohlížeče, pak znovu | 30 s hlas tabletu, pak znovu |

## Náklady (odhad 7. 11. 2026)

Ceník Googlu (za znaky textu, ověřit v konzoli Google Cloud, zdroje se u volného limitu Chirp 3 HD rozcházejí):

| Hlas | Cena | Zdarma měsíčně |
|---|---|---|
| Chirp 3 HD (výchozí) | 30 USD za 1 mil. znaků | 1 mil. znaků (podle většiny zdrojů) |
| Wavenet, Standard | 4 USD za 1 mil. znaků | 4 mil. znaků |

Platí se jen za větu, kterou ještě nikdo neslyšel; opakované jdou z mezipaměti. Odhad spotřeby:

- **Pevný obsah** (písmena, slabiky, slova, čísla, pochvaly, normálně i pomalu): řádově tisíce vět, 100 až 300 tisíc znaků jednorázově.
- **Proměnlivé věty** (jméno, smaragdy, žebříček): hrubě 1 000 nových znaků na hráče a den.
- **Adam a Víťa:** kolem 60 tisíc znaků měsíčně, tedy zdarma.
- **30 spolužáků po letáku:** až kolem 1 mil. znaků měsíčně, na hraně volného limitu. Nad ním s Chirp 3 HD asi 30 USD (kolem 700 Kč) za každý další milion.
- Mezipaměť Cloudflare není trvalá, část vět se zaplatí znovu; na řádu odhadu to nic nemění.
- **Cloudflare:** požadavky na hlas se přičítají k ostatním požadavkům workeru, bezplatný plán unese 100 tisíc denně.

Skutečné číslo zatím není: hlas bez klíče neběží a nic se neplatí (server bez klíče Googlu nevolá). Měření: `GET /api/admin/tts`.

## Ochrana před útratou

Honza 9. 11. 2026 podmínil vystavení klíče čtyřmi pojistkami (hra je veřejná, rozpočet v Google Cloudu jen upozorní
a strop útraty na Text-to-Speech nejde). Hotové ve verzi 84:

1. **Jen věty ze hry.** Slova delší než 3 písmena musí být ve slovníku textů hry (`src/logic/tts-words.json`, 3 543 slov,
   sbírá `scripts/tts-slova.mjs` ze všech řetězců v `src/` a z `index.html`). Krátká slova (písmena, slabiky) a čísla projdou.
   Navíc smí ve větě být jedno slovo mimo slovník do 15 písmen: jméno dítěte (od 11. 11. 2026, `NAME_MAX`; předtím věty se jménem
   četl tablet a hlasy se ve hře střídaly). Ostatní (víc neznámých slov, cizí použití) čte hlas tabletu, server vrací 422.
   Po změně textů spustit skript znovu.
2. **Krátké hlásky Wavenetem.** Hlasy Chirp 3 HD (Kore, Aoede, Leda, Zephyr, Puck, Charon) u samotného písmene nebo slabiky
   často vrátí ticho (měřeno 11. 11. 2026: ze 44 písmen a slabik 18 tichých i s velkým písmenem a tečkou, u stejné slabiky
   pokaždé jinak). Text do 3 písmen proto čte `cs-CZ-Wavenet-B` (`voiceFor` v `src/logic/tts.ts`), věty a pochvaly zvolený hlas.
   Pojistka: když přijde zvuk tišší než `SILENT_RMS`, hra ho nepřehraje a hlásku řekne hlas tabletu (v záznamu hlasu „ticho od Googlu“).
3. **Sdílená mezipaměť.** Hotové MP3 v D1 (`tts_audio`), nad tím mezipaměť Cloudflare. Každá věta se u Googlu platí jednou.
4. **Strop znaků.** Denně 100 tisíc, měsíčně 1 milion (= volný limit Chirp 3 HD), proměnné `TTS_DAY_CHARS` a
   `TTS_MONTH_CHARS` ve `wrangler.jsonc`. Počítá se při odeslání Googlu (`tts_usage`), po stropu 429 a hra 10 minut čte
   novými větami hlasem tabletu; už uložené věty jdou dál přirozeným hlasem.
5. **Limit na IP** (Cloudflare Rate Limiting ve workeru): všechny požadavky 120 za minutu, nové věty 30 za minutu.

Spotřebu ukáže `GET /api/admin/tts` (klíč správce): stropy, počet uložených vět a znaky za každý den.

Ve verzi 83 byly jen hlasy ze seznamu, text do 300 znaků a limit 120 nových vět za minutu (nejhorší zneužití kolem 50 Kč
za hodinu). Se stropem je nejhorší případ měsíční limit, tedy v rámci volného limitu Googlu.
- V Google Cloudu (doporučení při zakládání klíče): klíč omezit jen na Text-to-Speech API, rozpočet s upozorněním
  (třeba 10 USD) a denní kvóta na API. Kvóta útratu zastaví, rozpočet jen upozorní.
- Levnější záloha: výchozí hlas přepnout na Wavenet (`TTS_DEFAULT` v `src/logic/tts.ts`), za cenu méně přirozeného zvuku.

## Zapnutí

1. Klíč Google Cloud (samostatný firemní projekt jen na Text-to-Speech s upozorněním na rozpočet, Honza pošle přes RoboForm) uložit do GitHubu:
   repo → Settings → Secrets and variables → Actions → `SCHOOLCRAFT_GOOGLE_TTS_KEY`. Nikdy do chatu ani do repa.
2. Spustit znovu poslední běh „Testy a nasazení“; krok „Klíč pro přirozený hlas“ ho uloží na Cloudflare jako `GOOGLE_TTS_KEY`.
3. V nastavení hry, karta Hlas, vybrat a poslechnout hlas.
