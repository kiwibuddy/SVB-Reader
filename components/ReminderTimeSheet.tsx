import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ThreadPalette } from '@/constants/Colors';
import { useTranslation } from '@/hooks/useTranslation';
import { hapticSelection } from '@/utils/haptics';
import { formatReminderTime } from '@/utils/readingReminders';

type Props = {
  visible: boolean;
  hour: number;
  minute: number;
  palette: ThreadPalette;
  language: string;
  onCancel: () => void;
  onSave: (hour: number, minute: number) => void;
};

const SHORTCUTS = [
  { hour: 7, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 20, minute: 0 },
];

/** Pick the daily reminder time: three shortcuts, or hour and minute steppers. */
export default function ReminderTimeSheet({ visible, hour, minute, palette, language, onCancel, onSave }: Props) {
  const { t } = useTranslation();
  // Mount only while open, so this starts from the saved time each time.
  const [h, setH] = useState(hour);
  const [m, setM] = useState(minute - (minute % 5));

  const step = (unit: 'h' | 'm', delta: number) => {
    void hapticSelection();
    if (unit === 'h') setH((v) => (v + delta + 24) % 24);
    else setM((v) => (v + delta * 5 + 60) % 60);
  };

  const stepper = (unit: 'h' | 'm', value: string, label: string) => (
    <View style={styles.stepper}>
      <Text style={[styles.stepLabel, { color: palette.mute }]}>{label}</Text>
      <View style={styles.stepRow}>
        <Pressable
          onPress={() => step(unit, -1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${label} −`}
          style={[styles.stepBtn, { borderColor: palette.hair }]}
        >
          <Ionicons name="remove" size={18} color={palette.ink} />
        </Pressable>
        <Text style={[styles.stepValue, { color: palette.ink }]}>{value}</Text>
        <Pressable
          onPress={() => step(unit, 1)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${label} +`}
          style={[styles.stepBtn, { borderColor: palette.hair }]}
        >
          <Ionicons name="add" size={18} color={palette.ink} />
        </Pressable>
      </View>
    </View>
  );

  const french = language.startsWith('fr');
  const hourText = french ? String(h).padStart(2, '0') : String(h % 12 || 12);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable style={styles.backdrop} onPress={onCancel} accessibilityLabel={t('UI.alerts.cancel')} />
      <View style={[styles.sheet, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
        <Text style={[styles.title, { color: palette.ink }]}>{t('UI.reminders.timeSheetTitle')}</Text>
        <Text style={[styles.preview, { color: palette.acc }]}>{formatReminderTime(h, m, language)}</Text>

        <View style={styles.chips}>
          {SHORTCUTS.map((s) => {
            const on = s.hour === h && s.minute === m;
            return (
              <Pressable
                key={s.hour}
                onPress={() => {
                  void hapticSelection();
                  setH(s.hour);
                  setM(s.minute);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                style={[styles.chip, { borderColor: on ? palette.acc : palette.hair }]}
              >
                <Text style={[styles.chipText, { color: on ? palette.acc : palette.ink }]}>
                  {formatReminderTime(s.hour, s.minute, language)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.steppers}>
          {stepper('h', hourText, t('UI.reminders.hour'))}
          {stepper('m', String(m).padStart(2, '0'), t('UI.reminders.minute'))}
          {!french && (
            <Pressable
              onPress={() => step('h', 12)}
              accessibilityRole="button"
              style={[styles.ampm, { borderColor: palette.hair }]}
            >
              <Text style={[styles.chipText, { color: palette.ink }]}>{h < 12 ? 'AM' : 'PM'}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={onCancel} style={[styles.secondary, { borderColor: palette.hair }]} accessibilityRole="button">
            <Text style={[styles.secondaryText, { color: palette.ink }]}>{t('UI.alerts.cancel')}</Text>
          </Pressable>
          <Pressable
            onPress={() => onSave(h, m)}
            style={[styles.primary, { backgroundColor: palette.acc }]}
            accessibilityRole="button"
          >
            <Text style={[styles.primaryText, { color: palette.bg }]}>{t('UI.reminders.timeSheetSave')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 34,
  },
  title: { fontSize: 17, fontWeight: '600', textAlign: 'center' },
  preview: { fontSize: 34, fontWeight: '600', textAlign: 'center', marginTop: 6, fontVariant: ['tabular-nums'] },
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginTop: 14 },
  chip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 14, paddingVertical: 7 },
  chipText: { fontSize: 14, fontWeight: '600' },
  steppers: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 18, marginTop: 18 },
  stepper: { alignItems: 'center' },
  stepLabel: { fontSize: 10, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 6 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 22, fontWeight: '600', minWidth: 34, textAlign: 'center', fontVariant: ['tabular-nums'] },
  ampm: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 24 },
  primary: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  primaryText: { fontSize: 15, fontWeight: '700' },
  secondary: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 11, alignItems: 'center' },
  secondaryText: { fontSize: 15, fontWeight: '600' },
});
