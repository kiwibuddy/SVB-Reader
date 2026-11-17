// jest.mock is hoisted above this import.
import { voicePlanFor, loadVoicePlans, rememberVoicePlan, planIdForVoice, voiceForPlan } from '@/utils/voicePlans';

jest.mock('@react-native-async-storage/async-storage', () => {
  const store: Record<string, string> = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(async (k: string) => store[k] ?? null),
      setItem: jest.fn(async (k: string, v: string) => {
        store[k] = v;
      }),
    },
  };
});

describe('voicePlanFor', () => {
  test('narration voices are never offered', () => {
    expect(voicePlanFor('The Narrator').eligible).toBe(false);
  });

  test('a voice in two stories is not offered', () => {
    expect(voicePlanFor('Adam')).toEqual({ eligible: false, storyIds: expect.any(Array) });
    expect(voicePlanFor('Adam').storyIds).toHaveLength(2);
  });

  test('Mary, mother of Jesus (3 stories) is offered', () => {
    const plan = voicePlanFor('Mary Mother of Jesus');
    expect(plan.eligible).toBe(true);
    expect(plan.storyIds).toHaveLength(3);
  });

  test('stories come in Bible order', () => {
    const { storyIds } = voicePlanFor('Moses');
    const numbers = storyIds.map((id) => Number(id.slice(1)));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    expect(storyIds.length).toBeGreaterThan(20);
  });

  test('an unknown voice is not offered', () => {
    expect(voicePlanFor('Nobody')).toEqual({ eligible: false, storyIds: [] });
  });
});

test('one plan per voice, remembered across launches', async () => {
  await loadVoicePlans();
  expect(planIdForVoice('Moses')).toBeNull();
  await rememberVoicePlan('Moses', 'user_abc');
  await loadVoicePlans();
  expect(planIdForVoice('Moses')).toBe('user_abc');
  expect(voiceForPlan('user_abc')).toBe('Moses');
  expect(voiceForPlan('user_other')).toBeNull();
  await rememberVoicePlan('Moses', null);
  expect(voiceForPlan('user_abc')).toBeNull();
});
