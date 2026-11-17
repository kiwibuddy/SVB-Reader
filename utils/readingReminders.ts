import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requireOptionalNativeModule } from 'expo-modules-core';
import type * as NotificationsType from 'expo-notifications';
import i18next from 'i18next';
import {
  getStreakLastReadDate,
  getStreakSummary,
  getStartedPlansFromDB,
  getStartedChallengesFromDB,
  getChallengeProgress,
  getPlanProgress,
} from '@/api/sqlite';
import { findPlanItem } from '@/api/userPlans';
import { localCalendarDate } from '@/utils/localDate';
import logger from '@/utils/logger';
import { findCatalogItem, getLocalizedPlanText } from '@/utils/planCatalog';
import { getChronologicalMapping } from '@/utils/chronologicalPlans';
import { localizeStoryTitle } from '@/utils/localize';
import { shortStoryId } from '@/utils/threadProgress';
import { getPlanStartIndex } from '@/utils/planStartIndex';
import { ADVENT_PLAN_ID, christmasSeasonYear, datedWindow } from '@/utils/seasonalPlans';
import { todayStoryId } from '@/utils/continueTarget';
import {
  ADVENT_NOTIFICATION_IDS,
  planAdventNotifications,
  type AdventReminderPlan,
} from '@/utils/adventReminders';
import { ALL_REMINDER_IDS, planReminders, type ActivePlan, type PlannedReminder } from '@/utils/reminderPlan';
import SegmentTitles from '@/assets/data/SegmentTitles.json';

const ENABLED_KEY = 'svb.reminder.enabled';
const HOUR_KEY = 'svb.reminder.hour';
const MINUTE_KEY = 'svb.reminder.minute';
const PROMPTED_KEY = 'svb.reminder.prompted';
const ADVENT_REMIND_KEY = 'svb.advent.remindMe';
const CHANNEL_ID = 'reading-reminders';

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

/** Whether notifications are already allowed. Never shows the system prompt. */
export async function hasNotificationPermission(): Promise<boolean> {
  const Notifications = await getNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  return current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
}

/** Ask for notification permission if it has not been decided yet. */
export async function requestNotificationPermission(): Promise<boolean> {
  return ensurePermission();
}

/** Remember that the reader asked to be reminded when this season's Advent starts. */
export async function setAdventRemindMe(on: boolean, date: Date = new Date()): Promise<void> {
  if (on) await AsyncStorage.setItem(ADVENT_REMIND_KEY, String(christmasSeasonYear(date)));
  else await AsyncStorage.removeItem(ADVENT_REMIND_KEY);
}

export async function getAdventRemindMe(date: Date = new Date()): Promise<boolean> {
  const stored = await AsyncStorage.getItem(ADVENT_REMIND_KEY);
  return stored === String(christmasSeasonYear(date));
}

/**
 * Call `onUrl` when the reader taps one of our notifications that carries a
 * screen to open (Advent reminders do). Returns an unsubscribe function.
 */
export async function addNotificationTapListener(onUrl: (url: string) => void): Promise<() => void> {
  const Notifications = await getNotifications();
  if (!Notifications) return () => undefined;
  const handle = (response: NotificationsType.NotificationResponse | null | undefined) => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url === 'string' && url.startsWith('/')) onUrl(url);
  };
  try {
    const last = await Notifications.getLastNotificationResponseAsync();
    if (last) {
      handle(last);
      await Notifications.clearLastNotificationResponseAsync();
    }
  } catch (error) {
    logger.warn('Could not read the last notification response', error);
  }
  const sub = Notifications.addNotificationResponseReceivedListener(handle);
  return () => sub.remove();
}

const adventTitles = SegmentTitles as Record<string, { title?: string }>;

