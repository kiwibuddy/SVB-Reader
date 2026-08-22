import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import StatRing from '@/components/thread/StatRing';
import type { ThreadPalette } from '@/constants/Colors';
import { voiceColorSegments, type VoicesByColor } from '@/utils/youInsights';

type TestamentProgress = { completed: number; total: number };

type YouStatRingsProps = {
  palette: ThreadPalette;
  storiesDone: number;
  ot: TestamentProgress;
  nt: TestamentProgress;
  voicesMet: number;
  voicesByColor: VoicesByColor;
  dayStreak: number;
  weekStreak: number;
  replayToken: number;
  labels: {
    stories: string;
    voicesMet: string;
    streak: string;
    ot: string;
    nt: string;
    all: string;
    day: string;
    week: string;
    principal: string;
    supporting: string;
    divine: string;
    narrator: string;
  };
};

const YouStatRings: React.FC<YouStatRingsProps> = ({
  palette,
  storiesDone,
  ot,
  nt,
  voicesMet,
  voicesByColor,
  dayStreak,
  weekStreak,
  replayToken,
  labels,
}) => {
  const [storiesView, setStoriesView] = useState(0);
  const [voicesView, setVoicesView] = useState(0);
  const [streakView, setStreakView] = useState(0);

  const storiesConfig = [
    { done: storiesDone, total: 365, primary: `${storiesDone}`, secondary: `/ 365`, sub: labels.all },
    { done: ot.completed, total: ot.total, primary: `${ot.completed}`, secondary: `/ ${ot.total}`, sub: labels.ot },
    { done: nt.completed, total: nt.total, primary: `${nt.completed}`, secondary: `/ ${nt.total}`, sub: labels.nt },
  ][storiesView];

  const voiceSegments = voiceColorSegments(voicesByColor, palette);

  return (
    <View style={styles.row}>
      <StatRing
        progress={storiesConfig.total > 0 ? storiesConfig.done / storiesConfig.total : 0}
        centerPrimary={storiesConfig.primary}
        centerSecondary={storiesConfig.secondary}
        trackColor={palette.hair}
        accentColor={palette.acc}
        centerPrimaryColor={palette.ink}
        centerSecondaryColor={palette.mute}
        labelColor={palette.mute}
        sublabelColor={palette.mute}
        label={labels.stories}
        sublabel={storiesConfig.sub}
        onPress={() => setStoriesView((v) => (v + 1) % 3)}
        replayToken={replayToken + storiesView}
      />
      <StatRing
        progress={voicesView === 0 ? voicesMet / 774 : voicesByColor.total > 0 ? 1 : 0}
        segments={voicesView === 1 ? voiceSegments : undefined}
        centerPrimary={voicesView === 0 ? `${voicesMet}` : `${voicesByColor.total}`}
        centerSecondary={voicesView === 0 ? '/ 774' : undefined}
        trackColor={palette.hair}
        accentColor={palette.chor}
        centerPrimaryColor={palette.ink}
        centerSecondaryColor={palette.mute}
        labelColor={palette.mute}
        sublabelColor={palette.mute}
        label={labels.voicesMet}
        sublabel={
          voicesView === 0
            ? labels.all
            : `${labels.principal} · ${labels.supporting} · ${labels.divine}`
        }
        onPress={() => setVoicesView((v) => (v + 1) % 2)}
        replayToken={replayToken + voicesView}
      />
      <StatRing
        progress={
          streakView === 0
            ? Math.min(dayStreak / 30, 1)
            : Math.min(weekStreak / 12, 1)
        }
        centerPrimary={streakView === 0 ? `${dayStreak}` : `${weekStreak}`}
        centerSecondary={streakView === 0 ? labels.day : labels.week}
        trackColor={palette.hair}
        accentColor={palette.acc}
        centerPrimaryColor={palette.ink}
        centerSecondaryColor={palette.mute}
        labelColor={palette.mute}
        sublabelColor={palette.mute}
        label={labels.streak}
        sublabel={streakView === 0 ? labels.day : labels.week}
        onPress={() => setStreakView((v) => (v + 1) % 2)}
        replayToken={replayToken + streakView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: 4,
  },
});

export default YouStatRings;
