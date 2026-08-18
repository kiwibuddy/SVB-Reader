import type { Ink } from '@/utils/ink';

export interface ConversationPartner {
  name: string;
  count: number;
}

export interface ConversationVoice {
  name: string;
  color: Ink;
  group: 'narration' | 'divine' | 'principal' | 'chorus';
  words: number;
  turns: number;
  storyIds: string[];
  firstStoryId: string | null;
  lastStoryId: string | null;
  spokeWith: ConversationPartner[];
  longestExchange: {
    partner: string;
    turns: number;
    storyId: string;
    storyTitle: string;
  } | null;
  longestSpeech: {
    words: number;
    storyId: string;
    storyTitle: string;
  } | null;
}

export interface ConversationsFile {
  meta: {
    stories: number;
    voices: number;
    generatedAt: string;
  };
  voices: Record<string, ConversationVoice>;
}
