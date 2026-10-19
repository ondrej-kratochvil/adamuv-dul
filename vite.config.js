import { defineConfig } from 'vite';

// relativní cesty: hra běží na https://ondrej-kratochvil.github.io/adamuv-dul/
export default defineConfig({
  base: './',
  build: { outDir: 'dist', assetsInlineLimit: 0, target: 'es2020' },
  test: { include: ['tests/unit/**/*.test.{js,ts}'] },
});
