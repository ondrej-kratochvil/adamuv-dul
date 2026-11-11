import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

// Content Security Policy (31. 10. 2026): jen při sestavení (vývojový server Vite potřebuje vložené skripty a websocket).
// Skripty jen z vlastní adresy; připojení na server Schoolcraft a skript tabulky Google; obrázky i z plátna (data:) a fotky (blob:).
export const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "font-src 'self'",
  "connect-src 'self' https://schoolcraft.games https://script.google.com https://script.googleusercontent.com",
  "media-src 'self' blob:", "worker-src 'self'", "manifest-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
].join('; ');
// Zásady ochrany soukromí na https://schoolcraft.games/soukromi (Google Play chce veřejnou adresu, Schoolcraft 11. 11. 2026).
// Jediný zdroj textu je okno O hře v index.html (#aboutOverlay); tady se z něj při sestavení udělá samostatná stránka.
export function privacyPage(html) {
  const m = html.match(/<h2 id="aboutTitle">[\s\S]*?(?=<div class="actions">)/);
  if (!m) throw new Error('soukromi.html: v index.html chybí okno O hře (#aboutOverlay)');
  const body = m[0].replace('<h2 id="aboutTitle">O hře Schoolcraft</h2>', '<h1>Schoolcraft: o hře a ochrana soukromí</h1>').replace(/<p class="lbl-small" id="aboutVersion"><\/p>\s*/, '');
  return `<!doctype html>
<html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Schoolcraft: ochrana soukromí</title>
<style>body{font:17px/1.55 system-ui,sans-serif;max-width:46rem;margin:0 auto;padding:1rem 16px 3rem;color:#1d2a35;background:#f4f9fe}h1{font-size:1.5rem}h3{margin-top:1.6rem}li{margin:.35rem 0}a{color:#1a5fa3}</style>
</head><body>
${body.trim()}
<p><a href="./">Zpět do hry</a></p>
</body></html>
`;
}
const privacy = { name: 'soukromi', apply: 'build', generateBundle(_o, bundle) { const ix = bundle['index.html']; this.emitFile({ type: 'asset', fileName: 'soukromi.html', source: privacyPage(typeof ix?.source === 'string' ? ix.source : readFileSync('index.html', 'utf8')) }); } };
const csp = { name: 'csp', apply: 'build', transformIndexHtml: html => html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n<meta http-equiv="Content-Security-Policy" content="${CSP}">`) };

// relativní cesty: hra běží na https://schoolcraft.games i na staré adrese https://ondrej-kratochvil.github.io/adamuv-dul/
export default defineConfig({
  base: './',
  plugins: [csp, privacy],
  build: { outDir: 'dist', assetsInlineLimit: 0, target: 'es2020' },
  test: { include: ['tests/unit/**/*.test.{js,ts}'] },
});
