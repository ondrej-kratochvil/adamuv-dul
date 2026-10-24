# Schoolcraft: hosting a doména (návrh k ověření)

> **Co:** výběr hostingu a registrátora domény pro hru Schoolcraft (dříve Adamův důl).
> **Stav:** návrh, čeká na ověření jiným modelem a rozhodnutí Ondřeje.
> **Stav k:** 24. 10. 2026
> **Souhrn:**
> - Hosting: Cloudflare (Workers se statickými soubory + databáze D1).
> - Doména: schoolcraft.games (podle registru a DNS volná, ověřit u registrátora).
> - Registrátor: varianta A Dynadot (předplacený kredit + API), varianta B Cloudflare Registrar (karta, API v betě).
> - Cíl: Ondřej jen založí účty, dobije kredit a vytvoří API klíče; všechno ostatní dělá Claude Code přes API a příkazovou řádku.

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

**Doporučení: schoolcraft.games.** Je z ní jasné, že jde o hru, funguje v každém jazyce, cena podle srovnávače kolem 7 až 10 USD za první rok.
Alternativy: .fun (levnější, méně důvěryhodná), .school. Nedoporučeno: .io (drahá, nejistá budoucnost koncovky po předání ostrovů Mauriciu), .kids (registr má přísná pravidla pro dětský obsah).

Riziko názvu: „-craft“ připomíná Minecraft. Hra nepoužívá slovo Minecraft ani jejich grafiku; považováno za malé riziko.

## Hosting: Cloudflare

Důvody:
- Vše na jednom místě: statická hra, API (Workers), databáze D1 (SQLite), DNS a případně i doména.
- Ovládání z příkazové řádky (`wrangler`: nasazení, `d1 execute` pro SQL, `tail` pro logy) a přes Cloudflare MCP.
- Bezplatný tarif: 100 tisíc požadavků denně. Limit 10 ms CPU na požadavek nevadí, API jen ukládá a čte JSON (žádná volání AI).
- Data jde držet v EU (u dat dětí důležité).

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
- .games kolem 8 USD první rok; obnova bývá dražší, ověřit před nákupem.
- Ondřej: založí účet, dobije kredit (kolem 30 USD), vytvoří API klíč (možná s povolením IP adresy).

**B) Cloudflare Registrar**
- Prodává za nákupní cenu i při obnově, skrytí údajů ve WHOIS zdarma, doména rovnou u hostingu.
- Registrace přes API od dubna 2026 v betě; jen část koncovek, jestli je mezi nimi .games, ukáže až kontrolní dotaz API.
- Platba jen výchozí platební metodou v účtu (karta), předplacený kredit podle dokumentace není. Registrace se nevrací.

**C) Forpsi** (nabídka, kterou Ondřej viděl 24. 10. 2026; ceny bez DPH, první rok / obnova, kde byla uvedena)
- schoolcraft.cz 170 Kč (obnova 199 Kč), .sk 265 Kč, .online 45 Kč (obnova 900 Kč), .cloud 22 Kč (obnova 580 Kč), .pro 49 Kč, .tech 79 Kč, .fun 55 Kč, .io 699 Kč (obnova 2 300 Kč), .biz 459 Kč, .blog 598 Kč.
- .games v nabídce nebyla.
- Pozor na akční první rok: obnova bývá několikanásobně dražší (.online 45 → 900 Kč).
- Registrace přes API pro Claude Code nebyla zjišťována; počítá se s ručním nákupem Ondřejem a nasměrováním nameserverů na Cloudflare.

**Další zvažovaní:** Namecheap (API vyžaduje kredit aspoň 50 USD nebo 20 domén a povolenou IP adresu), NameSilo (API z kreditu). Porkbun: zdroje se rozcházejí, jestli jeho API umí registraci.

**Doporučení:** bez karty v účtu Dynadot + hosting Cloudflare; s kartou vše u Cloudflare.

## Co ověřit

1. Je schoolcraft.games opravdu volná a za kolik je první rok a obnova (Dynadot, Cloudflare)?
2. Umí Dynadot API zaregistrovat .games z kreditu a nastavit nameservery? Jaké má podmínky pro API klíč?
3. Podporuje Cloudflare Registrar API koncovku .games? Opravdu nemá předplacený kredit?
4. Platí limity bezplatného tarifu Cloudflare (Workers 100 tisíc požadavků denně, 10 ms CPU, D1) a jde D1 omezit na EU?
5. Je pro tento případ (statická hra, lehké API, malá databáze, ovládání AI agentem) lepší volba než Cloudflare?
6. Hrozí u názvu Schoolcraft problém s ochrannou známkou (Minecraft, existující Schoolcraft)?

## Co bude potřeba od Ondřeje (po rozhodnutí)

1. Vybrat variantu A, nebo B.
2. Údaje vlastníka domény (jméno, adresa, e-mail) pro registr; ve WHOIS skryté.
3. API klíč registrátora a token Cloudflare (Workers, D1, DNS) uložit do proměnných prostředí, ne do chatu ani do repa.

## Zdroje

- [Cloudflare Registrar API (dokumentace)](https://developers.cloudflare.com/registrar/registrar-api/)
- [Cloudflare blog: Registrar API beta](https://blog.cloudflare.com/registrar-api-beta/)
- [Cloudflare blog: Simplifying domains](https://blog.cloudflare.com/simplifying-domains/)
- [Domain Name Wire: Cloudflare launches domain registration API](https://domainnamewire.com/2026/04/15/cloudflare-launches-domain-registration-api/)
- [Dynadot Domain API](https://www.dynadot.com/domain/api)
- [NameSilo: Domain Name API](https://www.namesilo.com/blog/en/automation/domain-name-api-automating-registration-and-dns-management)
- [Domain Registrar Features Compared 2026](https://domaindetails.com/kb/domain-management/domain-registrar-features-compared)
- [domainoffer.net: ceny .games](https://domainoffer.net/tld/games/godaddy)
- [AgentDeals: srovnání bezplatných tarifů hostingů 2026](https://agentdeals.dev/hosting-free-tier-comparison-2026)
- [vibecoding.app: Cloudflare Pages + Workers Review 2026](https://vibecoding.app/blog/cloudflare-pages-review)
- [Upsun: Best Hosting Platforms for Vibe-Coded Apps](https://upsun.com/blog/best-hosting-platforms-vibe-coded-apps/)
