import * as Haptics from 'expo-haptics';

/** Confirm a state change the user caused. Never on scroll or arrival. */
export async function hapticSelection(): Promise<void> {
  try {
    await Haptics.selectionAsync();
  } catch {}
}

export async function hapticImpactLight(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

export async function hapticImpactMedium(): Promise<void> {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

export async function hapticSuccess(): Promise<void> {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}
