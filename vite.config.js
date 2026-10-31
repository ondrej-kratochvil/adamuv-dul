import { defineConfig } from 'vite';

// Content Security Policy (31. 10. 2026): jen při sestavení (vývojový server Vite potřebuje vložené skripty a websocket).
// Skripty jen z vlastní adresy; připojení na server Schoolcraft a skript tabulky Google; obrázky i z plátna (data:) a fotky (blob:).
export const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'",
  "connect-src 'self' https://schoolcraft.games https://script.google.com https://script.googleusercontent.com",
  "media-src 'self' blob:", "worker-src 'self'", "manifest-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
].join('; ');
const csp = { name: 'csp', apply: 'build', transformIndexHtml: html => html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${CSP}">`) };

// relativní cesty: hra běží na https://schoolcraft.games i na staré adrese https://ondrej-kratochvil.github.io/adamuv-dul/
export default defineConfig({
  base: './',
  plugins: [csp],
  build: { outDir: 'dist', assetsInlineLimit: 0, target: 'es2020' },
  test: { include: ['tests/unit/**/*.test.{js,ts}'] },
});
