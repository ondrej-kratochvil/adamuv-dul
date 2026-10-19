# Hlášky rodiny: návrh k odsouhlasení

> **Co:** návrh nových hlášek rodiny ve hře (po povedeném kole, po nepovedeném kole, „dnes ti fandí“ na úvodní obrazovce)
> **Stav:** hotovo (Ondřej odsouhlasil 19. 10. 2026; místa smí zůstat ve veřejném repu; ranní hláška mámy ve všední dny o škole). Platné znění je v `src/content/family-lines.ts`.
> **Stav k:** 19. 10. 2026
> **Souhrn:**
> - Dnes: 9 společných pochval a 4 povzbuzení pro všechny, vlastní věty má jen Davídek.
> - Nově: každý člen rodiny vlastní věty podle toho, co Adam s ním zná (Újezdec, chata, Zavadilka, Biskupice, byt naproti).
> - Máma připomíná jídlo, zuby a spaní podle času a po delším hraní řekne, ať si dá pauzu.
> - Společné věty zůstanou jako doplněk, aby se nic neopakovalo moc často.
> **Souvisí:** `src/world/family.js` (`FAMILY`, `CHEERS`, `ENCOURAGE`), `CLAUDE.md` (podoby a údaje o rodině jen podle Ondřeje)

## Jak to bude fungovat

- Po povedeném kole promluví jeden člen rodiny (pořád náhodně, nikdy dvakrát po sobě stejný).
  Ze 70 % řekne svou vlastní větu, ze 30 % společnou. Stejnou větu hra zopakuje nejdřív po pěti jiných.
- Po nepovedeném kole stejně, jen s povzbuzením.
- Na úvodní obrazovce „Dneska ti fandí…“ má každý svůj pozdrav.
- Hlas čte všechny věty stejným českým hlasem. U Davídka jsou schválně dětská slova („popolu“).

## Babička Iva (dům v Újezdci, zahrada u domu a u rybníka)

**Po povedeném kole**
1. Adame, jsem na tebe pyšná! Až přijedeš do Újezdce, všechno mi povíš.
2. Takového šikovného kluka bych potřebovala na zahradě u rybníka!
3. Výborně! To si zasloužíš jahody ze zahrady.
4. Ty už čteš jako velký školák. Babička má radost!
5. Paráda! Až budeš v Újezdci, postavíme spolu něco u rybníka.
6. Šikula! Zahrada by potřebovala takového pomocníka.
7. To je můj Adámek! Pošlu ti pusu až do Přerova.

**Po nepovedeném kole**
1. Nevadí, Adame. I na zahradě to někdy hned nevyroste.
2. Zkus to znovu, babička ti drží palce!
3. Pomaloučku a pozorně. Ty to zvládneš.

**Dnes ti fandí**
- Ahoj Adame, tady babička Iva z Újezdce. Zahraj si, fandím ti!

## Děda Marek (chata, kde se pořád něco opravuje a staví)

**Po povedeném kole**
1. Výborně, Adame! Takového stavitele potřebuju na chatě.
2. Na chatě zase něco opravujeme. Pomůžeš mi příště?
3. Šikula! Ty bys postavil chatu sám.
4. Takhle se kope! Ani já bych to líp nezvládl.
5. Paráda! Na chatě by se hodil tvůj diamantový krumpáč.
6. To je práce! Až přijedeš na chatu, postavíme něco spolu.
7. Adame, ty jsi jednička. Děda má radost!

**Po nepovedeném kole**
1. Nevadí. Na chatě se taky něco napoprvé nepovede, a pak se to opraví.
2. Zkus to znovu, stavitel to nevzdává!
3. Pořádně se podívej a zkus to ještě jednou. Věřím ti.

**Dnes ti fandí**
- Ahoj Adame, tady děda Marek. Na chatě zase něco stavím, a ty si zahraj!

## Děda Bob (byt naproti přes ulici, domy v Biskupicích)

**Po povedeném kole**
1. Výborně, Adame! Až půjdeš naproti k nám, ukážeš mi to?
2. V Biskupicích máme domy na opravu. Takového stavitele potřebujeme!
3. Postavíš nám k bytu výtah, Adame? Ty bys to zvládl!
4. Šikovný kluk! Děda je na tebe pyšný.
5. To je výkon! Mávám ti z okna naproti.
6. Paráda! Až opravíme domy v Biskupicích, budeš tam stavbyvedoucí.
7. Ty už čteš jako velký školák! Děda koukal.

**Po nepovedeném kole**
1. Nevadí, Adame. Zkus to znovu, děda ti fandí.
2. Pomalu a pozorně. Spěchat se nemusí.
3. I velcí stavitelé někdy něco pokazí. Zkus to ještě jednou.

**Dnes ti fandí**
- Ahoj Adame, tady děda Bob z bytu naproti. Zahraj si, mávám ti z okna!

