# Schoolcraft v Google Play

> **Co:** jak je hra zabalená pro Android a co je potřeba k vydání v Google Play
> **Stav:** připraveno, vydání čeká na účet vývojáře a uzavřený test (11. 11. 2026)
> **Souhrn:**
> - Obal Trusted Web Activity ve složce `android/`, balíček `games.schoolcraft.app` (nejde později změnit).
> - Hra se dál nasazuje na web; nová verze v obchodě jen při změně obalu (ikona, název, barvy, oprávnění).
> - Sestavení: GitHub Actions → Android → Run workflow, výstup AAB (do Play Console) a APK (na vyzkoušení).
> - Zásady soukromí a smazání účtu: https://schoolcraft.games/soukromi (vzniká z okna O hře v `index.html`).
> - Android ověřuje vazbu aplikace a webu přes https://schoolcraft.games/.well-known/assetlinks.json (`worker/logic.ts`).

## Jak to funguje

Aplikace je tenký obal: po spuštění otevře https://schoolcraft.games v Chromu na celou obrazovku, bez adresního řádku.
Hra, uložení, upozornění i přirozený hlas fungují stejně jako na webu. Postup hráče v aplikaci a v Chromu na stejném
telefonu je společný (stejné úložiště webu).

Adresní řádek zmizí jen tehdy, když `assetlinks.json` obsahuje otisk klíče, kterým je aplikace podepsaná. Klíče jsou dva:

| Klíč | K čemu | Kde je | Otisk SHA-256 |
|---|---|---|---|
| nahrávací (`upload.p12`, alias `upload`) | podepisuje balíček, který nahrajeme do Play Console; APK na vyzkoušení | soubor a heslo v RoboFormu, kopie v tajných proměnných GitHubu `ANDROID_KEYSTORE_B64` a `ANDROID_KEYSTORE_PASSWORD` | `F8:7E:08:87:6A:29:CB:F1:94:B8:6C:32:63:FB:35:73:35:6B:EA:F7:6B:39:9C:98:37:15:EE:D4:12:36:EE:EE` |
| podpisový klíč Google Play | Google jím přepodepíše aplikaci pro uživatele (Play App Signing) | jen u Googlu | doplnit z Play Console → Testování a vydání → Integrita aplikace → Podpis aplikace |

Ztracený nahrávací klíč jde u Googlu vyměnit (Play Console → Integrita aplikace → Požádat o reset nahrávacího klíče);
podpisový klíč drží Google, takže aplikace o aktualizace nepřijde.

## Postup vydání

1. **Tajné proměnné na GitHubu** (jednou): klíč a heslo ze složky `~/.android-schoolcraft` (mimo repo).
2. **Účet vývojáře** na https://play.google.com/console: osobní účet, jednorázově 25 USD, ověření totožnosti dokladem.
   Kontaktní e-mail v obchodě bude veřejný (kratochvil.ondrej@gmail.com).
3. **Vytvořit aplikaci**: název Schoolcraft, jazyk čeština, hra, zdarma.
4. **Obsah aplikace** (odpovědi níže): zásady ochrany soukromí, reklamy, přístup k aplikaci, hodnocení obsahu,
   cílová skupina, Data safety, smazání účtu.
5. **Sestavit** (Actions → Android → Run workflow) a stáhnout artefakt `schoolcraft-android`.
6. **Uzavřený test**: nahrát `app-release.aab`, přidat aspoň 12 testerů (e-maily účtů Google), kteří si aplikaci
   nainstalují a nechají ji 14 dní v kuse. To vyžaduje Google u osobních účtů založených po 13. 11. 2023.
7. **Otisk klíče Google Play** z Integrity aplikace přidat do `ANDROID_FINGERPRINTS` v `worker/logic.ts` a nasadit.
   Kontrola: aplikace z obchodu se otevře bez adresního řádku.
8. **Produkce**: po 14 dnech požádat o přístup do produkce (Play Console se ptá na zkušenosti z testu), pak vydat.

## Nová verze obalu

Jen když se mění něco v `android/` (ikona, název, barvy, oprávnění, knihovna androidbrowserhelper): zvýšit
`versionCode` a `versionName` v `android/app/build.gradle` i `appVersionCode` v `android/twa-manifest.json`,
sestavit a nahrát. Projekt vznikl z `@bubblewrap/core` 1.27.0 podle `twa-manifest.json`; úpravy proti vygenerovanému
stavu: podpis z proměnných prostředí, vypnutá zkratka Nastavení webu (dítě se nemá dostat do nastavení Chromu) a
minSdk 24 (Android 7.0), který vyžaduje androidbrowserhelper 2.7.

## Odpovědi do Play Console

**Zásady ochrany soukromí:** https://schoolcraft.games/soukromi

**Reklamy:** ne. **Nákupy v aplikaci:** ne.

**Přístup k aplikaci:** všechny funkce jsou dostupné bez přihlášení. Nastavení pro rodiče se otevře po spočítání
příkladu (pro posudek: příklad je napsaný na obrazovce, stačí ho spočítat).

**Hodnocení obsahu (IARC):** kategorie Hra, vzdělávací. Násilí ne (souboj s drakem je kreslený, bez krve), strach ne,
sex ne, vulgarita ne, drogy ne, hazard ne. Uživatelé spolu nekomunikují (žebříček ukazuje jen přezdívky ve skupině
na pozvánku od rodiče, bez psaní zpráv). Sdílení polohy ne. Nákupy ne.

