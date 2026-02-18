// =============================================
// Content Block Types
// =============================================

export type ContentBlockType =
  | "heading"
  | "paragraph"
  | "code"
  | "list"
  | "list-item"
  | "blockquote"
  | "link"
  | "image-alt"
  | "table"
  | "ad"
  | "nav"
  | "interactive"

export interface ContentBlock {
  id: string
  type: ContentBlockType
  text: string
  elementSelector: string
  level?: number
  language?: string
  priority: number // 0=skip(ad), 1=low(nav), 2=normal, 3=high(main)
  metadata?: {
    tagName: string
    role?: string
    ariaLabel?: string
    href?: string
    altText?: string
  }
}

// =============================================
// TTS Types
// =============================================

export type TTSEngineType = "web-speech" | "openai" | "elevenlabs"

export interface TTSVoice {
  id: string
  name: string
  language: string
  provider: TTSEngineType
}

export interface TTSOptions {
  rate: number
  pitch: number
  volume: number
  voice?: TTSVoice
  language: string
}

export interface TTSBoundaryEvent {
  charIndex: number
  charLength: number
  word: string
}

export interface TTSEngine {
  readonly type: TTSEngineType
  speak(text: string, options: TTSOptions): Promise<void>
  pause(): void
  resume(): void
  stop(): void
  getVoices(): Promise<TTSVoice[]>
  isSupported(): boolean
  onBoundary?: (event: TTSBoundaryEvent) => void
  onEnd?: () => void
  onError?: (error: string) => void
}

// =============================================
// Reading State
// =============================================

export type ReadingMode = "full-page" | "selector" | "idle"

export type ThemeMode = "light" | "dark" | "high-contrast"

export interface ReadingProgress {
  currentIndex: number
  totalBlocks: number
  percentage: number
}

// =============================================
// Settings (Persisted)
// =============================================

export interface ContentFilterSettings {
  includeImages: boolean
  includeTables: boolean
  includeBlockquotes: boolean
  includeLinks: boolean
  maxCodeBlockLength: number
}

export interface AccessiReaderSettings {
  ttsEngine: TTSEngineType
  openaiApiKey?: string
  elevenlabsApiKey?: string
  openaiModel?: "tts-1" | "tts-1-hd"
  openaiVoice?: string
  elevenlabsVoiceId?: string
  voiceId: string
  rate: number
  pitch: number
  volume: number
  language: string
  autoScroll: boolean
  highlightCurrent: boolean
  skipAds: boolean
  skipNav: boolean
  skipCode: boolean
  announceHeadings: boolean
  announceCodeBlocks: boolean
  theme: ThemeMode
  overlayPosition: { x: number; y: number }
  overlayMinimized: boolean
  contentFilter: ContentFilterSettings
}

// =============================================
// Messages (Popup <-> Content <-> Background)
// =============================================

export type MessageType =
  | "START_READING"
  | "STOP_READING"
  | "PAUSE_READING"
  | "RESUME_READING"
  | "NEXT_BLOCK"
  | "PREV_BLOCK"
  | "SET_MODE"
  | "SETTINGS_UPDATED"
  | "GET_STATUS"
  | "STATUS_RESPONSE"
  | "ACTIVATE_SELECTOR"
  | "DEACTIVATE_SELECTOR"
  | "SELECTOR_RESULT"
  | "READ_SELECTION"

export interface ExtensionMessage {
  type: MessageType
  payload?: unknown
}
