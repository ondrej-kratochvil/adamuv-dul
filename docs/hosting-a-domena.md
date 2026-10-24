# Schoolcraft: hosting a doména (návrh k ověření)

> **Co:** výběr hostingu a registrátora domény pro hru Schoolcraft (dříve Adamův důl).
> **Stav:** technicky ověřeno druhým modelem, název čeká na právní prověření a rozhodnutí Ondřeje.
> **Stav k:** 24. 10. 2026
> **Souhrn:**
> - Hosting: Cloudflare (Workers se statickými soubory + databáze D1).
> - Koncovka `.games` je vhodná; konkrétní název Schoolcraft zatím nedoporučen kvůli možné kolizi.
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

## Co bude potřeba od Ondřeje (po rozhodnutí)

1. Nechat prověřit název, nebo vybrat jiný název s koncovkou `.games`.
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
