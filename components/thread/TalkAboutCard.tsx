import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Pressable, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { hasQuestionsData, getQuestionsUnified, type AudienceType } from '@/api/question-functions';
import { getAppState, setAppState } from '@/api/sqlite';
import { ThreadColors } from '@/constants/Colors';
import { DUR } from '@/constants/Motion';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticSelection } from '@/utils/haptics';

const AUDIENCES: { key: AudienceType; labelEn: string; labelFr: string }[] = [
  { key: 'family', labelEn: 'Family', labelFr: 'Famille' },
  { key: 'school', labelEn: 'School', labelFr: 'École' },
  { key: 'smallgroup', labelEn: 'Small Group', labelFr: 'Petit groupe' },
];

export default function TalkAboutCard({ segmentId }: { segmentId: string }) {
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';

  const [audience, setAudience] = useState<AudienceType>('family');
  const [questionSet, setQuestionSet] = useState<1 | 2>(1);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    getAppState('questionAudience').then((val) => {
      if (val === 'school' || val === 'family' || val === 'smallgroup') {
        setAudience(val);
      }
    }).catch(() => {});
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      if (lang === 'en') {
        const exists = await hasQuestionsData();
        if (!exists) { setHasData(false); setQuestions([]); setLoading(false); return; }
      }
      const result = await getQuestionsUnified(segmentId, audience, questionSet, lang);
      setQuestions(result);
      setHasData(true);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [segmentId, audience, questionSet, lang]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const handleAudience = (key: AudienceType) => {
    if (key === audience) return;
    void hapticSelection();
    setAudience(key);
    setQuestionSet(1);
    void setAppState('questionAudience', key);
  };

  const handleRefresh = () => {
    void hapticSelection();
    setQuestionSet((prev) => (prev === 1 ? 2 : 1));
  };

  if (!hasData && !loading && questions.length === 0) return null;

  return (
    <Animated.View
      layout={LinearTransition.duration(DUR.base)}
      style={[styles.card, { backgroundColor: palette.surf, borderColor: palette.hair }]}
    >
      {/* Header */}
      <Text style={[styles.kicker, { color: palette.mute }]}>
        {t('UI.thread.talkAboutIt')}
      </Text>

      {/* Audience tabs */}
      <View style={styles.tabs}>
        {AUDIENCES.map((item) => {
          const active = audience === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => handleAudience(item.key)}
              style={[
                styles.tab,
                { borderColor: active ? palette.acc : palette.hair },
                active && { backgroundColor: isDarkMode ? palette.prinFill : palette.prinFill },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: active ? palette.acc : palette.mute },
                  active && { fontWeight: '600' },
                ]}
              >
                {lang === 'fr' ? item.labelFr : item.labelEn}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Questions */}
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="small" color={palette.acc} style={{ paddingVertical: 16 }} />
        ) : questions.length > 0 ? (
          questions.map((q, i) => (
            <Animated.View
              key={`${audience}-${questionSet}-${i}`}
              entering={FadeIn.duration(DUR.quick).delay(i * 40)}
              style={styles.questionRow}
            >
              <View style={[styles.bullet, { backgroundColor: palette.acc }]} />
              <Text style={[styles.questionText, { color: palette.ink }]}>{q}</Text>
            </Animated.View>
          ))
        ) : (
          <Text style={[styles.empty, { color: palette.mute }]}>
            {lang === 'fr' ? 'Pas de questions disponibles' : 'No questions available'}
          </Text>
        )}
      </View>

      {/* Refresh */}
      {questions.length > 0 && (
        <Pressable onPress={handleRefresh} style={[styles.refresh, { borderColor: palette.hair }]}>
          <Text style={[styles.refreshText, { color: palette.acc }]}>
            {lang === 'fr' ? 'Autre série' : 'More questions'} ↻
          </Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginTop: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    paddingTop: 14,
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
  },
  tabs: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 0.2,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 7,
    marginRight: 10,
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  empty: {
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 12,
  },
  refresh: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 11,
    alignItems: 'center',
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});
