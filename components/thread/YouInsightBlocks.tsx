import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import RoleProgressBar from '@/components/RoleProgressBar';
import type { ThreadPalette } from '@/constants/Colors';
import type { ColorWordMix, NextVoice, ThinEra } from '@/utils/youInsights';
import { localizeVoiceName } from '@/utils/localize';

type YouInsightBlocksProps = {
  palette: ThreadPalette;
  language: string;
  colorMix: ColorWordMix;
  nextVoices: NextVoice[];
  thinEras: ThinEra[];
  labels: {
    colorMixTitle: string;
    colorMixBody: string;
    nextVoicesTitle: string;
    nextVoicesEmpty: string;
    thinErasTitle: string;
    thinEraLine: string;
  };
  onVoicePress: (name: string) => void;
  onEraPress: (eraKey: string) => void;
};

const YouInsightBlocks: React.FC<YouInsightBlocksProps> = ({
  palette,
  language,
  colorMix,
  nextVoices,
  thinEras,
  labels,
  onVoicePress,
  onEraPress,
}) => {
  const total = colorMix.total || colorMix.black + colorMix.red + colorMix.green + colorMix.blue;

  return (
    <View style={styles.root}>
      {total > 0 && (
        <View style={[styles.block, { borderColor: palette.hair }]}>
          <Text style={[styles.blockTitle, { color: palette.ink }]}>{labels.colorMixTitle}</Text>
          <Text style={[styles.blockBody, { color: palette.mute }]}>{labels.colorMixBody}</Text>
          <RoleProgressBar colorData={colorMix} height={6} showIndividualParts={false} />
          <View style={styles.percents}>
            {[
              { key: 'green', val: colorMix.green },
              { key: 'red', val: colorMix.red },
              { key: 'blue', val: colorMix.blue },
              { key: 'black', val: colorMix.black },
            ]
              .filter((p) => p.val > 0)
              .map((p) => (
                <Text key={p.key} style={[styles.pct, { color: palette.mute }]}>
                  {Math.round((p.val / total) * 100)}%
                </Text>
              ))}
          </View>
        </View>
      )}

      <View style={[styles.block, { borderColor: palette.hair }]}>
        <Text style={[styles.blockTitle, { color: palette.ink }]}>{labels.nextVoicesTitle}</Text>
        {nextVoices.length === 0 ? (
          <Text style={[styles.blockBody, { color: palette.mute }]}>{labels.nextVoicesEmpty}</Text>
        ) : (
          <View style={styles.chips}>
            {nextVoices.map((v) => (
              <Pressable
                key={v.name}
                onPress={() => onVoicePress(v.name)}
                style={[styles.chip, { borderColor: palette.hair, backgroundColor: palette.surf }]}
              >
                <Text style={[styles.chipText, { color: palette.ink }]}>
                  {localizeVoiceName(v.name, language)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>

      {thinEras.length > 0 && (
        <View style={[styles.block, { borderColor: palette.hair }]}>
          <Text style={[styles.blockTitle, { color: palette.ink }]}>{labels.thinErasTitle}</Text>
          {thinEras.map((era) => (
            <Pressable key={era.key} onPress={() => onEraPress(era.key)} style={styles.eraRow}>
              <Text style={[styles.eraText, { color: palette.mute }]}>
                {labels.thinEraLine
                  .replace('{{title}}', era.title)
                  .replace('{{done}}', String(era.done))
                  .replace('{{total}}', String(era.total))}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { paddingHorizontal: 14, paddingTop: 8, gap: 10 },
  block: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  blockTitle: { fontSize: 13, fontWeight: '600', letterSpacing: -0.2 },
  blockBody: { fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 8 },
  percents: { flexDirection: 'row', gap: 10, marginTop: 6 },
  pct: { fontSize: 10, letterSpacing: 0.4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: { fontSize: 13, fontWeight: '500' },
  eraRow: { paddingVertical: 6 },
  eraText: { fontSize: 13, lineHeight: 18 },
});

export default YouInsightBlocks;
