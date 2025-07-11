// Removed IntroContentChild and IntroBlock - using unified BibleBlock structure

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

export interface IntroType extends BaseEntryType {
  // Intro entries use the same structure as segments now
}

// Union type for all Bible entries
export type BibleEntryType = IntroType | SegmentType;

// Type for the entire Bible data structure
export type BibleType = {
  [key: string]: BibleEntryType;
};

// Leaf level, representing the smallest unit
export interface BibleLeaf {
  TaS?: boolean;  // Make TaS optional since it's not always present
  ref?: string[]; // Make ref optional since it's not always present in intro entries
  tag?: string[]; // Optional for some Leaf elements
  text?: string;  // Make text optional for table elements that have children instead
  children?: BibleLeaf[]; // Optional for table elements that have nested children
  note?: {
    children: [{ text: string }];
    type: string;
  };
  embeddedDoc?: boolean;
  SVitalics?: boolean;
  // Additional properties for intro entries
  link?: {
    book: string;
    chapter: string;
    verse: string;
  };
  smallcaps?: boolean;
  bibleText?: boolean;
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
  source?: {  // Make source optional for intro entries
    color: string;
    sourceName: string;
    unique_sources?: string[];
    recipientName?: string;
    unique_recipients?: string[];
  };
}

// Base type for both intro and segment entries
export interface BaseEntryType {
  content: BibleBlock[];
  colors: ColorsData;
  sources: SourcesData;
  id?: string;         // Optional - may not always be present
  version?: number;    // Optional - present in the data but not always required
}

// Segment level, the top level that contains Content elements
export interface SegmentType extends BaseEntryType {
  readers?: string[];  // Optional - only present in S entries, not I entries
  repeatedWords?: string[];  // Optional - only present in S entries, not I entries
}

export function isIntroType(obj: any): obj is IntroType {
    return (
        obj &&
        Array.isArray(obj.content) &&
        typeof obj.colors === 'object' &&
        typeof obj.sources === 'object' &&
        !obj.readers &&  // Intro entries don't have readers
        !obj.repeatedWords  // Intro entries don't have repeatedWords
    );
}

export function isSegmentType(obj: any): obj is SegmentType {
    return (
        obj &&
        Array.isArray(obj.content) &&
        typeof obj.colors === 'object' &&
        typeof obj.sources === 'object' &&
        (obj.readers || obj.repeatedWords)  // Segment entries have at least one of these
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
