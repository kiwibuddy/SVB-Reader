import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import PlanStoryPicker from '@/components/thread/PlanStoryPicker';
import { ThreadColors } from '@/constants/Colors';
import { useSyncAppSettings } from '@/context/SyncAppSettingsContext';
import { useTranslation } from '@/hooks/useTranslation';
import { createUserPlan } from '@/api/userPlans';
import { startPlan } from '@/api/sqlite';
import { hapticImpactLight } from '@/utils/haptics';

const CreateUserPlanScreen = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDarkMode, language } = useSyncAppSettings();
  const { t } = useTranslation();
  const palette = isDarkMode ? ThreadColors.dark : ThreadColors.light;
  const lang = language.startsWith('fr') ? 'fr' : 'en';

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [titleOpen, setTitleOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);

  const count = selected.size;
  const stickyHeight = 72 + insets.bottom;

  const summary = useMemo(() => {
    if (count === 1) return t('UI.customPlans.storyCountOne');
    return t('UI.customPlans.storyCount', { n: count });
  }, [count, t]);

  const openTitleSheet = () => {
    if (count < 1) return;
    void hapticImpactLight();
    setTitleOpen(true);
  };

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert(t('UI.customPlans.titleRequired'));
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      const plan = await createUserPlan(trimmed, selected);
      await startPlan(plan.id);
      void hapticImpactLight();
      setTitleOpen(false);
      router.replace(`/plan/${plan.id}`);
    } catch (error) {
      Alert.alert(
        t('UI.alerts.error'),
        error instanceof Error ? error.message : t('UI.customPlans.createFailed')
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.topBtn}>
          <Text style={{ color: palette.mute, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            {t('UI.alerts.cancel')}
          </Text>
        </Pressable>
        <Text style={[styles.topTitle, { color: palette.ink }]}>{t('UI.customPlans.pickerTitle')}</Text>
        <View style={styles.topBtn} />
      </View>

      <PlanStoryPicker
        selected={selected}
        onChangeSelected={setSelected}
        bottomInset={stickyHeight}
      />

      <View
        style={[
          styles.sticky,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: palette.bg,
            borderTopColor: palette.hair,
          },
        ]}
      >
        <Text style={[styles.stickyMeta, { color: palette.mute }]}>
          {count > 0 ? summary : t('UI.customPlans.selectHint')}
        </Text>
        <Pressable
          onPress={openTitleSheet}
          disabled={count < 1}
          style={[
            styles.createBtn,
            {
              backgroundColor: count < 1 ? palette.hair : palette.acc,
            },
          ]}
        >
          <Text
            style={{
              color: count < 1 ? palette.mute : palette.bg,
              fontWeight: '600',
              fontSize: 15,
              letterSpacing: 0.2,
            }}
          >
            {t('UI.customPlans.createCta')}
          </Text>
        </Pressable>
      </View>

      <Modal
        visible={titleOpen}
        transparent
        animationType="fade"
        onRequestClose={() => !saving && setTitleOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalRoot}
        >
          <Pressable style={styles.modalScrim} onPress={() => !saving && setTitleOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: palette.surf, borderColor: palette.hair }]}>
            <Text style={[styles.sheetTitle, { color: palette.ink }]}>{t('UI.customPlans.nameTitle')}</Text>
            <Text style={[styles.sheetSummary, { color: palette.mute }]}>{summary}</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('UI.customPlans.namePlaceholder')}
              placeholderTextColor={palette.mute}
              autoFocus
              maxLength={80}
              editable={!saving}
              style={[
                styles.input,
                {
                  color: palette.ink,
                  borderColor: palette.hair,
                  backgroundColor: palette.bg,
                },
              ]}
              returnKeyType="done"
              onSubmitEditing={handleCreate}
            />
            <View style={styles.sheetActions}>
              <Pressable
                onPress={() => !saving && setTitleOpen(false)}
                style={[styles.sheetBtn, { borderColor: palette.hair }]}
              >
                <Text style={{ color: palette.mute, fontWeight: '600' }}>
                  {lang === 'fr' ? 'Retour' : 'Back'}
                </Text>
              </Pressable>
              <Pressable
                onPress={handleCreate}
                disabled={saving || !title.trim()}
                style={[
                  styles.sheetBtn,
                  styles.sheetPrimary,
                  {
                    backgroundColor: !title.trim() || saving ? palette.hair : palette.acc,
                    borderColor: 'transparent',
                  },
                ]}
              >
                {saving ? (
                  <ActivityIndicator color={palette.bg} />
                ) : (
                  <Text style={{ color: palette.bg, fontWeight: '600' }}>{t('UI.customPlans.create')}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 6,
    minHeight: 40,
  },
  topBtn: { width: 72 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  sticky: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 8,
  },
  stickyMeta: { fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', textAlign: 'center' },
  createBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalScrim: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet: {
    marginHorizontal: 12,
    marginBottom: 24,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 10,
  },
  sheetTitle: { fontSize: 18, fontWeight: '600', letterSpacing: -0.3 },
  sheetSummary: { fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase' },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  sheetActions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  sheetBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  sheetPrimary: {},
});

export default CreateUserPlanScreen;
