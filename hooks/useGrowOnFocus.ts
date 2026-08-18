import { useEffect } from 'react';
import { useIsFocused } from 'expo-router';
import { useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { DUR, timing } from '@/constants/Motion';

/** Grows 0→1 when the screen is focused; resets on blur so it replays on return. */
export function useGrowOnFocus(duration: number = DUR.slow) {
  const focused = useIsFocused();
  const grow = useSharedValue(0);

  useEffect(() => {
    if (!focused) {
      grow.value = 0;
      return;
    }
    grow.value = withDelay(80, withTiming(1, timing(duration)));
  }, [duration, focused, grow]);

  return grow;
}
