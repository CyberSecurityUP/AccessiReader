import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"
import type {
  ContentBlock,
  ReadingMode,
  ReadingProgress,
  AccessiReaderSettings
} from "~types"

const DEFAULT_SETTINGS: AccessiReaderSettings = {
  ttsEngine: "web-speech",
  voiceId: "",
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  language: "pt-BR",
  autoScroll: true,
  highlightCurrent: true,
  skipAds: true,
  skipNav: true,
  skipCode: true,
  announceHeadings: true,
  announceCodeBlocks: true,
  theme: "dark",
  overlayPosition: { x: 20, y: 20 },
  overlayMinimized: false,
  contentFilter: {
    includeImages: true,
    includeTables: true,
    includeBlockquotes: true,
    includeLinks: false,
    maxCodeBlockLength: 500
  }
}

interface AccessiReaderStore {
  // Reading state (session-only)
  isReading: boolean
  isPaused: boolean
  currentBlock: ContentBlock | null
  blocks: ContentBlock[]
  progress: ReadingProgress
  mode: ReadingMode
  selectorActive: boolean
  selectedElements: ContentBlock[]
  overlayVisible: boolean

  // Settings (persisted)
  settings: AccessiReaderSettings

  // Reading actions
  startReading: (blocks: ContentBlock[]) => void
  pauseReading: () => void
  resumeReading: () => void
  stopReading: () => void
  setCurrentBlock: (block: ContentBlock | null, index: number) => void
  setMode: (mode: ReadingMode) => void

  // Selector actions
  setSelectorActive: (active: boolean) => void
  addSelectedElement: (block: ContentBlock) => void
  clearSelectedElements: () => void

  // UI actions
  setOverlayVisible: (visible: boolean) => void

  // Settings actions
  updateSettings: (partial: Partial<AccessiReaderSettings>) => void
  resetSettings: () => void
}

export const useReaderStore = create<AccessiReaderStore>()(
  persist(
    (set) => ({
      isReading: false,
      isPaused: false,
      currentBlock: null,
      blocks: [],
      progress: { currentIndex: 0, totalBlocks: 0, percentage: 0 },
      mode: "idle" as ReadingMode,
      selectorActive: false,
      selectedElements: [],
      overlayVisible: true,
      settings: DEFAULT_SETTINGS,

      startReading: (blocks) =>
        set({
          isReading: true,
          isPaused: false,
          blocks,
          progress: {
            currentIndex: 0,
            totalBlocks: blocks.length,
            percentage: 0
          }
        }),

      pauseReading: () => set({ isPaused: true }),
      resumeReading: () => set({ isPaused: false }),

      stopReading: () =>
        set({
          isReading: false,
          isPaused: false,
          currentBlock: null,
          blocks: [],
          progress: { currentIndex: 0, totalBlocks: 0, percentage: 0 },
          mode: "idle" as ReadingMode
        }),

      setCurrentBlock: (block, index) =>
        set((state) => ({
          currentBlock: block,
          progress: {
            currentIndex: index,
            totalBlocks: state.blocks.length,
            percentage:
              state.blocks.length > 0
                ? ((index + 1) / state.blocks.length) * 100
                : 0
          }
        })),

      setMode: (mode) => set({ mode }),

      setSelectorActive: (active) => set({ selectorActive: active }),

      addSelectedElement: (block) =>
        set((state) => ({
          selectedElements: [...state.selectedElements, block]
        })),

      clearSelectedElements: () => set({ selectedElements: [] }),

      setOverlayVisible: (visible) => set({ overlayVisible: visible }),

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        })),

      resetSettings: () => set({ settings: DEFAULT_SETTINGS })
    }),
    {
      name: "accessireader-storage",
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          const result = await chrome.storage.local.get(name)
          return result[name] || null
        },
        setItem: async (name: string, value: string) => {
          await chrome.storage.local.set({ [name]: value })
        },
        removeItem: async (name: string) => {
          await chrome.storage.local.remove(name)
        }
      })),
      partialize: (state) => ({
        settings: state.settings
      })
    }
  )
)

// Individual selectors - each returns a primitive or stable store reference
// This avoids the infinite loop caused by object-returning selectors
export const useSettings = () => useReaderStore((s) => s.settings)
