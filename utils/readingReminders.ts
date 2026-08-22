import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type * as NotificationsType from 'expo-notifications';
import i18next from 'i18next';
import { getStreakLastReadDate } from '@/api/sqlite';
import { localCalendarDate } from '@/utils/localDate';
import logger from '@/utils/logger';

const ENABLED_KEY = 'svb.reminder.enabled';
const HOUR_KEY = 'svb.reminder.hour';
const MINUTE_KEY = 'svb.reminder.minute';
const PROMPTED_KEY = 'svb.reminder.prompted';
const DAILY_ID = 'svb-daily-read';
const STREAK_ID = 'svb-streak-nudge';
const CHANNEL_ID = 'reading-reminders';

export const REMINDER_TIMES = [
  { hour: 7, minute: 0 },
  { hour: 8, minute: 0 },
  { hour: 12, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 20, minute: 0 },
  { hour: 21, minute: 0 },
] as const;

type NotificationsModule = typeof NotificationsType;
type ImportedNotifications = NotificationsModule & { default?: NotificationsModule };

let notificationsPromise: Promise<NotificationsModule | null> | null = null;

function hasNativeNotifications(): boolean {
  return (
    requireOptionalNativeModule('ExpoNotificationScheduler') != null &&
    requireOptionalNativeModule('ExpoPushTokenManager') != null
  );
}

function resolveNotificationsModule(imported: ImportedNotifications): NotificationsModule | null {
  if (typeof imported.scheduleNotificationAsync === 'function') {
    return imported;
  }
  if (typeof imported.default?.scheduleNotificationAsync === 'function') {
    return imported.default;
  }
  return null;
}

async function getNotifications(): Promise<NotificationsModule | null> {
  if (!notificationsPromise) {
    notificationsPromise = (async () => {
      try {
        // expo-notifications' index requires ExpoPushTokenManager at load time.
        // Probe first so old binaries skip the import instead of throwing a red ERROR.
        if (!hasNativeNotifications()) {
          logger.warn(
            'expo-notifications unavailable; reading reminders need a native rebuild with expo-notifications'
          );
          return null;
        }
        const imported = (await import('expo-notifications')) as ImportedNotifications;
        const Notifications = resolveNotificationsModule(imported);
        if (!Notifications) {
          throw new Error('expo-notifications JS module incomplete');
        }
        Notifications.setNotificationHandler({
          handleNotification: async () => ({
            shouldShowBanner: true,
            shouldShowList: true,
            shouldPlaySound: false,
            shouldSetBadge: false,
          }),
        });
        return Notifications;
      } catch (error) {
        logger.warn(
          'expo-notifications unavailable; reading reminders need a native rebuild with expo-notifications',
          error
        );
        return null;
      }
    })();
  }
  return notificationsPromise;
}

export type ReminderPrefs = {
  enabled: boolean;
  hour: number;
  minute: number;
  prompted: boolean;
};

export async function getReminderPrefs(): Promise<ReminderPrefs> {
  const [enabled, hour, minute, prompted] = await Promise.all([
    AsyncStorage.getItem(ENABLED_KEY),
    AsyncStorage.getItem(HOUR_KEY),
    AsyncStorage.getItem(MINUTE_KEY),
    AsyncStorage.getItem(PROMPTED_KEY),
  ]);
  return {
    enabled: enabled === '1',
    hour: hour != null ? Number(hour) : 8,
    minute: minute != null ? Number(minute) : 0,
    prompted: prompted === '1',
  };
}

export async function setReminderEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(ENABLED_KEY, enabled ? '1' : '0');
  if (enabled) {
    const granted = await ensurePermission();
    if (!granted) {
      await AsyncStorage.setItem(ENABLED_KEY, '0');
      return;
    }
  }
  await rescheduleReadingReminders();
}

export async function setReminderTime(hour: number, minute: number): Promise<void> {
  await AsyncStorage.setItem(HOUR_KEY, String(hour));
  await AsyncStorage.setItem(MINUTE_KEY, String(minute));
  await rescheduleReadingReminders();
}

export async function markReminderPrompted(): Promise<void> {
  await AsyncStorage.setItem(PROMPTED_KEY, '1');
}

async function ensureAndroidChannel(Notifications: NotificationsModule): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: i18next.t('UI.settings.reminders', { defaultValue: 'Reading reminders' }),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function ensurePermission(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted || asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

export async function maybePromptAfterFirstStory(): Promise<void> {
  const prefs = await getReminderPrefs();
  if (prefs.prompted || prefs.enabled) return;

  await markReminderPrompted();

  Alert.alert(
    i18next.t('UI.settings.reminderPromptTitle'),
    i18next.t('UI.settings.reminderPromptBody'),
    [
      { text: i18next.t('UI.alerts.cancel'), style: 'cancel' },
      {
        text: i18next.t('UI.settings.reminderEnable'),
        onPress: () => {
          void setReminderEnabled(true);
        },
      },
    ]
  );
}

export async function rescheduleReadingReminders(): Promise<void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await ensureAndroidChannel(Notifications);
    await Notifications.cancelScheduledNotificationAsync(DAILY_ID).catch(() => undefined);
    await Notifications.cancelScheduledNotificationAsync(STREAK_ID).catch(() => undefined);

    const prefs = await getReminderPrefs();
    if (!prefs.enabled) return;

    const granted = await ensurePermission();
    if (!granted) return;

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_ID,
      content: {
        title: i18next.t('UI.settings.reminderDailyTitle'),
        body: i18next.t('UI.settings.reminderDailyBody'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: prefs.hour,
        minute: prefs.minute,
      },
    });

    const lastRead = await getStreakLastReadDate();
    const today = localCalendarDate();
    if (lastRead === today) return;

    const fire = new Date();
    fire.setHours(20, 0, 0, 0);
    if (fire.getTime() <= Date.now()) return;

    await Notifications.scheduleNotificationAsync({
      identifier: STREAK_ID,
      content: {
        title: i18next.t('UI.settings.reminderStreakTitle'),
        body: i18next.t('UI.settings.reminderStreakBody'),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fire,
      },
    });
  } catch (error) {
    logger.warn('Could not schedule reading reminders', error);
  }
}

export function formatReminderTime(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  const mm = String(minute).padStart(2, '0');
  return `${h}:${mm} ${ampm}`;
}

export function nextReminderTime(hour: number, minute: number): { hour: number; minute: number } {
  const i = REMINDER_TIMES.findIndex((slot) => slot.hour === hour && slot.minute === minute);
  const next = REMINDER_TIMES[(i + 1) % REMINDER_TIMES.length];
  return { hour: next.hour, minute: next.minute };
}
