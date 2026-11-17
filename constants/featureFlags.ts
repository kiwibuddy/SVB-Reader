export const FF = {
  FRENCH_ENABLED: false,
  /**
   * English Bible as a separate file asset instead of inside the JS bundle,
   * so updates are about half the size. A build-time switch: set
   * EXPO_PUBLIC_BIBLE_AS_ASSET=1 when bundling (metro.config.js swaps the
   * loader). Off until tested on real iPhone and Android phones.
   */
  BIBLE_AS_ASSET: process.env.EXPO_PUBLIC_BIBLE_AS_ASSET === '1',
} as const;
