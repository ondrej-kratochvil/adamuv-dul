// Vestavěný prohlížeč aplikace (odkaz otevřený z LinkedInu, Facebooku, Messengeru, Instagramu): často si nepamatuje
// uložená data, takže hra po každém otevření začíná znovu a na serveru vzniká nový účet (10. 11. 2026: jeden hráč
// šest účtů za 10 minut). Úvodní nastavení pak rodiči poradí otevřít hru v běžném prohlížeči.
const APPS: [RegExp, string][] = [
  [/LinkedInApp/i, 'LinkedIn'],
  [/FBAN|FBAV|FB_IAB|FBIOS/i, 'Facebook'],
  [/Messenger|MESSENGER/, 'Messenger'],
  [/Instagram/i, 'Instagram'],
];
export function inAppBrowser(ua: string): string | null {
  for (const [re, name] of APPS) if (re.test(ua)) return name;
  return null;
}
