import React, { useEffect, useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import Questions from '@/components/Questions';
import { hasQuestionsData, getQuestionsUnified } from '@/api/question-functions';
import { getAppState } from '@/api/sqlite';
import { ThreadColors } from '@/constants/Colors';
import { DUR } from '@/constants/Motion';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticSelection } from '@/utils/haptics';

export default function TalkAboutCard({ segmentId }: { segmentId: string }) {
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const exists = language === 'en' ? await hasQuestionsData() : true;
      if (!exists) return;
      const audience = ((await getAppState('questionAudience')) || 'family') as 'school' | 'family' | 'smallgroup';
      const questions = await getQuestionsUnified(segmentId, audience, 1, language.startsWith('fr') ? 'fr' : 'en');
      if (alive) setCount(questions.length);
    })().catch(() => {
      if (alive) setCount(0);
    });
    return () => {
      alive = false;
    };
  }, [language, segmentId]);

  if (count === 0) return null;

  return (
    <Animated.View layout={LinearTransition.duration(DUR.base)} style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
      <Pressable
        onPress={() => {
          void hapticSelection();
          setOpen((value) => !value);
        }}
        style={styles.header}
      >
        <View>
          <Text style={[styles.kicker, { color: palette.mute }]}>{t('UI.thread.talkAboutIt')}</Text>
          <Text style={[styles.count, { color: palette.ink }]}>
            {count} {t('UI.thread.questions')}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: palette.acc }]}>{open ? '⌃' : '›'}</Text>
      </Pressable>
      {open && <Questions segmentId={segmentId} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 14, marginTop: 16, borderWidth: 1, borderRadius: 16, overflow: 'hidden' },
  header: { minHeight: 44, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  kicker: { fontSize: 9, letterSpacing: 1.4, textTransform: 'uppercase' },
  count: { fontSize: 15, marginTop: 2 },
  chevron: { fontSize: 18 },
});
