// Věty o youtuberech (Ondřej 20. 10. 2026)
import { describe, expect, it } from 'vitest';
import { YOUTUBER_LINES, YT_SHARE } from '../../src/content/youtuber-lines';

describe('věty o youtuberech', () => {
  it('jsou krátké, k přečtení a zazní jen občas', () => {
    for (const l of [...YOUTUBER_LINES.ok, ...YOUTUBER_LINES.fail]) { expect(l.length).toBeLessThan(90); expect(l).toMatch(/[.!?]$/); expect(l, l).toMatch(/^[A-Za-zÁČĎÉĚÍŇÓŘŠŤÚŮÝŽáčďéěíňóřšťúůýž0-9 ,.!?:'-]+$/); } // jen čeština, žádná azbuka
    expect(YOUTUBER_LINES.ok.length).toBeGreaterThanOrEqual(5);
    expect(YT_SHARE).toBeLessThanOrEqual(.3);
  });
});
