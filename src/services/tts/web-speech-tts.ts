import type { TTSEngine, TTSEngineType, TTSOptions, TTSVoice, TTSBoundaryEvent } from "~types"

const MAX_CHUNK_LENGTH = 250

export class WebSpeechTTS implements TTSEngine {
  readonly type: TTSEngineType = "web-speech"
  private synth: SpeechSynthesis
  private currentUtterance: SpeechSynthesisUtterance | null = null
  private isPaused = false
  private isSpeaking = false
  private cancelRequested = false
  private voiceLoadPromise: Promise<SpeechSynthesisVoice[]>

  onBoundary?: (event: TTSBoundaryEvent) => void
  onEnd?: () => void
  onError?: (error: string) => void

  constructor() {
    this.synth = window.speechSynthesis
    this.voiceLoadPromise = this.loadVoices()
  }

  private loadVoices(): Promise<SpeechSynthesisVoice[]> {
    return new Promise((resolve) => {
      const voices = this.synth.getVoices()
      if (voices.length > 0) {
        resolve(voices)
        return
      }
      this.synth.onvoiceschanged = () => {
        resolve(this.synth.getVoices())
      }
      // Timeout fallback for browsers that never fire voiceschanged
      setTimeout(() => resolve(this.synth.getVoices()), 1000)
    })
  }

  async speak(text: string, options: TTSOptions): Promise<void> {
    this.stop()
    this.cancelRequested = false
    this.isSpeaking = true

    const chunks = this.splitIntoChunks(text)

    for (const chunk of chunks) {
      if (this.cancelRequested) break
      await this.speakChunk(chunk, options)
    }

    this.isSpeaking = false
    // Don't call onEnd here - the caller chains via await/Promise resolution
    // This avoids double-execution when readNext both awaits and sets onEnd
  }

  private speakChunk(text: string, options: TTSOptions): Promise<void> {
    return new Promise((resolve) => {
      if (this.cancelRequested) {
        resolve()
        return
      }

      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = options.rate
      utterance.pitch = options.pitch
      utterance.volume = options.volume
      utterance.lang = options.language

      if (options.voice) {
        const nativeVoices = this.synth.getVoices()
        const match = nativeVoices.find((v) => v.name === options.voice!.id)
        if (match) utterance.voice = match
      }

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        this.onBoundary?.({
          charIndex: event.charIndex,
          charLength: event.charLength || 1,
          word: text.substring(
            event.charIndex,
            event.charIndex + (event.charLength || 1)
          )
        })
      }

      utterance.onend = () => {
        console.log("[AccessiReader TTS] Chunk finished speaking")
        this.currentUtterance = null
        resolve()
      }

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        console.warn(`[AccessiReader TTS] Speech error: ${event.error}`)
        this.currentUtterance = null
        if (event.error !== "canceled" && event.error !== "interrupted") {
          this.onError?.(event.error)
        }
        resolve()
      }

      this.currentUtterance = utterance
      console.log(`[AccessiReader TTS] Speaking: "${text.substring(0, 50)}..." lang=${options.language}`)
      this.synth.speak(utterance)
    })
  }

  private splitIntoChunks(text: string): string[] {
    if (text.length <= MAX_CHUNK_LENGTH) return [text]

    const sentences = text.match(/[^.!?]+[.!?]+\s*/g) || [text]
    const chunks: string[] = []
    let current = ""

    for (const sentence of sentences) {
      if (
        (current + sentence).length > MAX_CHUNK_LENGTH &&
        current.length > 0
      ) {
        chunks.push(current.trim())
        current = sentence
      } else {
        current += sentence
      }
    }

    if (current.trim()) {
      chunks.push(current.trim())
    }

    return chunks
  }

  pause(): void {
    this.synth.pause()
    this.isPaused = true
  }

  resume(): void {
    this.synth.resume()
    this.isPaused = false
  }

  stop(): void {
    this.cancelRequested = true
    this.synth.cancel()
    this.currentUtterance = null
    this.isPaused = false
    this.isSpeaking = false
  }

  async getVoices(): Promise<TTSVoice[]> {
    const nativeVoices = await this.voiceLoadPromise
    return nativeVoices.map((v) => ({
      id: v.name,
      name: v.name,
      language: v.lang,
      provider: "web-speech" as TTSEngineType
    }))
  }

  isSupported(): boolean {
    return "speechSynthesis" in window
  }
}
