import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { getAppState, setAppState } from '@/api/sqlite';
import type { AudienceType } from '@/api/question-functions';
import { DUR } from '@/constants/Motion';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticSelection } from '@/utils/haptics';
import type { CompanionAudience, CompanionDay } from '@/utils/planCompanion';

const AUDIENCES: { key: CompanionAudience; labelEn: string; labelFr: string }[] = [
  { key: 'family', labelEn: 'Family', labelFr: 'Famille' },
  { key: 'school', labelEn: 'School', labelFr: 'École' },
  { key: 'smallgroup', labelEn: 'Small Group', labelFr: 'Petit groupe' },
];

type Props = { day: CompanionDay };

/**
 * Full week-colour Talk-about card for plan context: three audiences, four
 * questions, optional O Antiphon block, one-line closing. Replaces TalkAboutCard.
 */
export default function PlanQuestionsCard({ day }: Props) {
  const { language } = useSyncAppSettings();
  const { t } = useTranslation();
  const lang = language.startsWith('fr') ? 'fr' : 'en';
  const [audience, setAudience] = useState<CompanionAudience>('family');

  useEffect(() => {
    getAppState('questionAudience')
      .then((val) => {
        if (val === 'school' || val === 'family' || val === 'smallgroup') {
          setAudience(val as CompanionAudience);
        }
      })
      .catch(() => {});
  }, []);

  const handleAudience = (key: CompanionAudience) => {
    if (key === audience) return;
    void hapticSelection();
    setAudience(key);
    void setAppState('questionAudience', key as AudienceType);
  };

  const questions = day.questions[audience] || [];

  return (
    <View style={[styles.card, { backgroundColor: day.colour }]}>
      <Text style={styles.kicker}>{t('UI.thread.talkAboutIt')}</Text>

      <View style={styles.tabs}>
        {AUDIENCES.map((item) => {
          const active = audience === item.key;
          return (
            <Pressable
              key={item.key}
              onPress={() => handleAudience(item.key)}
              style={[styles.tab, active ? styles.tabActive : styles.tabIdle]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {lang === 'fr' ? item.labelFr : item.labelEn}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.body}>
        {questions.map((q, i) => (
          <Animated.View
            key={`${audience}-${i}`}
            entering={FadeIn.duration(DUR.quick).delay(i * 40)}
            style={styles.questionRow}
          >
            <View style={styles.bullet} />
            <Text style={styles.questionText}>{q}</Text>
          </Animated.View>
        ))}
      </View>

      {day.antiphon && (
        <View style={styles.antiphon}>
          <Text style={styles.antiphonLead}>{t('UI.companion.antiphonLead')}</Text>
          <Text style={styles.antiphonTitle}>{day.antiphon.title}</Text>
          <Text style={styles.antiphonPrayer}>{day.antiphon.prayer}</Text>
        </View>
      )}

      {!!day.closing && <Text style={styles.closing}>{day.closing}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  kicker: {
    color: 'rgba(255,255,255,0.85)',
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
  tabIdle: {
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'transparent',
  },
  tabActive: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabText: {
    fontSize: 12,
    letterSpacing: 0.2,
    color: 'rgba(255,255,255,0.8)',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 4,
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
    backgroundColor: '#FFFFFF',
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  antiphon: {
    marginHorizontal: 14,
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  antiphonLead: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 8,
  },
  antiphonTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  antiphonPrayer: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 21,
  },
  closing: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    paddingHorizontal: 14,
    marginTop: 4,
  },
});