## Babička Jindra (byt naproti, chalupa na Zavadilce se zahradou)

**Po povedeném kole**
1. Výborně, Adame! Jsem na tebe pyšná.
2. Na Zavadilce je na zahradě pořád práce. Takového pomocníka bych potřebovala!
3. Šikulka! Až přijedeš na Zavadilku, zasadíme spolu kytičky.
4. Paráda! Přijď k nám naproti, upeču ti něco dobrého.
5. To je můj šikovný vnouček!
6. Na Zavadilce bys mohl kopat záhonky. Kopat ti jde!
7. Mám z tebe velkou radost, Adame.

**Po nepovedeném kole**
1. Nevadí, broučku. Zkus to znovu.
2. I na zahradě se musí čekat, než něco vyroste. Příště to dáš!
3. Babička ti drží palce. Ještě jednou!

**Dnes ti fandí**
- Ahoj Adame, tady babička Jindra. Zahraj si, a pak přijď k nám naproti!

## Táta Ondra

**Po povedeném kole**
1. Šikovný jsi po mně, Adame!
2. Jsem na tebe hrdý.
3. To je můj kluk! Tohle bych v první třídě nezvládl.
4. Výborně! Šikovnost máš po tátovi.
5. Paráda, Adame. Jsem na tebe moc pyšný.
6. Ty už čteš sám! Táta má velkou radost.
7. Jedničkář! Plácneme si, až přijdu domů.

**Po nepovedeném kole**
1. Nevadí, Adame. I táta se musel učit. Zkus to znovu.
2. Chybami se člověk učí. Příště to dáš!
3. Pozorně poslouchej a jde to. Věřím ti.

**Dnes ti fandí**
- Ahoj Adame, tady táta. Jsem na tebe hrdý, zahraj si!

## Máma Pája

Máma chválí jako ostatní, ale hlavně se stará. Její připomínky se řídí časem v tabletu:

| Kdy | Co řekne (místo pochvaly, jednou za den v daném čase) |
|---|---|
| 6.30 až 8.00 ve všední dny | Výborně, Adame! A teď hurá se nachystat do školy. |
| 6.30 až 9.00 o víkendu | Výborně, Adame! A teď hurá nasnídat se. |
| 11.30 až 13.00 | Šikula! Pojď na oběd, ať máš sílu na kopání. |
| 17.30 až 19.00 | Paráda! Za chvíli je večeře, tak už dohraj. |
| od 19.30 | Výborně! Teď ale čistit zuby, koupat a do postele. |
| po 30 minutách hraní za den | Dneska už jsi hrál dlouho, Adame. Pojď si odpočinout, hra počká. |

V těchto chvílích promluví máma přednostně, ne náhodou. Mimo ně normálně chválí:

**Po povedeném kole**
1. Výborně, Adame! Máma je na tebe pyšná.
2. Ty jsi můj šikula!
3. Paráda! Až dohraješ, dáme si pusu.
4. To je můj velký školák!
5. Šikovný! Ale nezapomeň se napít.
6. Mám z tebe radost, broučku.

**Po nepovedeném kole**
1. Nevadí, broučku. Zkus to znovu.
2. Pomalu a pozorně, ty to dáš.
3. Máma ti fandí!

**Dnes ti fandí**
- Ahoj Adame, tady máma. Zahraj si, ale ne moc dlouho!

## Brácha Davídek (malý, ještě nevyslovuje)

**Po povedeném kole**
1. Do toho, Adam! Chceš popolu?
2. Hulá! Adam to umí!
3. Já taky kopat! Já taky!
4. Adam je silný!
5. Bláško, ty jsi nejlepší!
6. Ještě, ještě! Adam kope!

**Po nepovedeném kole**
1. Nevadí, Adam! Znovu!
2. Adam, já ti fandím!

**Dnes ti fandí**
- Ahoj Adam! Já fandím! Chceš popolu?

## K rozhodnutí

1. **Veřejnost:** hra i její kód jsou na GitHubu veřejné. Kdo zná adresu, uvidí jména míst (Újezdec, Zavadilka, Biskupice,
   byt naproti) a vztahy. Nechat takto, nebo místa zobecnit („u babičky na zahradě“, „na chalupě“)?
2. **Výtah u dědy Boba:** věta „Postavíš nám výtah?“ nezmiňuje, že děda špatně chodí. Nechat, nebo vynechat úplně?
3. **Máma a čas:** hodí se časy a 30 minut hraní za den? Má hra po 30 minutách jen připomenout, nebo i něco omezit
   (třeba nedávat další smaragdy)? Návrh: jen připomenout.
4. **Úpravy vět:** cokoli přepsat, škrtnout nebo doplnit (třeba oslovení, která rodina opravdu používá: Adámku, broučku, šikulo).
