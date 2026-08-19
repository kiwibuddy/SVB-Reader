import React, { forwardRef } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ThreadColors, fillHex, inkHex } from '@/constants/Colors';
import type { Ink } from '@/utils/ink';

type ShareCardProps = {
  speaker: string;
  text: string;
  citation: string;
  ink: Ink;
  isDarkMode: boolean;
};

const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { speaker, text, citation, ink, isDarkMode },
  ref
) {
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  return (
    <View ref={ref} collapsable={false} style={[styles.card, { backgroundColor: palette.bg }]}>
      <Text style={[styles.who, { color: inkHex(ink, palette) }]}>{speaker}</Text>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: fillHex(ink, palette),
            borderColor: ink === 'black' ? palette.hair : inkHex(ink, palette),
          },
        ]}
      >
        <Text style={[styles.body, { color: inkHex(ink, palette) }]}>{text}</Text>
      </View>
      <Text style={[styles.cite, { color: palette.mute }]}>{citation}</Text>
      <Text style={[styles.mark, { color: palette.ink }]}>SourceView</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  card: { width: 360, padding: 20 },
  who: { fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '700', marginBottom: 8 },
  bubble: { borderRadius: 16, borderTopLeftRadius: 5, borderWidth: 1, padding: 14 },
  body: { fontSize: 16, lineHeight: 23 },
  cite: { fontSize: 11, letterSpacing: 0.6, marginTop: 12 },
  mark: { fontSize: 12, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 16 },
});

export default ShareCard;
