# Hosting, doména a název hry (pracovní název Adamův důl)

> **Co:** výběr hostingu, registrátora domény a veřejného názvu hry Adamův důl.
> **Stav:** technicky ověřeno druhým modelem, název čeká na právní prověření a rozhodnutí Ondřeje.
> **Stav k:** 24. 10. 2026
> **Souhrn:**
> - Hosting: Cloudflare (Workers se statickými soubory + databáze D1).
> - Koncovka `.games` je vhodná; názvy Schoolcraft, Educraft, Learncraft, Minedraft, Mineschool a WordMine nedoporučeny kvůli kolizím.
> - Nejsilnější nový kandidát: **Digademy** (`digademy.games` podle DNS a RDAP pravděpodobně volná).
> - Registrátor: Cloudflare Registrar je nejlepší varianta s kartou; Dynadot jen pokud je nutný předplacený kredit.
> - Postup krok za krokem: [navod-registrator-a-hosting.md](navod-registrator-a-hosting.md)
> - Cíl: Ondřej založí účty, nastaví platbu a vytvoří API klíče; běžnou správu dělá Claude Code přes API a příkazovou řádku.

## Zadání

- Hra je dnes statická stránka na GitHub Pages (Vite, JS/TS), postup se ukládá v prohlížeči.
- Nově potřebuje server: ukládání postupu a statistik do databáze, žebříček hráčů (týdenní body, postavička, co kdo má postavené).
- Uživatelé: děti v 1. třídě a jejich rodiče, nejdřív bratranec, pak spolužáci (QR kód), později veřejně přes LinkedIn. Výhledově i slovenština a angličtina.
- Ondřej chce, aby hosting i doménu po prvním nastavení ovládal Claude Code sám (nasazení, změny databáze, logy, DNS).
- Doména má být mezinárodní, .cz je pro to překážka.

## Doména

Kontrola 24. 10. 2026 přes RDAP (rdap.org) a DNS záznamy NS:

| Doména | Výsledek |
|---|---|
| schoolcraft.com, .net, .org, .app, .dev | obsazené (RDAP vrátil záznam) |
| schoolcraft.co, .me | obsazené (mají nameservery) |
| schoolcraft.eu | obsazené (nameservery one.com) |
| schoolcraft.cz | nemá nameservery, nejspíš volná |
| schoolcraft.games, .fun, .school, .io, .world, .club, .online, .study, .academy, .gg, .kids | RDAP 404 a žádné nameservery, nejspíš volné |

Pozor: RDAP 404 u některých koncovek může znamenat jen to, že je rdap.org nepodporuje. Závazná je až kontrola u registrátora.

**Původní návrh: schoolcraft.games.** Z koncovky je jasné, že jde o hru a funguje v každém jazyce.
Koncovka `.games` zůstává doporučená, ale název Schoolcraft čeká na právní prověření.
Alternativy koncovky: .fun (levnější, méně důvěryhodná), .school. Nedoporučeno: .io (drahá, nejistá budoucnost koncovky po předání ostrovů Mauriciu), .kids (registr má přísná pravidla pro dětský obsah).

Původní úvaha řešila jen podobnost „-craft“ s Minecraftem. Nezávislé ověření níže našlo podstatnější
přímé kolize ve vzdělávacím softwaru.

## Hosting: Cloudflare

Důvody:
- Vše na jednom místě: statická hra, API (Workers), databáze D1 (SQLite), DNS a případně i doména.
- Ovládání z příkazové řádky (`wrangler`: nasazení, `d1 execute` pro SQL, `tail` pro logy) a přes Cloudflare MCP.
- Bezplatný tarif: 100 tisíc požadavků denně. Limit 10 ms CPU na požadavek nevadí, API jen ukládá a čte JSON (žádná volání AI).
- D1 databázi jde při vytvoření omezit na EU; Worker a identifikovatelné logy na bezplatném tarifu
  nejsou omezené pouze na EU.

Srovnání s alternativami:

| | Cloudflare | Vercel | Český hosting (stávající) |
|---|---|---|---|
| Databáze | D1 v ceně | externí (Neon apod.) | MariaDB v ceně |
| Ovládání Claude Code | vše přes CLI | nasazení ano, DB u jiného poskytovatele | nasazení přes GitHub Actions; DB a logy jen přes Ondřeje |
| Bezplatné použití | ano | jen nekomerční (Hobby) | už placený |
| Jazyk API | TypeScript | TypeScript | PHP |
| Riziko | nová platforma, D1 není MySQL | dva poskytovatelé | žádné nové, ale Claude Code nemá přímý přístup |

