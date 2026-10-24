# Návod: účty u registrátora a na Cloudflare

> **Co:** kroky, které udělá Ondřej, aby pak doménu a hosting Schoolcraftu ovládal Claude Code.
> **Stav:** draft (čeká na ověření návrhu v [hosting-a-domena.md](hosting-a-domena.md) a výběr varianty)
> **Stav k:** 24. 10. 2026
> **Souhrn:**
> - Varianta A: Dynadot (kredit, API klíč) + Cloudflare (hosting). Varianta B: vše u Cloudflare (karta v účtu).
> - Klíče a tokeny se ukládají do proměnných prostředí ve Windows a do RoboFormu, nikdy do chatu ani do repa.
> - Po dokončení stačí Claude Code napsat „hotovo“, další kroky (registrace, DNS, nasazení, databáze) udělá sám.
> **Souvisí:** [hosting-a-domena.md](hosting-a-domena.md)

Názvy položek v menu se u obou služeb občas mění. Když něco nesedí, hledej podobně pojmenovanou položku, nebo pošli Claude Code snímek obrazovky.

## 1. Cloudflare: účet (obě varianty)

1. Na [dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up) založ účet (osobní e-mail) a potvrď e-mail.
2. Zapni dvoufázové ověření: vpravo nahoře profil → **My Profile** → **Authentication** → **Two-Factor Authentication**.
3. Zjisti **Account ID**: v levém menu **Workers & Pages**, vpravo v panelu je „Account ID“. Zkopíruj si ho (není tajné, ale ať je po ruce).
4. Tarif nech **Free**. Pro hru stačí.

## 2a. Varianta A: Dynadot (doména z kreditu)

