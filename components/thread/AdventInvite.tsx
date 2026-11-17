import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThreadPalette } from '@/constants/Colors';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticImpactLight, hapticSelection } from '@/utils/haptics';
import { findCatalogItem, getLocalizedPlanText, type CatalogItem } from '@/utils/planCatalog';
import {
  ADVENT_PLAN_ID,
  christmasSeasonYear,
  datedWindow,
  formatLongDate,
  isSeasonalPlanOffered,
  todayIndex,
} from '@/utils/seasonalPlans';
import {
  getAdventRemindMe,
  rescheduleReadingReminders,
  requestNotificationPermission,
  setAdventRemindMe,
} from '@/utils/readingReminders';
import { contrastRatio, readableOn } from '@/utils/contrast';

const DISMISS_KEY = 'svb.advent.cardDismissed';
const ADVENT_ACCENT = '#6A4C93';

type Props = {
  palette: ThreadPalette;
  language: string;
  /** Advent already started (or paused) — the card hides. */
  started: boolean;
  /** Start Advent; `startIndex` is the 0-based story a late joiner chose. */
  onJoin: (item: CatalogItem, startIndex: number, beforeStart: boolean) => void | Promise<void>;
  /** Tap on the card body. */
  onOpenPlan?: () => void;
};

/**
 * Invitation to Advent, shown from November until Christmas Eve to readers
 * who haven't joined. Before Advent: Join / Remind me. During Advent: Join,
 * with a choice of today's reading or Day 1.
 */
export default function AdventInvite({ palette, language, started, onJoin, onOpenPlan }: Props) {
  const { t } = useTranslation();
  const [hidden, setHidden] = useState(true);
  const [reminded, setReminded] = useState(false);
  const now = new Date();
  const item = findCatalogItem(ADVENT_PLAN_ID);
  const window = item ? datedWindow(ADVENT_PLAN_ID, item.stories.length, now) : null;
  const index = window ? todayIndex(window, now) : -1;
  const inSeason = !!item && !!window && isSeasonalPlanOffered(ADVENT_PLAN_ID, now) && index < window.days;
  const season = String(christmasSeasonYear(now));

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [dismissed, remindMe] = await Promise.all([
          AsyncStorage.getItem(DISMISS_KEY),
          getAdventRemindMe(),
        ]);
        if (!alive) return;
        setHidden(dismissed === season);
        setReminded(remindMe);
      } catch {
        if (alive) setHidden(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [season]);

  const dismiss = useCallback(async () => {
    void hapticSelection();
    setHidden(true);
    try {
      await AsyncStorage.setItem(DISMISS_KEY, season);
    } catch {
      // Hidden for this session regardless.
    }
  }, [season]);

  const remindMe = useCallback(async () => {
    void hapticImpactLight();
    const granted = await requestNotificationPermission();
    if (!granted) {
      Alert.alert(t('UI.advent.notificationsOffTitle'), t('UI.advent.notificationsOffBody'));
      return;
    }
    await setAdventRemindMe(true);
    setReminded(true);
    await rescheduleReadingReminders();
  }, [t]);

  if (!item || !window || !inSeason || started || hidden) return null;

  const beforeStart = index < 0;
  const kicker = beforeStart
    ? t('UI.advent.cardKicker', { date: formatLongDate(window.start, language) })
    : t('UI.advent.cardKickerLive', { n: index + 1 });

  const join = () => {
    void hapticImpactLight();
    if (index >= 1) {
      Alert.alert(
        t('UI.advent.lateTitle', { date: formatLongDate(window.start, language) }),
        t('UI.advent.lateBody', { n: index + 1 }),
        [
          { text: t('UI.alerts.cancel'), style: 'cancel' },
          { text: t('UI.advent.lateFromStart'), onPress: () => void onJoin(item, 0, false) },
          { text: t('UI.advent.lateToday'), onPress: () => void onJoin(item, index, false) },
        ]
      );
      return;
    }
    void onJoin(item, 0, beforeStart);
  };

  const accent = readableOn(ADVENT_ACCENT, palette.surf);
  const onAccent = contrastRatio('#FFFFFF', accent) >= 4.5 ? '#FFFFFF' : palette.bg;

  return (
    <Pressable
      onPress={onOpenPlan}
      style={[styles.card, { backgroundColor: palette.surf, borderColor: accent }]}
      accessibilityRole="button"
    >
      <View style={styles.header}>
        <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text>
        <Pressable onPress={dismiss} hitSlop={12} accessibilityLabel={t('UI.advent.dismiss')}>
          <Text style={{ color: palette.mute, fontSize: 12 }}>✕</Text>
        </Pressable>
      </View>
      <Text style={[styles.title, { color: palette.ink }]}>{getLocalizedPlanText(item, 'title', language)}</Text>
      <Text style={[styles.body, { color: palette.mute }]}>{t('UI.advent.cardBody')}</Text>
      <View style={styles.actions}>
        <Pressable onPress={join} hitSlop={8} style={[styles.primary, { backgroundColor: accent }]}>
          <Text style={[styles.primaryText, { color: onAccent }]}>{t('UI.advent.join')}</Text>
        </Pressable>
        {beforeStart && (
          <Pressable
            onPress={reminded ? undefined : remindMe}
            disabled={reminded}
            hitSlop={8}
            style={[styles.secondary, { borderColor: reminded ? palette.hair : accent }]}
          >
            <Text style={[styles.secondaryText, { color: reminded ? palette.mute : accent }]}>
              {reminded ? `✓ ${t('UI.advent.reminderSet')}` : t('UI.advent.remindMe')}
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  kicker: { flex: 1, fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '600', marginTop: 2 },
  body: { fontSize: 13, lineHeight: 18, marginTop: 3 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 10, flexWrap: 'wrap' },
  primary: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7 },
  primaryText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  secondary: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6 },
  secondaryText: { fontSize: 11, fontWeight: '600', letterSpacing: 0.8, textTransform: 'uppercase' },
});
