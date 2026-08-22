import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import StatRing from '@/components/thread/StatRing';
import type { ThreadPalette } from '@/constants/Colors';

type PlanRingCardProps = {
  title: string;
  done: number;
  total: number;
  isPaused: boolean;
  palette: ThreadPalette;
  pausedLabel: string;
  metaLabel: string;
  replayToken: number;
  onPress: () => void;
};

const PlanRingCard: React.FC<PlanRingCardProps> = ({
  title,
  done,
  total,
  isPaused,
  palette,
  pausedLabel,
  metaLabel,
  replayToken,
  onPress,
}) => {
  const pct = total > 0 ? done / total : 0;
  const pctLabel = total > 0 ? `${Math.round(pct * 100)}%` : '0%';

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { borderColor: palette.hair, backgroundColor: palette.surf }]}
    >
      <View style={styles.left}>
        <Text style={[styles.title, { color: palette.ink }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.meta, { color: palette.mute }]}>{metaLabel}</Text>
      </View>
      <StatRing
        size={72}
        strokeWidth={6}
        progress={pct}
        centerPrimary={isPaused ? pausedLabel : pctLabel}
        centerSecondary={isPaused ? undefined : `${done}/${total}`}
        trackColor={palette.hair}
        accentColor={isPaused ? palette.mute : palette.acc}
        centerPrimaryColor={palette.ink}
        centerSecondaryColor={palette.mute}
        label=""
        replayToken={replayToken}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingLeft: 12,
    paddingRight: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  left: { flex: 1, paddingRight: 4 },
  title: { fontSize: 15, fontWeight: '600', letterSpacing: -0.2 },
  meta: { fontSize: 9, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 4 },
});

export default PlanRingCard;
