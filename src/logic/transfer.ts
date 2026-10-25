// Přenos hráče a postupu textem (zpráva, e-mail). Messenger umí z „":[" udělat smajlíka 🙁 (Vašek, 25. 10. 2026),
// proto se nově posílá zakódovaně (base64, jen písmena a číslice) a starý text se smajlíky se opraví.
const SMILEYS: [RegExp, string][] = [[/🙁|☹️|☹/g, ':['], [/😕/g, ':/'], [/😃|😀/g, ':D'], [/🙂|😊/g, ':)'], [/😮/g, ':O'], [/😛/g, ':P']];

const b64 = (s: string): string => { let bin = ''; for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b); return btoa(bin); };
const unb64 = (s: string): string => new TextDecoder().decode(Uint8Array.from(atob(s), c => c.charCodeAt(0)));

export const packText = (prefix: string, obj: unknown): string => prefix + b64(JSON.stringify(obj));
// vrátí objekt, nebo null; přijme zakódovaný i starý čitelný tvar (i se smajlíky po messengeru)
export function unpackText(prefix: string, text: string): unknown {
  let t = (text || '').trim();
  if (t.startsWith(prefix)) t = t.slice(prefix.length);
  t = t.trim();
  try {
    if (t.startsWith('{')) {
      // e-mail dlouhý řádek zalomí: konce řádků v JSON nejsou potřeba
      let j = t.replace(/\s*[\r\n]+\s*/g, ' ');
      for (const [re, s] of SMILEYS) j = j.replace(re, s);
      return JSON.parse(j);
    }
    return JSON.parse(unb64(t.replace(/\s+/g, '')));
  } catch { return null; }
}