## Registrátor

**A) Dynadot** (odpovídá zadání „nabiju kredit“)
- Registrace přes API z předplaceného kreditu, přes API i nastavení nameserverů na Cloudflare.
- .games kolem 8,24 USD první rok; obnova 31,25 USD podle cen ověřených 24. 10. 2026.
- Ondřej: založí účet, dobije kredit (kolem 30 USD), vytvoří API klíč (možná s povolením IP adresy).

**B) Cloudflare Registrar**
- Prodává za nákupní cenu i při obnově, skrytí údajů ve WHOIS zdarma, doména rovnou u hostingu.
- Registrace přes API od dubna 2025 v betě; `.games` je mezi podporovanými koncovkami.
- Platba jen výchozí platební metodou v účtu (karta), předplacený kredit podle dokumentace není. Registrace se nevrací.
- Registrace přes API má ve výchozím stavu vypnutou automatickou obnovu a API zatím obnovy neumí.

**C) Forpsi** (nabídka, kterou Ondřej viděl 24. 10. 2026; ceny bez DPH, první rok / obnova, kde byla uvedena)
- schoolcraft.cz 170 Kč (obnova 199 Kč), .sk 265 Kč, .online 45 Kč (obnova 900 Kč), .cloud 22 Kč (obnova 580 Kč), .pro 49 Kč, .tech 79 Kč, .fun 55 Kč, .io 699 Kč (obnova 2 300 Kč), .biz 459 Kč, .blog 598 Kč.
- .games v nabídce nebyla.
- Pozor na akční první rok: obnova bývá několikanásobně dražší (.online 45 → 900 Kč).
- Registrace přes API pro Claude Code nebyla zjišťována; počítá se s ručním nákupem Ondřejem a nasměrováním nameserverů na Cloudflare.

**Další zvažovaní:** Namecheap (API vyžaduje kredit aspoň 50 USD nebo 20 domén a povolenou IP adresu), NameSilo (API z kreditu). Porkbun: zdroje se rozcházejí, jestli jeho API umí registraci.

**Doporučení:** s kartou vše u Cloudflare (běžná `.games` přibližně 26 USD za registraci i obnovu);
bez karty Dynadot + hosting Cloudflare. Konkrétní název Schoolcraft neregistrovat před prověřením kolizí.

## Ověřované otázky

1. Je schoolcraft.games opravdu volná a za kolik je první rok a obnova (Dynadot, Cloudflare)?
2. Umí Dynadot API zaregistrovat .games z kreditu a nastavit nameservery? Jaké má podmínky pro API klíč?
3. Podporuje Cloudflare Registrar API koncovku .games? Opravdu nemá předplacený kredit?
4. Platí limity bezplatného tarifu Cloudflare (Workers 100 tisíc požadavků denně, 10 ms CPU, D1) a jde D1 omezit na EU?
5. Je pro tento případ (statická hra, lehké API, malá databáze, ovládání AI agentem) lepší volba než Cloudflare?
6. Hrozí u názvu Schoolcraft problém s ochrannou známkou (Minecraft, existující Schoolcraft)?

## Nezávislé ověření 24. 10. 2026

### Výsledek

- **Cloudflare Workers + D1 je pro tento projekt nejlepší výchozí technická volba.** Statické soubory, API,
  databáze, DNS, nasazení, migrace a logy lze spravovat na jednom místě přes `wrangler` a API.
- **Cloudflare Registrar je nejlepší registrátor, pokud může být v účtu uložená platební metoda.** API už
  výslovně podporuje `.games`. Cloudflare účtuje nákupní cenu registru bez přirážky.
- **Dynadot má smysl jen tehdy, pokud je podmínkou předplacený kredit.** API umožňuje registraci i správu
  nameserverů, ale pracuje s povolenou IP adresou nebo rozsahem CIDR. To komplikuje volání z cloudových
  agentů bez stálé odchozí IP adresy.
- **Koncovka `.games` je vhodná, ale název Schoolcraft zatím není bezpečně prověřený.**

### Doména a ceny

- Kontrola autoritativního RDAP Identity Digital a DNS dne 24. 10. 2026 vrátila pro `schoolcraft.games`
  neexistující záznam. Doména tedy pravděpodobně není registrovaná.
