import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getAppState, setAppState } from '@/api/sqlite';
import { getBubbleTextColorSafe } from '@/scripts/getColors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticSelection } from '@/utils/haptics';
import { keyVerseSpans, parseKeyVerseRef } from '@/utils/keyVerse';
import { readableOn } from '@/utils/contrast';
import type { CompanionDay } from '@/utils/planCompanion';
import type { BibleBlock } from '@/types';

type Props = {
  day: CompanionDay;
  /** Story content used to resolve key-verse wording and speaker colour. */
  content?: BibleBlock[] | null;
  onFindInStory: (chapter: number, verse: number) => void;
};

/**
 * Coloured intro at the top of a plan story: week/day, short intro, key verse
 * on a light inset, and Find it in the story. Collapses after the first open.
 */
export default function PlanIntroCard({ day, content, onFindInStory }: Props) {
  const { isDarkMode } = useSyncAppSettings();
  const { t } = useTranslation();
  const seenKey = `companionIntroSeen:${day.planId}:${day.day}`;
  const [expanded, setExpanded] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    getAppState(seenKey)
      .then((val) => {
        if (!alive) return;
        setExpanded(val !== '1');
        setReady(true);
      })
      .catch(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, [seenKey]);

  const weekTitle = t(`UI.chronologicalPhases.${day.planId}.${day.phase}.title`, {
    defaultValue: day.phase,
  });

  const spans = useMemo(() => {
    const ref = day.keyVerses[0];
    if (!ref || !content) return [];
    return keyVerseSpans(content, ref);
  }, [content, day.keyVerses]);

  const firstRef = day.keyVerses[0] ? parseKeyVerseRef(day.keyVerses[0]) : null;
  const refLabel = firstRef ? `${firstRef.book} ${firstRef.chapter}:${firstRef.verse}` : '';

  const markSeen = useCallback(() => {
    void setAppState(seenKey, '1');
  }, [seenKey]);

  const collapse = useCallback(() => {
    void hapticSelection();
    setExpanded(false);
    markSeen();
  }, [markSeen]);

  const expand = useCallback(() => {
    void hapticSelection();
    setExpanded(true);
  }, []);

  const findIt = useCallback(() => {
    if (!firstRef) return;
    void hapticSelection();
    markSeen();
    setExpanded(false);
    onFindInStory(firstRef.chapter, firstRef.verse);
  }, [firstRef, markSeen, onFindInStory]);

  if (!ready) return null;

  const fill = day.colour;
  const insetBg = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.92)';

  if (!expanded) {
    return (
      <Pressable
        onPress={expand}
        accessibilityRole="button"
        style={[styles.card, styles.collapsed, { backgroundColor: fill }]}
      >
        <Text style={styles.kicker} numberOfLines={1}>
          {t('UI.companion.kicker', { week: weekTitle, day: day.day, total: day.total })}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: fill }]}>
      <Pressable onPress={collapse} accessibilityRole="button">
        <Text style={styles.kicker}>
          {t('UI.companion.kicker', { week: weekTitle, day: day.day, total: day.total })}
        </Text>
        <Text style={styles.intro}>{day.intro}</Text>
      </Pressable>

      {spans.length > 0 && (
        <View style={[styles.inset, { backgroundColor: insetBg }]}>
          <Text style={[styles.insetKicker, { color: readableOn(fill, insetBg) }]}>
            {t('UI.companion.keyVerse')}
          </Text>
          <Text style={styles.insetBody}>
            {spans.map((span, i) => (
              <Text
                key={`${span.colour}-${i}`}
                style={{ color: getBubbleTextColorSafe(span.colour, isDarkMode) }}
              >
                {span.text}
                {i < spans.length - 1 ? ' ' : ''}
              </Text>
            ))}
          </Text>
          {!!refLabel && (
            <Text style={[styles.ref, { color: readableOn(fill, insetBg) }]}>{refLabel}</Text>
          )}
        </View>
      )}

      {firstRef && (
        <Pressable onPress={findIt} accessibilityRole="button" style={styles.findBtn}>
          <Text style={styles.findText}>{t('UI.companion.findIt')}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 10,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  collapsed: {
    paddingVertical: 10,
  },
  kicker: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  intro: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
  inset: {
    marginTop: 12,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  insetKicker: {
    fontSize: 9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  insetBody: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
  },
  ref: {
    fontSize: 11,
    marginTop: 6,
    fontWeight: '600',
  },
  findBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  findText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
