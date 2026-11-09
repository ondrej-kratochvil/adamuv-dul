// Slovník pro přirozený hlas (požadavek Honzy 9. 11. 2026: Google smí číst jen věty ze hry, volný text čte hlas tabletu).
// Sebere slova ze všech textů ve zdrojácích hry (řetězce v src/**/*.js|ts, texty v index.html) do src/logic/tts-words.json.
// Spouští se ručně po změně textů: node scripts/tts-slova.mjs (test tests/unit/tts.test.ts hlídá, že je slovník aktuální).
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const WORDS_FILE = 'src/logic/tts-words.json';
// krátká slova (písmena, slabiky, „je“, „na“) projdou vždy, slovník je pro delší slova
export const SHORT = 3;

const words = (s, out) => { for (const w of s.toLocaleLowerCase('cs').match(/\p{L}+/gu) || []) if (w.length > SHORT) out.add(w); };

function files(dir) {
  return readdirSync(dir).flatMap(f => { const p = join(dir, f); return statSync(p).isDirectory() ? files(p) : /\.(js|ts)$/.test(f) ? [p] : []; });
}

export function collectWords(root = ROOT) {
  const out = new Set();
  for (const f of files(join(root, 'src')).sort()) {
    const src = ts.createSourceFile(f, readFileSync(f, 'utf8'), ts.ScriptTarget.Latest, true, f.endsWith('.ts') ? ts.ScriptKind.TS : ts.ScriptKind.JS);
    const walk = n => {
      if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) || ts.isTemplateHead(n) || ts.isTemplateMiddle(n) || ts.isTemplateTail(n)) { if (!/^(data:|[A-Za-z0-9+/=]{24,}$)/.test(n.text)) words(n.text, out); }
      // import cesty a klíče objektů nejsou věty, ale neškodí; komentáře se nečtou
      n.forEachChild(walk);
    };
    walk(src);
  }
  const html = readFileSync(join(root, 'index.html'), 'utf8').replace(/<(script|style)[\s\S]*?<\/\1>/g, '');
  words(html.replace(/<[^>]*?(?:aria-label|data-say|title|alt)="([^"]*)"[^>]*>/g, ' $1 ').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/g, ' '), out);
  return [...out].sort();
}

if (process.argv[1] && relative(process.argv[1], fileURLToPath(import.meta.url)) === '') {
  const list = collectWords();
  writeFileSync(join(ROOT, WORDS_FILE), JSON.stringify(list) + '\n');
  console.log(`${WORDS_FILE}: ${list.length} slov`);
}
