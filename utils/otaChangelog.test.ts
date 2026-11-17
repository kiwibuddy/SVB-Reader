import uiEn from '@/assets/data/UI-ENG.json';
import uiFr from '@/assets/data/FRA-UI.json';
import { CURRENT_OTA_ID } from '@/utils/otaChangelog';

const OTA_KEYS = [
  'jsUpdateSummary',
  'jsUpdateWhatsNew',
  'jsUpdateDetails',
  'jsUpdateNotAppliedTitle',
  'jsUpdateNotAppliedBody',
] as const;

describe('ota changelog strings', () => {
  it('has a current OTA id', () => {
    expect(CURRENT_OTA_ID.length).toBeGreaterThan(0);
  });

  it('keeps EN and FR settings OTA keys in sync', () => {
    const en = (uiEn as any).UI.settings;
    const fr = (uiFr as any).UI.settings;
    for (const key of OTA_KEYS) {
      expect(typeof en[key]).toBe('string');
      expect(en[key].length).toBeGreaterThan(0);
      expect(typeof fr[key]).toBe('string');
      expect(fr[key].length).toBeGreaterThan(0);
    }
  });
});
