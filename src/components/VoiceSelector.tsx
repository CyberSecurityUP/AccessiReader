import { useState, useEffect } from "react"
import { useReaderStore } from "~store"
import { createTTSEngine } from "~services/tts/tts-engine"
import type { TTSVoice } from "~types"

export function VoiceSelector() {
  const { settings, updateSettings } = useReaderStore()
  const [voices, setVoices] = useState<TTSVoice[]>([])

  useEffect(() => {
    const engine = createTTSEngine(settings)
    engine.getVoices().then(setVoices)
  }, [settings.ttsEngine, settings.openaiApiKey, settings.elevenlabsApiKey])

  // Group voices by language
  const grouped = voices.reduce<Record<string, TTSVoice[]>>((acc, voice) => {
    const lang = voice.language.split("-")[0] || "other"
    if (!acc[lang]) acc[lang] = []
    acc[lang].push(voice)
    return acc
  }, {})

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="voice-select"
        className="text-[10px] text-white/60 shrink-0"
      >
        Voice
      </label>
      <select
        id="voice-select"
        value={settings.voiceId}
        onChange={(e) => updateSettings({ voiceId: e.target.value })}
        aria-label="Select voice"
        className="no-drag flex-1 bg-white/10 text-white text-xs rounded px-2 py-1 border border-white/10 focus:border-reader-primary focus:outline-none"
      >
        <option value="">Default</option>
        {Object.entries(grouped).map(([lang, langVoices]) => (
          <optgroup key={lang} label={lang.toUpperCase()}>
            {langVoices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <span className="text-[9px] text-white/40 shrink-0">
        {settings.ttsEngine === "web-speech"
          ? "Free"
          : settings.ttsEngine.toUpperCase()}
      </span>
    </div>
  )
}
