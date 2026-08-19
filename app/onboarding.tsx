import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';
import { useFirstLaunch } from '@/hooks/useFirstLaunch';
import { useTranslation } from '@/hooks/useTranslation';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { ThreadColors } from '@/constants/Colors';
import { DUR } from '@/constants/Motion';
import { todayStoryId } from '@/utils/continueTarget';
import { hapticSelection } from '@/utils/haptics';
import {
  FriendsDemo,
  KeepDemo,
  ShapeDemo,
  VoicesDemo,
} from '@/components/onboarding/OnboardingDemos';
import logger from '@/utils/logger';

const SCREENS = [
  { title: 'UI.onboarding.screen1Title', body: 'UI.onboarding.screen1Body' },
  { title: 'UI.onboarding.screen2Title', body: 'UI.onboarding.screen2Body' },
  { title: 'UI.onboarding.screen3Title', body: 'UI.onboarding.screen3Body' },
  { title: 'UI.onboarding.screen4Title', body: 'UI.onboarding.screen4Body' },
] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string | string[] }>();
  const fromAbout = (Array.isArray(from) ? from[0] : from) === 'about';
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { t } = useTranslation();
  const { isDarkMode, language, sizes } = useSyncAppSettings();
  const { markAsLaunched, isLoading } = useFirstLaunch();
  const reduced = useReducedMotion();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);
  const [token, setToken] = useState(1);
  const finishing = useRef(false);
  const skipTokenBump = useRef(true);

  useEffect(() => {
    if (skipTokenBump.current) {
      skipTokenBump.current = false;
      return;
    }
    setToken((value) => value + 1);
  }, [index]);

  const finish = useCallback(
    async (toStory: boolean) => {
      if (finishing.current) return;
      finishing.current = true;
      try {
        await markAsLaunched();
      } catch (error) {
        logger.warn('Onboarding mark failed, continuing', error);
      }
      if (toStory) {
        router.replace(`/${todayStoryId()}`);
      } else if (fromAbout) {
        router.back();
      } else {
        router.replace('/Home');
      }
    },
    [fromAbout, markAsLaunched, router]
  );

  const goNext = () => {
    void hapticSelection();
    if (index >= SCREENS.length - 1) {
      void finish(true);
      return;
    }
    const next = index + 1;
    listRef.current?.scrollToIndex({ index: next, animated: !reduced });
    setIndex(next);
  };

  const renderItem = ({ item, index: page }: { item: (typeof SCREENS)[number]; index: number }) => {
    const active = page === index;
    const demoProps = { active, token: active ? token : 0, palette, isDarkMode, language, t };
    return (
      <View style={[styles.page, { width, paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.top}>
          <Pressable onPress={() => void finish(false)} hitSlop={12} style={styles.skipHit}>
            <Text style={[styles.skip, { color: palette.mute }]}>{t('UI.onboarding.skip')}</Text>
          </Pressable>
        </View>
        <Animated.Text
          key={`h-${page}-${active ? token : 0}`}
          entering={reduced ? undefined : FadeInDown.duration(DUR.base)}
          style={[styles.headline, { color: palette.ink, fontSize: Math.round((sizes.body / 16) * 28) }]}
        >
          {t(item.title)}
        </Animated.Text>
        <Animated.Text
          key={`b-${page}-${active ? token : 0}`}
          entering={reduced ? undefined : FadeInDown.duration(DUR.base).delay(reduced ? 0 : 60)}
          style={[styles.body, { color: palette.mute, fontSize: sizes.body, lineHeight: Math.round(sizes.body * 1.4) }]}
        >
          {t(item.body)}
        </Animated.Text>
        <View style={styles.demo}>
          {page === 0 && <ShapeDemo {...demoProps} />}
          {page === 1 && <VoicesDemo {...demoProps} />}
          {page === 2 && <FriendsDemo {...demoProps} />}
          {page === 3 && <KeepDemo {...demoProps} />}
        </View>
        <View style={styles.footer}>
          <View style={styles.dots}>
            {SCREENS.map((_, dot) => (
              <View
                key={dot}
                style={[
                  styles.dot,
                  {
                    width: dot === index ? 16 : 6,
                    backgroundColor: dot === index ? palette.acc : palette.hair,
                  },
                ]}
              />
            ))}
          </View>
          <Pressable
            onPress={goNext}
            style={({ pressed }) => [
              styles.cta,
              { backgroundColor: palette.acc, transform: [{ scale: pressed ? 0.97 : 1 }] },
            ]}
          >
            <Text style={[styles.ctaLabel, { color: palette.bg }]}>
              {page === SCREENS.length - 1 ? t('UI.onboarding.startReading') : t('UI.onboarding.next')}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.boot, { backgroundColor: palette.bg }]}>
        <ActivityIndicator color={palette.acc} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: palette.bg }]}>
      <FlatList
        ref={listRef}
        data={SCREENS}
        keyExtractor={(item) => item.title}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          if (next !== index) setIndex(next);
        }}
        getItemLayout={(_, page) => ({ length: width, offset: width * page, index: page })}
        extraData={`${index}-${token}-${language}-${isDarkMode}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  boot: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  page: { flex: 1, paddingHorizontal: 20 },
  top: { minHeight: 44, alignItems: 'flex-end', justifyContent: 'center' },
  skipHit: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 },
  skip: { fontSize: 15 },
  headline: { fontWeight: '600', letterSpacing: -0.4, marginTop: 8 },
  body: { marginTop: 8, maxWidth: 360 },
  demo: { flex: 1, marginTop: 18, justifyContent: 'center' },
  footer: { gap: 14 },
  dots: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { height: 6, borderRadius: 3 },
  cta: { borderRadius: 13, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  ctaLabel: { fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600' },
});
