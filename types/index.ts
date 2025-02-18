export interface BibleBlock {
  source: {
    color: string;
    sourceName: string;
  };
  children: any[];
  type?: string;
}

export interface SegmentType {
  id: string;
  content: any[];
  readers: string[];
} 