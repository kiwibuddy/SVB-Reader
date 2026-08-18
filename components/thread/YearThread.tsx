import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DIVISIONS } from '@/constants/divisions';
import { ThreadColors } from '@/constants/Colors';
import { storyNumber } from '@/constants/divisions';

interface YearThreadProps {
  completedIds: Set<string>;
  currentId?: string | null;
  isDarkMode: boolean;
}

const YearThread: React.FC<YearThreadProps> = ({ completedIds, currentId, isDarkMode }) => {
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const currentNum = currentId ? storyNumber(currentId) : null;

  return (
    <View style={styles.row}>
      {DIVISIONS.map((division) => {
        const total = division.end - division.start + 1;
        const done = Array.from({ length: total }, (_, i) => division.start + i).filter((n) =>
          completedIds.has(`S${String(n).padStart(3, '0')}`)
        ).length;
        const here = currentNum != null && currentNum >= division.start && currentNum <= division.end;
        return (
          <View key={division.id} style={styles.seg}>
            <View style={[styles.tick, { backgroundColor: palette.hair }]} />
            <View
              style={[
                styles.bar,
                { backgroundColor: palette.hair },
              ]}
            >
              <View
                style={[
                  styles.fill,
                  {
                    width: `${Math.round((done / total) * 100)}%`,
                    backgroundColor: here ? palette.acc : palette.mute,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, paddingHorizontal: 14, paddingVertical: 12 },
  seg: { flex: 1, alignItems: 'center' },
  tick: { width: 1, height: 8, marginBottom: 4 },
  bar: { height: 4, width: '100%', borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },
});

export default YearThread;
