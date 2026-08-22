import { useEffect, useCallback, useRef } from 'react';
import { useIsFocused } from 'expo-router';
import {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  withDelay,
  SharedValue,
  useReducedMotion,
} from 'react-native-reanimated';
import { DUR, timing } from '@/constants/Motion';

export interface ThreadReveal {
  progress: SharedValue<number>;
  pathProps: ReturnType<typeof useAnimatedProps>;
  replay: (fromFraction?: number) => void;
}

/**
 * @param length – total path length from buildThread()
 * @param opts.replayOnFocus – animate from 0 each time the screen focuses (default true)
 */
export function useThreadReveal(
  length: number,
  opts?: { replayOnFocus?: boolean },
): ThreadReveal {
  const replayOnFocus = opts?.replayOnFocus ?? true;
  const reduced = useReducedMotion();
  const focused = useIsFocused();
  const progress = useSharedValue(reduced ? 1 : 0);
  const prevLengthRef = useRef(0);

  const replay = useCallback(
    (fromFraction?: number) => {
      if (reduced) {
        progress.value = 1;
        return;
      }
      const from = fromFraction ?? 0;
      progress.value = from;
      progress.value = withDelay(40, withTiming(1, timing(DUR.slow)));
    },
    [progress, reduced],
  );

  // Focus-based replay: animate full draw on each focus
  useEffect(() => {
    if (!length) return;
    if (replayOnFocus) {
      if (focused) {
        prevLengthRef.current = 0;
        replay(0);
      } else {
        progress.value = 0;
        prevLengthRef.current = 0;
      }
    }
  }, [focused, replayOnFocus, length, progress, replay]);

  // Length-change replay: ThreadList expand/collapse while focused
  useEffect(() => {
    if (!replayOnFocus) return;
    if (!length || !focused) return;
    if (prevLengthRef.current === 0) {
      // First paint after focus — already handled above
      prevLengthRef.current = length;
      return;
    }
    if (prevLengthRef.current !== length) {
      const from = Math.min(prevLengthRef.current / length, 1);
      replay(from);
    }
    prevLengthRef.current = length;
  }, [length, focused, replayOnFocus, replay]);

  // Accordion mode (Cast / Plan): animate when length appears or changes
  useEffect(() => {
    if (replayOnFocus) return;
    if (!length) {
      progress.value = 0;
      prevLengthRef.current = 0;
      return;
    }
    if (prevLengthRef.current === 0) {
      replay(0);
    } else if (prevLengthRef.current !== length) {
      const from = Math.min(prevLengthRef.current / length, 1);
      replay(from);
    }
    prevLengthRef.current = length;
  }, [length, replayOnFocus, progress, replay]);

  const pathProps = useAnimatedProps(() => ({
    strokeDashoffset: length * (1 - progress.value),
  }));

  return { progress, pathProps, replay };
}
