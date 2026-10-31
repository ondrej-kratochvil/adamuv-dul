# Schoolcraft (Adamův důl)

Výuková hra ve stylu Minecraftu pro prvňáky: písmena, slabiky, čtení, čísla, počty, psaní a sluch pro výslovnost.
Dítě kope do kostek se správnou odpovědí a za pokrok staví svůj svět. Vznikla pro Adama (1. třída), hraje se na
**https://schoolcraft.games** (PWA, funguje i bez internetu).

## Dokumentace

| Dokument | Pro koho |
|---|---|
| [`docs/prirucka.md`](docs/prirucka.md) | **uživatelská příručka pro rodiče**: instalace, nastavení, patra, odměny, upozornění, přenos, potíže |
| [`docs/technicka-dokumentace.md`](docs/technicka-dokumentace.md) | **technická dokumentace**: moduly, herní pravidla s čísly, uložený stav, server a API, upozornění, testy, nasazení, jak na úpravy |
| [`CLAUDE.md`](CLAUDE.md) | závazná pravidla pro úpravy (odměny, texty pro dítě, rodina, testy, verze) |
| [`docs/google-tabulka.md`](docs/google-tabulka.md) | statistiky do tabulky Google (skript `docs/google-tabulka.gs`) |
| [`docs/koncepce.md`](docs/koncepce.md) | proč je hra postavená takhle (převod na moduly a testy, 19. 10. 2026) |
| [`docs/ucebnice-alter.md`](docs/ucebnice-alter.md) | obsah podle učebnic ALTER |
| `docs/hosting-a-domena.md`, `docs/navod-registrator-a-hosting.md` | doména a hosting na Cloudflare |

Rodinný kontext (co Adam umí, rozhodnutí) je v osobní znalostní bázi (`osobni/deti.md`, sekce „Čtecí hra Adamův důl“).

## Struktura

| Kde | Co tam je |
|---|---|
| `index.html` | kostra stránky (obrazovky a dialogy), skript `src/main.js` |
| `src/content/` | obsah jako data (TypeScript) |
| `src/logic/` | herní pravidla bez obrazovky (TypeScript, testovaná) |
| `src/save/` | uložený postup: tvar, `SCHEMA`, `migrate()`, export a import |
| `src/game/`, `src/levels/`, `src/world/`, `src/rewards/` | běžící kolo, patra, scény a odměny |
| `src/ui/`, `src/app/`, `src/gfx/`, `src/audio/`, `src/core/` | obrazovky a nastavení, služby aplikace, grafika, hlas, sdílený stav |
| `worker/` | server na Cloudflare (API, databáze D1, upozornění) |
| `public/` | `version.json` (novinky), manifest, ikony, `sw.js` |
| `tests/unit/`, `tests/e2e/` | Vitest (pravidla) a Playwright (hra v prohlížeči) |

Podrobně v [technické dokumentaci](docs/technicka-dokumentace.md#3-struktura-kódu).

## Vývoj a testování

```
npm install                  # jednou
npx playwright install chromium
npm run dev                  # hra na http://localhost:5173 s okamžitým překreslením
npm test                     # typy + unit testy + testy v prohlížeči (vše musí projít)
npm run test:unit            # jen pravidla (sekundy)
npx wrangler dev --local     # server lokálně (předtím: npx wrangler d1 migrations apply schoolcraft --local)
```

- Testy v prohlížeči běží proti sestavené hře (`npm run build` + `vite preview` na 127.0.0.1:4173), hlas je nahrazený
  záznamem (`window.__said`), písma z Googlu a server se blokují. Hra vystavuje `window.__adam` (běžící kolo a uložený stav).
- Lokálně běží nejvýš 2 prohlížeče: Avast na Ondřejově počítači zadrhává víc souběžných spojení na 127.0.0.1.
- Push na `main` nasadí hru na schoolcraft.games (Cloudflare) i GitHub Pages, jen se zelenými testy.

## Nápady na další rozvoj

- Z review 19. 10. 2026 zatím neudělané: kratší řeč po kole, jména psa podle čtení, účinek Efektivity,
  vyjetí z dráhy vrátí prst jen kousek.
- Až dojdou fáze Netheru, mláďata nebo místa v Přerově, přidat další (pravidlo v `CLAUDE.md`).