async function planAdventReminders(prefs: ReminderPrefs): Promise<AdventReminderPlan | null> {
  const item = findCatalogItem(ADVENT_PLAN_ID);
  if (!item) return null;
  const now = new Date();
  const started = (await getStartedChallengesFromDB()).find((s) => s.id === ADVENT_PLAN_ID);
  const progress = started ? await getChallengeProgress(ADVENT_PLAN_ID) : null;
  const completedIds = new Set((progress?.completedSegmentIds || []).map(shortStoryId));
  const language = i18next.language || 'en';
  const mapping = getChronologicalMapping(item.chronologicalMapping);
  return planAdventNotifications(
    {
      now,
      dailyEnabled: prefs.enabled,
      hour: prefs.hour,
      minute: prefs.minute,
      joined: !!started && !started.isPaused,
      paused: !!started?.isPaused,
      remindMe: await getAdventRemindMe(now),
      stories: item.stories,
      completedIds,
    },
    {
      storyTitle: (id) => localizeStoryTitle(id, adventTitles[id]?.title || id, language),
      weekTitleForDay: (index) => {
        const phase = mapping?.segments.find((s) => s.segmentId === item.stories[index])?.phase || '';
        return i18next.t(`UI.chronologicalPhases.${ADVENT_PLAN_ID}.${phase}.title`, { defaultValue: phase });
      },
      t: (key, params) => i18next.t(key, params),
    }
  );
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

/** Started, not paused plans, most recently used first, with their progress. */
async function activePlansForReminders(language: string): Promise<ActivePlan[]> {
  const started = [...(await getStartedPlansFromDB()), ...(await getStartedChallengesFromDB())]
    .filter((s) => !s.isPaused)
    .sort((a, b) => String(b.lastUpdated || '').localeCompare(String(a.lastUpdated || '')));
  const plans: ActivePlan[] = [];
  for (const s of started) {
    const item = findCatalogItem(s.id) || (await findPlanItem(s.id));
    if (!item || item.stories.length === 0) continue;
    const progress = item.type === 'plan' ? await getPlanProgress(item.id) : await getChallengeProgress(item.id);
    plans.push({
      id: item.id,
      title: getLocalizedPlanText(item, 'title', language),
      stories: item.stories,
      completedIds: new Set((progress?.completedSegmentIds || []).map(shortStoryId)),
      startIndex: getPlanStartIndex(item.id),
      window: item.isUserPlan ? null : datedWindow(item.id, item.stories.length),
    });
  }
  return plans;
}

async function planDailyReminders(prefs: ReminderPrefs): Promise<PlannedReminder[]> {
  const language = i18next.language || 'en';
  const [legacyLastRead, streak, plans] = await Promise.all([
    getStreakLastReadDate(),
    getStreakSummary(),
    activePlansForReminders(language),
  ]);
  const now = new Date();
  // The streak state knows the real last read. The legacy row is seeded with
  // the install date, so only trust it for an older day.
  const lastReadDate =
    streak.lastReadDate ?? (legacyLastRead && legacyLastRead < localCalendarDate(now) ? legacyLastRead : null);
  return planReminders(
    {
      now,
      enabled: prefs.enabled,
      hour: prefs.hour,
      minute: prefs.minute,
      lastReadDate,
      streak: streak.streak,
      lastDayToSave: streak.lastDayToSave,
      plans,
    },
    {
      storyTitle: (id) => localizeStoryTitle(id, adventTitles[id]?.title || id, language),
      storyForDate: (date) => todayStoryId(date),
      t: (key, params) => i18next.t(key, params),
    }
  );
}

export async function rescheduleReadingReminders(): Promise<void> {
  try {
    const Notifications = await getNotifications();
    if (!Notifications) return;

    await ensureAndroidChannel(Notifications);
    for (const id of [...ALL_REMINDER_IDS, ...ADVENT_NOTIFICATION_IDS]) {
      await Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined);
    }

    const prefs = await getReminderPrefs();

    let advent: AdventReminderPlan | null = null;
    try {
      advent = await planAdventReminders(prefs);
    } catch (error) {
      logger.warn('Could not plan Advent reminders', error);
    }

    const schedule = async (n: { id: string; date: Date; title: string; body: string; url: string }) => {
      await Notifications.scheduleNotificationAsync({
        identifier: n.id,
        content: { title: n.title, body: n.body, data: { url: n.url } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: n.date,
          ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
        },
      });
    };

    // Advent reminders only go to people who already allow notifications:
    // daily-reminder users, or readers who tapped Join / Remind me.
    if (advent?.notifications.length && (await hasNotificationPermission())) {
      for (const n of advent.notifications) await schedule(n);
    }

    if (!prefs.enabled) return;

    const granted = await ensurePermission();
    if (!granted) return;

    for (const n of await planDailyReminders(prefs)) await schedule(n);
  } catch (error) {
    logger.warn('Could not schedule reading reminders', error);
  }
}

/** "8:00 AM" in English, "08:00" style 24-hour time in French. */
export function formatReminderTime(hour: number, minute: number, language: string = i18next.language || 'en'): string {
  const mm = String(minute).padStart(2, '0');
  if (language.startsWith('fr')) return `${String(hour).padStart(2, '0')}:${mm}`;
  const h = hour % 12 || 12;
  const ampm = hour < 12 ? 'AM' : 'PM';
  return `${h}:${mm} ${ampm}`;
}
