import { describe, expect, it } from 'vitest';
import { packText, unpackText } from '../../src/logic/transfer';
import { importPlayer, exportPlayer } from '../../src/logic/player';
import { defaults, exportText, importText } from '../../src/save/schema';

// text, který Vašek dostal přes messenger 25. 10. 2026 (z „":[" se stal smajlík 🙁)
const VASEK = 'SCHOOLCRAFT-HRAC:{"v":1,"name":"Víťa","voc":"Víťo","poss":"Víťův","gender":"m","family":[{"id":"fmvmk8urq","name":"máma Terka","gen":"mámy Terky","f":false,"hair":"#6b4a2a","top":"#8800a3","long":true,"glasses":true,"role":"mom","lines":{"cheers"🙁"Ty jsi můj šikovný kluk!","Jsi nejlepší!","Ještě kousek a budeš první!"],"enc"🙁"Zkus to ještě jednou!","Mně to taky napoprvé nešlo."],"hello":"Ahoj Víťo, tady máma. Pusť se do toho!"}},{"id":"fmvmke520","name":"táta Vašek","gen":"táty Vaška","f":false,"hair":"#6b4a2a","top":"#3f9b3a","beard":true,"lines":{"cheers"🙁"Jsem říkal, že jsi borec!","Je jsi šikovný po mně!","Nepřestávej kopat!"],"enc"🙁"Znovu a lépe!"],"hello":"Ahoj Vítku, tady táta! Dneska vyhraješ!"}}],"friends":[]}';

describe('přenos textem přes messenger', () => {
  it('Vaškův rozbitý text (smajlíky místo „:[“) se vloží celý', () => {
    const p = importPlayer(VASEK)!;
    expect(p.name).toBe('Víťa');
    expect(p.family.map(f => f.name)).toEqual(['máma Terka', 'táta Vašek']);
    expect(p.family[0].f).toBe(true); // máma je žena, i když v souboru „f": false
    expect(p.family[0].lines!.cheers).toEqual(['Ty jsi můj šikovný kluk!', 'Jsi nejlepší!', 'Ještě kousek a budeš první!']);
    expect(p.family[1].lines!.enc).toEqual(['Znovu a lépe!']);
  });
  it('nový tvar je zakódovaný: žádné „:[“ ani mezery, přežije zalomení', () => {
    const t = exportPlayer(importPlayer(VASEK)!);
    expect(t).toMatch(/^SCHOOLCRAFT-HRAC:[A-Za-z0-9+/=]+$/);
    expect(importPlayer(t.replace(/(.{60})/g, '$1\n'))!.family.length).toBe(2);
  });
  it('postup: zakódovaný tam i zpět, starý čitelný se smajlíky taky; bez přihlášení k serveru', () => {
    const s = defaults(); s.total = 9; s.log = [{ t: 1, d: '2026-10-24', level: 'letters', clean: 8, done: 8, len: 8, ok: true, quit: false, secs: 40 }];
    s.cloud.secret = 'tajne';
    const t = exportText(s);
    expect(t).not.toContain('tajne');
    expect(importText(t)!.total).toBe(9);
    const old = 'ADAMUV-DUL-POSTUP:' + JSON.stringify({ ...s, cloud: undefined }).replace(/:\[/g, '🙁');
    expect(importText(old)!.log.length).toBe(1);
    expect(unpackText('X:', packText('X:', { a: 'ěščřžý' }))).toEqual({ a: 'ěščřžý' });
  });
});
