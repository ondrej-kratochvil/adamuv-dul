import { describe, expect, it } from 'vitest';
import { inAppBrowser } from '../../src/logic/inapp';

describe('vestavěný prohlížeč aplikace (logic/inapp.ts)', () => {
  it('pozná LinkedIn, Facebook a Instagram, běžný prohlížeč ne', () => {
    expect(inAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [LinkedInApp]/9.30')).toBe('LinkedIn');
    expect(inAppBrowser('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36 [FB_IAB/FB4A;FBAV/480.0]')).toBe('Facebook');
    expect(inAppBrowser('Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Mobile/15E148 Instagram 350.0')).toBe('Instagram');
    expect(inAppBrowser('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1')).toBeNull();
    expect(inAppBrowser('Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Mobile Safari/537.36')).toBeNull();
  });
});
