import { useEffect, useRef, useCallback } from "react"
import { useReaderStore } from "~store"
import { ContentExtractor } from "~services/content-extractor"
import { ReadingQueue } from "~services/reading-queue"
import { createTTSEngine } from "~services/tts/tts-engine"
import type { TTSEngine } from "~types"

export function useReader() {
  const {
    settings,
    isReading,
    isPaused,
    startReading,
    pauseReading,
    resumeReading,
    stopReading,
    setCurrentBlock,
    setMode
  } = useReaderStore()

  const extractorRef = useRef(new ContentExtractor())
  const queueRef = useRef(new ReadingQueue())
  const ttsRef = useRef<TTSEngine | null>(null)
  const isReadingRef = useRef(false)

  // Create TTS engine immediately (not just in effect)
  if (!ttsRef.current) {
    ttsRef.current = createTTSEngine(settings)
  }

  // Recreate TTS engine when type/keys change
  useEffect(() => {
    ttsRef.current?.stop()
    ttsRef.current = createTTSEngine(settings)
    return () => {
      ttsRef.current?.stop()
    }
  }, [settings.ttsEngine, settings.openaiApiKey, settings.elevenlabsApiKey])

  // Keep ref in sync with state
  useEffect(() => {
    isReadingRef.current = isReading
  }, [isReading])

  const readNext = useCallback(async () => {
    if (!isReadingRef.current) {
      console.log("[AccessiReader] readNext: isReadingRef is false, skipping")
      return
    }

    const engine = ttsRef.current
    if (!engine) {
      console.error("[AccessiReader] No TTS engine available")
      return
    }

    const queue = queueRef.current
    const previousBlock = queue.current
    const nextBlock = queue.next()

    if (!nextBlock) {
      console.log("[AccessiReader] readNext: no more blocks, stopping")
      isReadingRef.current = false
      stopReading()
      return
    }

    console.log(`[AccessiReader] readNext: block ${queue.currentIndex} type=${nextBlock.type} text="${nextBlock.text.substring(0, 60)}..."`)
    setCurrentBlock(nextBlock, queue.currentIndex)

    // Auto-scroll to current element
    if (settings.autoScroll) {
      try {
        const el = document.querySelector(nextBlock.elementSelector)
        el?.scrollIntoView({ behavior: "smooth", block: "center" })
      } catch {
        // Selector may be invalid on dynamic pages
      }
    }

    // Build TTS options
    const ttsOptions = {
      rate: settings.rate,
      pitch: settings.pitch,
      volume: settings.volume,
      language: settings.language,
      voice: settings.voiceId
        ? {
            id: settings.voiceId,
            name: settings.voiceId,
            language: settings.language,
            provider: settings.ttsEngine
          }
        : undefined
    }

    // Announce transition between different content types
    const transition = queue.getTransition(previousBlock, nextBlock)
    if (
      transition &&
      ((nextBlock.type === "heading" && settings.announceHeadings) ||
        (nextBlock.type === "code" && settings.announceCodeBlocks) ||
        !["heading", "code", "paragraph"].includes(nextBlock.type))
    ) {
      try {
        await engine.speak(transition, ttsOptions)
      } catch {
        // Skip transition on error
      }
      if (!isReadingRef.current) return
    }

    // Speak the block text, then chain to next block
    try {
      await engine.speak(nextBlock.text, ttsOptions)
    } catch (err) {
      console.warn("[AccessiReader] TTS error, skipping block:", err)
    }

    // After speech finishes, automatically read next block
    if (isReadingRef.current) {
      readNext()
    }
  }, [settings, setCurrentBlock, stopReading])

  const startFullPageReading = useCallback(() => {
    const extractor = extractorRef.current
    const extractedBlocks = extractor.extractAll(document)
    const filtered = extractor.filterBySettings(extractedBlocks, settings)

    console.log(
      `[AccessiReader] Extracted ${extractedBlocks.length} blocks, ${filtered.length} after filter`
    )

    if (filtered.length === 0) {
      console.warn("[AccessiReader] No content found on this page")
      return
    }

    // Stop any current reading
    ttsRef.current?.stop()
    queueRef.current.replace(filtered)

    // Set state synchronously via ref BEFORE calling readNext
    isReadingRef.current = true
    setMode("full-page")
    startReading(filtered)

    // Call readNext SYNCHRONOUSLY - setTimeout breaks Chrome's user gesture
    // chain which causes speechSynthesis.speak() to silently fail
    readNext()
  }, [settings, setMode, startReading, readNext])

  const startSelectorReading = useCallback(() => {
    // Read selectedElements fresh from store to avoid stale closure
    const elements = useReaderStore.getState().selectedElements
    console.log(`[AccessiReader] startSelectorReading: ${elements.length} elements`)

    if (elements.length === 0) {
      console.warn("[AccessiReader] No elements selected")
      return
    }

    // Deactivate selector mode
    useReaderStore.getState().setSelectorActive(false)

    ttsRef.current?.stop()
    queueRef.current.replace(elements)

    isReadingRef.current = true
    setMode("selector")
    startReading(elements)

    // Call readNext SYNCHRONOUSLY - setTimeout breaks Chrome's user gesture
    // chain which causes speechSynthesis.speak() to silently fail
    readNext()
  }, [setMode, startReading, readNext])

  const pause = useCallback(() => {
    ttsRef.current?.pause()
    pauseReading()
  }, [pauseReading])

  const resume = useCallback(() => {
    ttsRef.current?.resume()
    resumeReading()
  }, [resumeReading])

  const stop = useCallback(() => {
    isReadingRef.current = false
    ttsRef.current?.stop()
    queueRef.current.clear()
    stopReading()
  }, [stopReading])

  const nextBlock = useCallback(() => {
    ttsRef.current?.stop()
    readNext()
  }, [readNext])

  const prevBlock = useCallback(() => {
    ttsRef.current?.stop()
    const queue = queueRef.current
    // Go back 2 so readNext advances to the correct one
    queue.previous()
    queue.previous()
    readNext()
  }, [readNext])

  // Listen for messages from popup/background
  useEffect(() => {
    const listener = (
      message: { type: string; payload?: unknown },
      _sender: chrome.runtime.MessageSender,
      sendResponse: (response: unknown) => void
    ) => {
      switch (message.type) {
        case "START_READING":
          startFullPageReading()
          sendResponse({ success: true })
          return true
        case "STOP_READING":
          stop()
          sendResponse({ success: true })
          return true
        case "PAUSE_READING":
          pause()
          sendResponse({ success: true })
          return true
        case "RESUME_READING":
          resume()
          sendResponse({ success: true })
          return true
        case "NEXT_BLOCK":
          nextBlock()
          sendResponse({ success: true })
          return true
        case "PREV_BLOCK":
          prevBlock()
          sendResponse({ success: true })
          return true
        case "READ_SELECTION":
          startSelectorReading()
          sendResponse({ success: true })
          return true
        case "GET_STATUS": {
          const state = useReaderStore.getState()
          sendResponse({
            success: true,
            isReading: state.isReading,
            isPaused: state.isPaused,
            currentIndex: state.progress.currentIndex,
            totalBlocks: state.progress.totalBlocks,
            mode: state.mode
          })
          return true
        }
        default:
          return false // Don't handle unknown messages
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [
    startFullPageReading,
    stop,
    pause,
    resume,
    nextBlock,
    prevBlock,
    startSelectorReading
  ])

  return {
    startFullPageReading,
    startSelectorReading,
    pause,
    resume,
    stop,
    nextBlock,
    prevBlock
  }
}
