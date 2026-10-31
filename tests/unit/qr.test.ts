// Přenos hráče QR kódem (src/logic/qr.ts) a knihovny QR: co se vyrobí, to se přečte
import { describe, expect, it } from 'vitest';
import qrcode from 'qrcode-generator';
import jsQR from 'jsqr';
import { codeFromText, codeUrl } from '../../src/logic/qr';

const CODE = '0f8fad5b-d9cb-469f-a165-70867728950e.' + 'ab'.repeat(32);

describe('QR kód hráče', () => {
  it('kód je v části za #, kterou prohlížeč na server neposílá', () => {
    expect(codeUrl(CODE)).toBe(`https://schoolcraft.games/#kod=${CODE}`);
    expect(new URL(codeUrl(CODE)).search).toBe('');
  });
  it('kód se pozná z celé adresy, z #kod=… i samotný; nesmysl ne', () => {
    expect(codeFromText(codeUrl(CODE))).toBe(CODE);
    expect(codeFromText(`#kod=${CODE}`)).toBe(CODE);
    expect(codeFromText(`  ${CODE}  `)).toBe(CODE);
    expect(codeFromText('https://schoolcraft.games/#kod=nesmysl')).toBeNull();
    expect(codeFromText('https://jina-stranka.cz')).toBeNull();
    expect(codeFromText('')).toBeNull();
  });
  it('vyrobený QR jde přečíst zpět (qrcode-generator a jsQR)', () => {
    const q = qrcode(0, 'M'); q.addData(codeUrl(CODE)); q.make();
    const n = q.getModuleCount(), px = 4, m = 4, size = (n + 2 * m) * px, data = new Uint8ClampedArray(size * size * 4).fill(255);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c))
      for (let y = 0; y < px; y++) for (let x = 0; x < px; x++) { const i = (((r + m) * px + y) * size + (c + m) * px + x) * 4; data[i] = data[i + 1] = data[i + 2] = 0; }
    expect(codeFromText(jsQR(data, size, size)!.data)).toBe(CODE);
  });
});
