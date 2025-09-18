// Component-specific types for Reading-emoji

export type SegmentTitle = {
  Segment: string
  title: string
  book: string[]
  ref?: string // Making ref optional since not all segments have it
}

export interface ActiveFilters {
  testament: string[]
  sourceColor: string[]
  sourceName: string[]
  book: string[]
}

export interface ModalPosition {
  x: number
  y: number
}

export interface SourceColorDisplay {
  bg: string
  text: string
}

export interface SpeakerType {
  color: string
  display: SourceColorDisplay
}