**Cílová skupina:** 6 až 8 let (hlavně), případně i 5 a méně. Tím aplikace spadá pod zásady Rodiny (Families policy):
žádné reklamy ani cizí knihovny, zásady soukromí, pravdivá Data safety. Hra je navržená tak, aby je splnila.

**Smazání účtu:** v aplikaci nastavení → Online → Smazat ze serveru; bez aplikace e-mailem podle
https://schoolcraft.games/soukromi (oddíl Smazání údajů). Smaže se záloha, statistiky i přezdívka; statistiky
úloh se samy mažou po 12 měsících, nepřipojený hráč po 2 letech.

**Data safety** (sbírá se jen se zapnutým online, které zapíná rodič; vše šifrovaně přes HTTPS; nic se neprodává
ani nesdílí s třetími stranami, Cloudflare a Google jsou zpracovatelé; uživatel může požádat o smazání):

| Typ dat v Play Console | Co to je ve hře | Účel | Povinné? |
|---|---|---|---|
| Osobní údaje → Jméno | jméno a oslovení dítěte, jména členů rodiny, přezdívka | funkce aplikace (záloha, přenos na jiné zařízení, žebříček ve skupině) | volitelné |
| Osobní údaje → Další údaje | narozeniny a svátek dítěte a rodiny | funkce aplikace (přání v den narozenin) | volitelné |
| Aktivita v aplikaci → Interakce s aplikací | statistiky úloh (patro, úloha, správně napoprvé, doba), týdenní body | funkce aplikace, analýza (zlepšování hry) | volitelné |
| Aktivita v aplikaci → Jiný obsah od uživatele | vzkazy od rodiny | funkce aplikace | volitelné |
| ID zařízení nebo jiná ID | adresa zařízení u služby upozornění (jen se zapnutými upozorněními) | funkce aplikace (ranní upozornění) | volitelné |

Nesbírá se: poloha, kontakty, fotky (Poklad a Moje obrázky zůstávají v zařízení), zvuk (mikrofon jen měří hlasitost
foukání, nic se nenahrává ani neposílá), e-mail, telefon, platební údaje, ID pro reklamu. Věty pro přirozený hlas
jsou texty hry, ne údaje o uživateli.

## Texty do obchodu

**Název:** Schoolcraft

**Krátký popis** (nejvýš 80 znaků):
Čtení, psaní a počty pro prvňáky. Za zvládnuté úkoly si dítě staví svůj svět.

**Úplný popis:**

Schoolcraft je výuková hra pro děti v 1. třídě. Procvičuje písmena, slabiky, čtení, čísla, počty, psaní prstem a sluch
pro výslovnost. Za zvládnuté úkoly si dítě staví dům, farmu a celou vesnici v kostičkovém světě.

Co hra procvičuje:
• Písmena a první hlásky: hlas řekne písmeno, dítě najde správnou kostku.
• Slabiky a slova podle běžných slabikářů.
• Čtení: slova a krátké věty, dítě vybere obrázek.
• Čísla do 100, sčítání a odčítání, porovnávání.
• Psaní: obtahování čísel, písmen a uvolňovacích cviků prstem.
• Sluch: rozlišení hlásek R a L, S a Š a dalších (výslovnost posuzuje rodič, hra nikoho nehodnotí).

Pro rodiče:
• Zapínáte písmena, která dítě zná ze školy. Obtížnost se pak zvedá sama podle toho, co dítě opravdu zvládá.
• Procvičit nabídne přesně ty úlohy, se kterými má dítě potíže.
• Statistiky ukážou, co dítě umí a kde chybuje.
• Hra odměňuje pravidelnost a pokrok, ne dlouhé sezení.

Bezpečně:
• Žádné reklamy a žádné nákupy. Herní měna je jen herní.
• Nastavení pro rodiče je chráněné příkladem nebo otiskem prstu.
• Děti si mezi sebou nepíšou. Žebříček je jen ve skupině na pozvánku (rodina, třída).
• Bez cookies a sledovacích nástrojů. Postup zůstává v zařízení; záloha na server jen se souhlasem rodiče.

**Grafika:** ikona 512 × 512 (`android/store_icon.png`), obrázek funkce 1024 × 500 a aspoň 2 snímky obrazovky
telefonu (doporučeno i tabletu). V popisu ani na obrázcích nepoužívat názvy a postavy cizích her.

## Rizika

- **Název:** rešerše v `docs/hosting-a-domena.md` hodnotí Schoolcraft jako nevhodný kvůli SchoolCraft GmbH (stejný
  název, software pro školy). V obchodě je hra víc vidět; při stížnosti majitele známky Google aplikaci stáhne.
- **Cizí duševní vlastnictví:** kostičkový svět a některé názvy ve hře (drak, Nether) připomínají známou hru. Google
  Play aplikace stahuje i na základě stížnosti majitele práv; v textech a obrázcích do obchodu se na ni neodkazovat.
- **Hlas na Androidu:** aplikace běží v Chromu, takže chování hlasu je stejné jako na webu (verze 90: výchozí hlas
  tabletu).
