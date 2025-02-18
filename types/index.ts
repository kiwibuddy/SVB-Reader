export interface BibleBlock {
  source: {
    color: string;
    sourceName: string;
  };
  children: BibleInline[];
  type?: string;
}

export interface SegmentType {
  id: string;
  content: BibleBlock[];
  colors: {
    total: number;
    black: number;
    red: number;
    green: number;
    blue: number;
  };
  sources: {
    [key: string]: {
      words: number;
      color: string;
    };
  };
  readers?: string[];
}

export interface BibleInline {
  type: string;
  tag?: string;
  children: any[];
  start?: boolean;
  pIndex?: number;
}

export interface EmojiReaction {
  id: number;
  segmentID: string;
  blockID: string;
  blockData: BibleBlock;
  emoji: string;
  note: string;
}