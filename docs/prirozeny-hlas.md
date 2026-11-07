# Přirozený hlas (Google Cloud Text-to-Speech)

> **Co:** proč a jak hra mluví hlasem Google místo hlasu tabletu, odkud řešení pochází, kolik stojí a jak je chráněné.
> **Stav:** aktivní, nasazeno ve verzi 83, ale vypnuté, dokud na serveru není API klíč (server vrací 503 a hra čte hlasem tabletu).
> **Stav k:** 7. 11. 2026
> **Souhrn:**
> - Podnět: Honza ve Slacku (#domeny) a Jan Tobolík na LinkedInu: „mechanická paní“ snižuje celkový dojem, inspirace aplikací ping.
> - Řešení je převzaté z repa ping (Sensio-cz/ping, dříve tobolik/ping) a upravené pro Cloudflare Workers.
> - Výchozí hlas `cs-CZ-Chirp3-HD-Kore`, rodič volí v nastavení (karta Hlas, „Kdo čte“), hlas tabletu zůstává jako záloha.
> - Odhad nákladů: při Adamovi a Víťovi zdarma, s desítkami spolužáků na hraně volného limitu (1 mil. znaků měsíčně).
> - Chybí: API klíč Google (od Honzy z firemního Google Cloudu) v tajné proměnné GitHubu `SCHOOLCRAFT_GOOGLE_TTS_KEY`.
> **Souvisí:** [technicka-dokumentace.md](technicka-dokumentace.md) (API `/api/tts`), `CLAUDE.md` (Přirozený hlas), [hosting-a-domena.md](hosting-a-domena.md)

## Jak to funguje

1. Hra (`src/audio/speech.js`) pošle větu na `POST /api/tts` s `{ text, voice, slow }`.
2. Worker (`worker/index.ts`) zkontroluje požadavek (`src/logic/tts.ts`: hlas ze seznamu, text do 300 znaků), podívá se do
   mezipaměti Cloudflare a jen novou větu pošle Googlu (klíč v hlavičce `X-Goog-Api-Key`, ne v adrese).
3. Hra si MP3 uloží do mezipaměti prohlížeče (`schoolcraft-hlas-1`). Jednou slyšená věta jde příště hned a i bez internetu.
4. Když server nemá klíč (503), hra se v tom spuštění už neptá a čte hlasem tabletu. Při chybě sítě nebo pomalé odpovědi
   (nad 4 s) čte 30 s hlas tabletu a pak zkusí Google znovu.

Rychlost: normálně 0,92, pomalu 0,75 (přirozený hlas mluví rychleji než hlas tabletu). Když hlas rychlost odmítne,
server to zkusí znovu bez ní.

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

Skutečné číslo zatím není: hlas bez klíče neběží. Případné měření: počítadlo znaků poslaných Googlu ve workeru (zatím neuděláno).

## Ochrana před útratou

- Na serveru: jen hlasy ze seznamu, text do 300 znaků, nová syntéza nejvýš 120 vět za minutu z jedné IP
  (nejhorší zneužití přes limit kolem 50 Kč za hodinu).
- V Google Cloudu (doporučení při zakládání klíče): klíč omezit jen na Text-to-Speech API, rozpočet s upozorněním
  (třeba 10 USD) a denní kvóta na API. Kvóta útratu zastaví, rozpočet jen upozorní.
- Levnější záloha: výchozí hlas přepnout na Wavenet (`TTS_DEFAULT` v `src/logic/tts.ts`), za cenu méně přirozeného zvuku.

## Zapnutí

1. Klíč Google Cloud (firemní projekt, rozhodnutí Honzy 7. 11. 2026, že hra se vede přes firmu) uložit do GitHubu:
   repo → Settings → Secrets and variables → Actions → `SCHOOLCRAFT_GOOGLE_TTS_KEY`. Nikdy do chatu ani do repa.
2. Spustit znovu poslední běh „Testy a nasazení“; krok „Klíč pro přirozený hlas“ ho uloží na Cloudflare jako `GOOGLE_TTS_KEY`.
3. V nastavení hry, karta Hlas, vybrat a poslechnout hlas.