- Definitivní dostupnost, prémiový příplatek a cenu konkrétní domény musí bezprostředně před registrací
  potvrdit kontrolní endpoint registrátora.
- Orientační cena Cloudflare pro běžnou `.games` doménu byla 26 USD za registraci i obnovu.
- Dynadot nabízel akční registraci za 8,24 USD, ale obnovu za 31,25 USD. Cloudflare je proto jednodušší
  a dlouhodobě mírně levnější; Dynadot je levnější pouze v prvním roce.

### Opravy a omezení původního návrhu

1. Cloudflare Registrar API bylo oznámeno 15. 4. 2025, ne v dubnu 2026.
2. `.games` je v seznamu koncovek podporovaných Registrar API. Kontrolní dotaz je stále nutný kvůli
   dostupnosti a ceně konkrétní domény.
3. Registrace provedená přes Cloudflare API má ve výchozím stavu `auto_renew: false`. API v betě zatím
   neumí obnovy. Po registraci je nutné v administraci zkontrolovat a zapnout automatickou obnovu.
4. Cloudflare nepřijímá účetní kredit pro transakce registrátora. Vyžaduje platnou výchozí platební metodu.
5. Workers Free skutečně nabízí 100 000 požadavků denně a 10 ms CPU na požadavek.
6. D1 Free nabízí 5 milionů přečtených a 100 000 zapsaných řádků denně, celkem 5 GB úložiště, ale jedna
   databáze smí mít nejvýše 500 MB. Obnova bodu v čase sahá na bezplatném tarifu 7 dní zpět.
7. Při překročení denního limitu D1 začne vracet chyby až do obnovení limitu o půlnoci UTC. Před veřejným
   spuštěním je vhodné nastavit sledování spotřeby a připravit přechod na Workers Paid.
8. D1 lze při vytvoření omezit na EU pomocí `--jurisdiction=eu`; později to nelze změnit. Neznamená to ale,
   že celý Worker běží pouze v EU. Workers Free zpracovává požadavky globálně. Omezení běhu Workeru a
   identifikovatelných logů na EU patří do placené Data Localization Suite.

### Riziko názvu Schoolcraft

Původní hodnocení „malé riziko kvůli podobnosti s Minecraftem“ nestačí. Významnější jsou přímé kolize:

- V Německu působí SchoolCraft GmbH, která od roku 2012 vyvíjí software pro přípravu výuky a digitální
  materiály pro základní školy. V obchodních zdrojích je doložena slovní/obrazová značka `schoolcraft`
  z 26. 3. 2013.
- V USA působí Schoolcraft College a vlastní živou ochrannou známku `SCHOOLCRAFT COLLEGE` ve třídě 41.
- Veřejné zdroje uvádějí i další použití názvu SchoolCraft v herním a vzdělávacím prostředí.

Jde o velmi podobný obor, cílovou skupinu i území. Před registrací domény a veřejným uvedením je potřeba
prověřit EUIPO, německý registr DPMA a relevantní slovní i obrazové známky. Do té doby se doporučuje
schválit pouze koncovku `.games`, ne konkrétní název Schoolcraft. Toto není právní stanovisko.

### Ochrana údajů dětí

Volba hostingu sama neřeší zpracování údajů dětí. Před tvorbou serverové části je potřeba rozhodnout:

- rodičovský účet, souhlas a přiměřené ověření rodiče u dětí mladších 15 let;
- veřejně používat jen přezdívku, ne skutečné jméno, školu, třídu ani přesnou polohu;
- profily a žebříčky nastavit ve výchozím stavu jako soukromé nebo přístupné jen pozvané skupině;
- nepřidávat chat, cílenou reklamu ani veřejné osobní údaje;
- stanovit dobu uchování, export a úplné smazání účtu a statistik;
- napsat krátké a srozumitelné informace zvlášť pro dítě a pro rodiče.

Pokud má hra používat běžné účty s e-mailem, obnovou hesla nebo sociálním přihlášením, je před konečným
rozhodnutím vhodné porovnat Cloudflare se Supabase v konkrétním regionu EU, který poskytuje hotovou autentizaci.
Pro jednoduché pozvánky nebo rodičem spravované profily zůstává Cloudflare jednodušší.

## Výběr názvu (24. 10. 2026)

Po zjištění kolize u Schoolcraftu byly prověřeny další názvy. Dostupnost `.games` byla kontrolována přímo
v autoritativním RDAP registru Identity Digital a přes DNS. RDAP 404 a neexistující DNS znamenají, že doména
pravděpodobně není registrovaná; definitivní dostupnost a případnou prémiovou cenu potvrdí až registrátor.
Kolize byly hledány na veřejném webu, nikoli vyčerpávajícím způsobem v registrech ochranných známek.

