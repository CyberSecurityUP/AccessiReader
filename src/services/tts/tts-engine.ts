import type { TTSEngine, AccessiReaderSettings } from "~types"
import { WebSpeechTTS } from "./web-speech-tts"
import { AITTSEngine } from "./ai-tts"

export function createTTSEngine(settings: AccessiReaderSettings): TTSEngine {
  switch (settings.ttsEngine) {
    case "openai":
      return new AITTSEngine(
        "openai",
        settings.openaiApiKey,
        settings.openaiModel
      )
    case "elevenlabs":
      return new AITTSEngine("elevenlabs", settings.elevenlabsApiKey)
    case "web-speech":
    default:
      return new WebSpeechTTS()
  }
}

export type { TTSEngine }