1. Na [dynadot.com](https://www.dynadot.com) založ účet a potvrď e-mail. Zapni dvoufázové ověření (nastavení účtu, sekce Security).
2. **Kontakt vlastníka:** v nastavení účtu vyplň výchozí kontakt (jméno, adresa, telefon, e-mail). Registr ho vyžaduje, ve WHOIS bude skrytý.
3. **Kredit:** v účtu najdi doplnění kreditu (Add Funds / Account Balance) a dobij zhruba 30 USD. Stačí na .games na první rok i s rezervou.
4. **API klíč:** menu **Tools → API**.
   - Nejdřív účet odemkni (odkaz přímo na stránce API, Dynadot to vyžaduje kvůli bezpečnosti).
   - Vygeneruj **API Key** a **API Secret** (produkční, ne sandbox).
   - Do **IP Address** vlož veřejnou IP adresu počítače, ze kterého poběží Claude Code. Zjistí ji třeba stránka [ifconfig.me](https://ifconfig.me), nebo se zeptej Claude Code. Doma se IP může časem změnit; pak ji tu stačí přepsat.
   - Ulož a účet znovu zamkni.
   - Nová IP adresa začne platit až za 15 minut až hodinu.
5. API Key a Secret ulož do RoboFormu a do proměnných prostředí (kapitola 4) jako `DYNADOT_API_KEY` a `DYNADOT_API_SECRET`.

Claude Code pak sám: ověří dostupnost a cenu (i obnovy) přes API, doménu zaregistruje z kreditu a nastaví nameservery na Cloudflare.

## 2b. Varianta B: Cloudflare Registrar (doména kartou)

1. V Cloudflare **Manage Account → Billing**: přidej platební kartu jako výchozí platební metodu.
2. V části **Domain Registration** vyplň výchozí kontakt vlastníka a odsouhlas registrační podmínky (Domain Registration Agreement).
3. K tokenu (kapitola 3) přidej oprávnění pro **Registrar** (zápis).

Claude Code pak přes API ověří, jestli jde .games registrovat přes API (je to zatím beta a podporuje jen část koncovek). Když ne, koupíš ji jedním klikem v **Domain Registration → Register Domains**. Pozor: registrace se nevrací a automatická obnova je přes API ve výchozím stavu vypnutá.

## 3. Cloudflare: API token (obě varianty)

1. Pokud už doménu máš (varianta B, nebo ji koupíš ručně): **Add a domain** → schoolcraft.games → tarif **Free**. U varianty A doménu přidá Claude Code, nebo ji přidej ty až po registraci.
2. Profil → **My Profile → API Tokens → Create Token**.
3. U šablony **Edit Cloudflare Workers** klikni na **Use template**.
4. Do oprávnění přidej (tlačítko **+ Add more**):
   - **Account → D1 → Edit** (databáze; šablona ho nemá),
   - **Zone → DNS → Edit** (DNS záznamy domény),
   - **Zone → Workers Routes → Edit** (napojení hry na doménu),
   - **Zone → Zone → Edit** (přidání domény do Cloudflare, varianta A),
   - u varianty B ještě oprávnění pro **Registrar** (zápis).
5. **Account Resources:** jen tvůj účet. **Zone Resources:** „All zones from an account“ (doména ještě nemusí existovat).
6. **TTL:** můžeš nastavit platnost třeba na rok; po vypršení se vytvoří nový.
7. **Create Token**, token se ukáže jen jednou. Ulož ho do RoboFormu a do proměnné prostředí `CLOUDFLARE_API_TOKEN` (kapitola 4). Do stejného místa dej i `CLOUDFLARE_ACCOUNT_ID` (Account ID z kapitoly 1).

## 4. Uložení klíčů do Windows (proměnné prostředí)

Tajné hodnoty nikdy nevkládej do chatu ani do souborů v repu. Claude Code je přečte z proměnných prostředí, ale jejich obsah neuvidí v konverzaci.

1. Start → napiš **proměnné prostředí** → **Upravit proměnné prostředí pro váš účet**.
2. V horní části (proměnné uživatele) **Nová…** a přidej:

   | Název | Hodnota |
   |---|---|
   | `CLOUDFLARE_API_TOKEN` | token z kapitoly 3 |
   | `CLOUDFLARE_ACCOUNT_ID` | Account ID z kapitoly 1 |
   | `DYNADOT_API_KEY` | jen varianta A |
   | `DYNADOT_API_SECRET` | jen varianta A |

3. **OK** a zavři a znovu otevři VS Code (proměnné se načtou až po novém spuštění).

Pro automatické nasazení z GitHubu dá Claude Code token i do tajných proměnných repozitáře (`gh secret set`), přímo z proměnné prostředí, bez opisování.

## 5. Co pak udělá Claude Code

1. Ověří, že token funguje (`wrangler whoami`) a že klíče registrátora fungují (zůstatek kreditu).
2. Ověří dostupnost a cenu domény včetně obnovy a před nákupem ti řekne přesnou částku. Koupí až po tvém „ano“.
3. Zaregistruje doménu, přidá ji do Cloudflare a nastaví nameservery.
4. Založí databázi D1 (data v EU), napíše API pro postup, statistiky a žebříček, nasadí hru na schoolcraft.games a nastaví nasazení z GitHubu.
5. Původní adresa na GitHub Pages pak přesměruje na novou a Adamův postup se přenese přes server.

## Zdroje

- [Dynadot: Where can I find my API settings?](https://www.dynadot.com/help/question/find-API-settings)
- [Dynadot: Where can I find my API key?](https://www.dynadot.com/help/question/1151)
- [Dynadot: Domain API, seznam příkazů](https://www.dynadot.com/domain/api-document)
- [Dynadot blog: Domain API Tips](https://www.dynadot.com/blog/getting-the-most-out-of-api)
- [DNSControl: Dynadot (prodleva povolení IP)](https://docs.dnscontrol.org/provider/dynadot)
- [Cloudflare: GitHub Actions a API token](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)
- [Cloudflare: Workers roles and permissions](https://developers.cloudflare.com/workers/authorization/workers/)
- [cloudflare/wrangler-action #233: oprávnění tokenu](https://github.com/cloudflare/wrangler-action/issues/233)
- [Cloudflare Registrar API](https://developers.cloudflare.com/registrar/registrar-api/)