### Vyřazené názvy

| Název | Stav `.games` | Zjištění | Hodnocení |
|---|---|---|---|
| Schoolcraft | pravděpodobně volná | SchoolCraft GmbH v Německu vyvíjí software pro základní školy; Schoolcraft College v USA; doložená značka `schoolcraft` z roku 2013 | nevhodné: totožný název a velmi blízký obor |
| Educraft | pravděpodobně volná | vzdělávací platforma na Minecraftu v Litvě a další vzdělávací projekty | nevhodné: přímá kolize v EU |
| Learncraft | pravděpodobně volná | vzdělávací hry a aplikace pro školáky, mimo jiné španělská aplikace na Google Play | nevhodné: stejný obor v EU |
| Minedraft | pravděpodobně volná | od názvu Minecraft se liší jediným písmenem | nevhodné: vysoké riziko záměny |
| MineSchool | pravděpodobně volná | aktivní francouzská služba `mineschool.net` nabízí dětem od 5 let výuku Minecraftu a programování; stejné označení používá také brazilský kurz modifikací Minecraftu | nevhodné: přesný název, děti, vzdělávání a přímá vazba na Minecraft |
| WordMine / WordMiner | pravděpodobně volné | existuje vzdělávací produkt WordMine 2 pro výuku slovní zásoby a další aplikace Wordmine X | nevhodné: přímá kolize ve vzdělávání |
| PixelSchool / BlockSchool | pravděpodobně volné | názvy jsou obecné a silně evokují Minecraft | slabé a obtížně chránitelné |
| AlphaMine / LearnMine / MineLearn | pravděpodobně volné | `mine` může znamenat důl, těžit i „moje“; názvy jsou méně jednoznačné | spíše nedoporučeno |
| SchoolMine | pravděpodobně volná | v angličtině může spojení znamenat také minu ve škole | nevhodné |

### Použitelní kandidáti

| Název | Stav `.games` | Výhody | Nevýhody a kolize | Hodnocení |
|---|---|---|---|---|
| **Digademy** | pravděpodobně volná | vymyšlené spojení `dig + academy`, zahrne písmena, slova, počty, psaní i mluvení; zapamatovatelné a svébytné | předběžné webové hledání nenašlo stejnojmennou vzdělávací hru; nutná kontrola známek | **nejlepší kandidát** |
| LetterDig | pravděpodobně volná | výrazné, snadno vysvětlitelné, předběžně bez přímé kolize | omezuje značku na písmena, přestože hra obsahuje více oblastí | nejlepší z původního seznamu, pokud by hra zůstala hlavně čtenářská |
| ABCDig | pravděpodobně volná | krátké a srozumitelné rodičům | ABC naznačuje jen písmena; existuje italský vzdělávací projekt ABCDig a název se používá jako technologická zkratka | použitelné, ale slabší |
| LearnDig | pravděpodobně volná | význam je zřejmý a obsah není omezený na písmena | v angličtině zní méně přirozeně a je popisné | použitelná záloha |
| CleverCave | pravděpodobně volná | přátelské, široké a bez slova `mine`; dobře se pamatuje | `Clever` je ve vzdělávání silně obsazené slovo; existuje nesouvisející projekt CleverCaves | použitelná záloha |
| DigLetters | pravděpodobně volná | popisuje písmena a kopání | nepřirozený anglický slovosled, omezení jen na písmena | horší než LetterDig |

Všechny názvy z obou tabulek, které jsou označené jako pravděpodobně volné, v době kontroly neměly DNS
a autoritativní RDAP pro `.games` vracel 404. To není rezervace ani záruka dostupnosti.

### Doporučení názvu

**První volba: Digademy**, například s mottem:

- anglicky: `Learn. Dig. Build.`
- česky: `Uč se. Kopej. Stavěj.`

Digademy je širší než LetterDig a výrazně svébytnější než názvy s `school`, `craft`, `block` nebo `mine`.
Před registrací je stále nutné ověřit EUIPO a DPMA, případně USPTO, zejména třídy 9 (software) a 41
(vzdělávání a online hry), a zkontrolovat obchody s aplikacemi a sociální sítě. Toto není právní stanovisko.

