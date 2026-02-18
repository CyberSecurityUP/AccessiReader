import type { TTSEngine, TTSEngineType, TTSOptions, TTSVoice, TTSBoundaryEvent } from "~types"

const OPENAI_VOICES = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]

export class AITTSEngine implements TTSEngine {
  readonly type: TTSEngineType
  private audioElement: HTMLAudioElement | null = null
  private apiKey?: string
  private model?: string
  private audioCache = new Map<string, string>()

  onBoundary?: (event: TTSBoundaryEvent) => void
  onEnd?: () => void
  onError?: (error: string) => void

  constructor(
    type: "openai" | "elevenlabs",
    apiKey?: string,
    model?: string
  ) {
    this.type = type
    this.apiKey = apiKey
    this.model = model
  }

  async speak(text: string, options: TTSOptions): Promise<void> {
    this.stop()

    if (!this.apiKey) {
      this.onError?.(`API key required for ${this.type}`)
      return
    }

    try {
      const audioUrl = await this.fetchAudio(text, options)
      await this.playAudio(audioUrl, options)
    } catch (error) {
      this.onError?.(
        error instanceof Error ? error.message : "TTS API error"
      )
    }
  }

  private async fetchAudio(
    text: string,
    options: TTSOptions
  ): Promise<string> {
    const cacheKey = `${this.type}-${text}-${options.voice?.id || "default"}`
    const cached = this.audioCache.get(cacheKey)
    if (cached) return cached

    let blob: Blob

    if (this.type === "openai") {
      const response = await fetch(
        "https://api.openai.com/v1/audio/speech",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: this.model || "tts-1",
            input: text,
            voice: options.voice?.id || "alloy",
            speed: options.rate
          })
        }
      )
      if (!response.ok) {
        throw new Error(`OpenAI TTS error: ${response.status}`)
      }
      blob = await response.blob()
    } else {
      const voiceId = options.voice?.id || "21m00Tcm4TlvDq8ikWAM"
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey!,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text,
            model_id: "eleven_monolingual_v1",
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75
            }
          })
        }
      )
      if (!response.ok) {
        throw new Error(`ElevenLabs error: ${response.status}`)
      }
      blob = await response.blob()
    }

    const url = URL.createObjectURL(blob)
    this.audioCache.set(cacheKey, url)
    return url
  }

  private playAudio(url: string, options: TTSOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      this.audioElement = new Audio(url)
      this.audioElement.volume = options.volume
      // OpenAI handles rate server-side via speed param
      if (this.type !== "openai") {
        this.audioElement.playbackRate = options.rate
      }

      this.audioElement.onended = () => {
        resolve()
      }

      this.audioElement.onerror = () => {
        reject(new Error("Audio playback failed"))
      }

      this.audioElement.play().catch(reject)
    })
  }

  pause(): void {
    this.audioElement?.pause()
  }

  resume(): void {
    this.audioElement?.play()
  }

  stop(): void {
    if (this.audioElement) {
      this.audioElement.pause()
      this.audioElement.currentTime = 0
      this.audioElement = null
    }
  }

  async getVoices(): Promise<TTSVoice[]> {
    if (this.type === "openai") {
      return OPENAI_VOICES.map((v) => ({
        id: v,
        name: v.charAt(0).toUpperCase() + v.slice(1),
        language: "en",
        provider: "openai" as TTSEngineType
      }))
    }

    // ElevenLabs: return common default voices
    return [
      {
        id: "21m00Tcm4TlvDq8ikWAM",
        name: "Rachel",
        language: "en",
        provider: "elevenlabs"
      },
      {
        id: "AZnzlk1XvdvUeBnXmlld",
        name: "Domi",
        language: "en",
        provider: "elevenlabs"
      },
      {
        id: "EXAVITQu4vr4xnSDxMaL",
        name: "Bella",
        language: "en",
        provider: "elevenlabs"
      },
      {
        id: "MF3mGyEYCl7XYWbV9V6O",
        name: "Elli",
        language: "en",
        provider: "elevenlabs"
      }
    ]
  }

  isSupported(): boolean {
    return !!this.apiKey
  }
}
