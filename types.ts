export interface IntroContentChild {
  text?: string;
  type?: string;
  id?: string;
  link?: {
    book: string;
    chapter: string;
    verse: string;
  };
  smallcaps?: boolean;
  bibleText?: boolean;
}

export interface IntroBlock {
  children: IntroContentChild[];
  type: string;
  id: string;
}

export interface ColorsData {
  black: number;
  red: number;
  green: number;
  blue: number;
  total: number;
}

export interface SourcesData {
  [key: string]: {
    words: number;
    color: string;
  };
}

export interface IntroType {
  content: IntroBlock[];
  colors: ColorsData;
  sources: SourcesData;
}

// Leaf level, representing the smallest unit
export interface BibleLeaf {
  TaS: boolean;
  ref: string[];
  tag?: string[]; // Optional for some Leaf elements
  text: string;
  note?: {
    children: [{ text: string }];
    type: string;
  };
  embeddedDoc?: boolean;
  SVitalics?: boolean;
}

// Block level, which contains Inline elements
export interface BibleInline {
  children: BibleLeaf[];
  tag?: string;
  start?: boolean | null;
  pIndex?: number | null;
  type: string;
}

// Content level, which contains Block elements and source info
export interface BibleBlock {
  children: BibleInline[];
  source: {
    color: string;
    sourceName: string;
    unique_sources?: string[];
    recipientName?: string;
    unique_recipients?: string[];
  };
}

// Segment level, the top level that contains Content elements
export interface SegmentType {
  content: BibleBlock[];
  colors: ColorsData;
  sources: SourcesData;
  readers: string[];
  id: string;
}

export function isIntroType(obj: any): obj is IntroType {
    return (
        obj &&
        Array.isArray(obj.content) &&
        obj.content.every(
            (block: any) =>
                block &&
                Array.isArray(block.children) &&
                typeof block.type === 'string' &&
                typeof block.id === 'string'
        ) &&
        typeof obj.colors === 'object' &&
        typeof obj.sources === 'object'
    );
}

export function isSegmentType(obj: any): obj is SegmentType {
    return (
        obj &&
        Array.isArray(obj.content) &&
        obj.content.every(
            (block: any) =>
                block &&
                Array.isArray(block.children) &&
                typeof block.source === 'object' &&
                typeof block.source.color === 'string' &&
                typeof block.source.sourceName === 'string'
        ) &&
        typeof obj.colors === 'object' &&
        typeof obj.sources === 'object'
    );
}

export interface SegmentTitleData {
  Segment: string;
  title: string;
  book: string[];
  ref?: string; // Optional property
  id?: string;
}

export type SegmentsTitleObject = {
  [key: string]: SegmentTitleData; // Dynamic keys for each segment
};

export interface BookData {
  verseCount: number;
  bookName: string;
  chapters: string;
  FCBH: string;
  YV: string;
}

export type BooksObject = {
  [key: string]: BookData; // Dynamic keys for each book (e.g., "Gen", "Exo")
};

import Books from "@/assets/data/BookChapterList.json";
export type SegmentIds = keyof typeof Books;

// Group Reading Bluetooth Types
export type Role = 'narrator' | 'god' | 'main_character' | 'other_voices';

export interface Participant {
  deviceId: string;
  deviceName: string;
  userName: string;
  role: Role;
  isReady: boolean;
  isConnected: boolean;
}

export interface GroupSession {
  id: string;
  storyId: string;
  storyTitle: string;
  scriptureReference: string;
  hostDeviceId: string;
  hostUserName: string;
  participants: Participant[];
  status: 'forming' | 'ready' | 'reading' | 'paused' | 'ended';
  createdAt: number;
  expiresAt: number;
  planId?: string;
  challengeId?: string;
}

export interface GroupSessionState {
  currentSession: GroupSession | null;
  isHost: boolean;
  currentRole: Role | null;
  currentUserName: string;
  scrollPosition: number;
  isScanning: boolean;
  nearbyGroups: GroupSession[];
}

export interface BluetoothSessionManager {
  // Host functions
  startBroadcasting(storyId: string, storyTitle: string, scriptureRef: string, hostRole: Role, hostUserName: string, planId?: string, challengeId?: string): Promise<string>;
  stopBroadcasting(): Promise<void>;
  acceptJoiner(deviceId: string, userName: string, requestedRole: Role): Promise<boolean>;
  syncScrollPosition(position: number): Promise<void>;
  
  // Joiner functions
  discoverNearbyGroups(): Promise<GroupSession[]>;
  requestToJoin(sessionId: string, role: Role, userName: string): Promise<boolean>;
  leaveGroup(): Promise<void>;
  
  // Shared functions
  onGroupStateChange(callback: (session: GroupSession) => void): void;
  onScrollSync(callback: (position: number) => void): void;
  onParticipantJoined(callback: (participant: Participant) => void): void;
  onParticipantLeft(callback: (deviceId: string) => void): void;
  handleDisconnection(): void;
  
  // State management
  getCurrentSession(): GroupSession | null;
  isCurrentHost(): boolean;
  getCurrentRole(): Role | null;
}
