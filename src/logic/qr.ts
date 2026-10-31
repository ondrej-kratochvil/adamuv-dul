// Přenos hráče QR kódem (Ondřej 31. 10. 2026): kód je v části adresy za #, takže ho jde naskenovat i fotoaparátem
// telefonu (otevře hru) a nikdy se neposílá na server ani do záznamů Cloudflare.
import { parseCode } from './cloud';

export const SITE = 'https://schoolcraft.games/';
export const codeUrl = (code: string): string => `${SITE}#kod=${code}`;
// kód z naskenovaného textu nebo z adresy (celá adresa, jen #kod=…, nebo samotný kód)
export function codeFromText(text: string): string | null {
  const t = (text || '').trim();
  const m = /#kod=([^&\s]+)/.exec(t);
  const c = m ? decodeURIComponent(m[1]) : t;
  const p = parseCode(c);
  return p ? `${p.id}.${p.secret}` : null;
}