Ve hře si každé dítě může dál zvolit vlastní název světa, například „Adamův důl“; veřejná značka a doména
mohou používat jednotný název Digademy.

## Co bude potřeba od Ondřeje (po rozhodnutí)

1. Rozhodnout o názvu; aktuální doporučení je Digademy. Před registrací prověřit ochranné známky.
2. Vybrat variantu A, nebo B.
3. Údaje vlastníka domény (jméno, adresa, e-mail) pro registr; ve WHOIS skryté.
4. API klíč registrátora a token Cloudflare (Workers, D1, DNS) uložit do proměnných prostředí, ne do chatu ani do repa.

## Zdroje

- [Cloudflare Registrar API (dokumentace)](https://developers.cloudflare.com/registrar/registrar-api/)
- [Cloudflare blog: Registrar API beta](https://blog.cloudflare.com/registrar-api-beta/)
- [Cloudflare blog: Simplifying domains](https://blog.cloudflare.com/simplifying-domains/)
- [Cloudflare Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/)
- [Cloudflare D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/)
- [Cloudflare D1 limits](https://developers.cloudflare.com/d1/platform/limits/)
- [Cloudflare D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/)
- [Cloudflare Workers data localization](https://developers.cloudflare.com/data-localization/how-to/workers/)
- [Dynadot Domain API](https://www.dynadot.com/domain/api)
- [Dynadot API settings](https://www.dynadot.com/help/question/find-API-settings)
- [Dynadot: změny cen Identity Digital od 6. 10. 2026](https://www.dynadot.com/blog/price-changes-for-over-200-identity-digital-tlds)
- [NameSilo: Domain Name API](https://www.namesilo.com/blog/en/automation/domain-name-api-automating-registration-and-dns-management)
- [Domain Registrar Features Compared 2026](https://domaindetails.com/kb/domain-management/domain-registrar-features-compared)
- [domainoffer.net: ceny .games](https://domainoffer.net/tld/games/godaddy)
- [AgentDeals: srovnání bezplatných tarifů hostingů 2026](https://agentdeals.dev/hosting-free-tier-comparison-2026)
- [vibecoding.app: Cloudflare Pages + Workers Review 2026](https://vibecoding.app/blog/cloudflare-pages-review)
- [Upsun: Best Hosting Platforms for Vibe-Coded Apps](https://upsun.com/blog/best-hosting-platforms-vibe-coded-apps/)
- [SchoolCraft GmbH](https://www.st-johann.de/de/schafffig-innovativ/Unternehmen-A-Z/Unternehmen?id=1045&item=company&view=publish)
- [Supabase: dostupné regiony](https://supabase.com/docs/guides/platform/regions)
- [Evropská komise: ochrana údajů dětí](https://commission.europa.eu/law/law-topic/data-protection/rules-business-and-organisations/legal-grounds-processing-data/are-there-any-specific-safeguards-data-about-children_en)
- [Educraft – World Summit Awards](https://wsa-global.org/winner/educraft/)
- [EduCraft (educraft.ai)](https://educraft.ai/)
- [EduCraft Consulting](https://theeducraft.com/about-us/)
- [LearnCraft – Google Play](https://play.google.com/store/apps/details?id=com.eduquest.app&hl=en-US)
- [LearnCraft (learncraft.lol)](https://learncraft.lol/)
- [A Square LearnCraft LLP](https://in.linkedin.com/company/a2learncraft)
- [LearnCraft Innovations](https://www.learncraftinnovations.com/)
- [Minecraft Education – ochranná známka Microsoftu](https://uspto.report/TM/97867602)
- [ConductAtlas: Minecraft Usage Guidelines – implied endorsement](https://conductatlas.com/platform/minecraft/minecraft-usage-guidelines/no-implied-endorsement-restriction/)
- [Mine School – modpack na CurseForge](https://www.curseforge.com/minecraft/modpacks/mine-school)
- [Mine School – projekt na Tynkeru](https://www.tynker.com/community/projects/play/mine-school/5bedd6cdc762c139a437f087/)
- [Mineschool – francouzská výuka Minecraftu pro děti](https://mineschool.net/)
- [Danki Code – brazilský kurz Mineschool](https://cursos.dankicode.com/curso-mods-minecraft)
- [WordMine 2](https://www.reallyenglish.com/wordmine-2)
- [ABCDig – italský vzdělávací projekt](https://www.comprensivocentallo.edu.it/scheda-progetto/abcdig-competenze-informatiche-di-base-digcomp-2-2/)
