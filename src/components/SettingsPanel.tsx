import { useState } from "react"
import { useReaderStore } from "~store"
import type { TTSEngineType, ThemeMode } from "~types"

export function SettingsPanel() {
  const { settings, updateSettings } = useReaderStore()
  const [showApiKeys, setShowApiKeys] = useState(false)

  return (
    <div className="space-y-3 text-xs" role="region" aria-label="Settings">
      {/* TTS Engine */}
      <div>
        <label className="text-white/60 text-[10px] block mb-1">
          TTS Engine
        </label>
        <div className="flex gap-1">
          {(["web-speech", "openai", "elevenlabs"] as TTSEngineType[]).map(
            (engine) => (
              <button
                key={engine}
                onClick={() => updateSettings({ ttsEngine: engine })}
                className={`no-drag flex-1 py-1 rounded text-[10px] font-medium transition-colors ${
                  settings.ttsEngine === engine
                    ? "bg-reader-primary text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
                aria-pressed={settings.ttsEngine === engine}
              >
                {engine === "web-speech"
                  ? "Free"
                  : engine === "openai"
                    ? "OpenAI"
                    : "ElevenLabs"}
              </button>
            )
          )}
        </div>
      </div>

      {/* API Keys (collapsible) */}
      {settings.ttsEngine !== "web-speech" && (
        <div>
          <button
            onClick={() => setShowApiKeys(!showApiKeys)}
            className="no-drag text-[10px] text-reader-primary hover:underline"
            aria-expanded={showApiKeys}
          >
            {showApiKeys ? "Hide" : "Show"} API Key Settings
          </button>
          {showApiKeys && (
            <div className="mt-1 space-y-2">
              {settings.ttsEngine === "openai" && (
                <>
                  <input
                    type="password"
                    placeholder="OpenAI API Key"
                    value={settings.openaiApiKey || ""}
                    onChange={(e) =>
                      updateSettings({ openaiApiKey: e.target.value })
                    }
                    aria-label="OpenAI API key"
                    className="no-drag w-full bg-white/10 text-white text-[10px] rounded px-2 py-1 border border-white/10 focus:border-reader-primary focus:outline-none"
                  />
                  <select
                    value={settings.openaiModel || "tts-1"}
                    onChange={(e) =>
                      updateSettings({
                        openaiModel: e.target.value as "tts-1" | "tts-1-hd"
                      })
                    }
                    aria-label="OpenAI model"
                    className="no-drag w-full bg-white/10 text-white text-[10px] rounded px-2 py-1 border border-white/10"
                  >
                    <option value="tts-1">TTS-1 (Fast)</option>
                    <option value="tts-1-hd">TTS-1-HD (Quality)</option>
                  </select>
                </>
              )}
              {settings.ttsEngine === "elevenlabs" && (
                <input
                  type="password"
                  placeholder="ElevenLabs API Key"
                  value={settings.elevenlabsApiKey || ""}
                  onChange={(e) =>
                    updateSettings({ elevenlabsApiKey: e.target.value })
                  }
                  aria-label="ElevenLabs API key"
                  className="no-drag w-full bg-white/10 text-white text-[10px] rounded px-2 py-1 border border-white/10 focus:border-reader-primary focus:outline-none"
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* Theme */}
      <div>
        <label className="text-white/60 text-[10px] block mb-1">Theme</label>
        <div className="flex gap-1">
          {(["dark", "light", "high-contrast"] as ThemeMode[]).map((theme) => (
            <button
              key={theme}
              onClick={() => updateSettings({ theme })}
              className={`no-drag flex-1 py-1 rounded text-[10px] font-medium transition-colors ${
                settings.theme === theme
                  ? "bg-reader-primary text-white"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              }`}
              aria-pressed={settings.theme === theme}
            >
              {theme === "high-contrast"
                ? "Hi-Con"
                : theme.charAt(0).toUpperCase() + theme.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Content Filters */}
      <div className="space-y-1.5">
        <label className="text-white/60 text-[10px] block">
          Content Filters
        </label>
        {[
          { key: "skipAds", label: "Skip advertisements" },
          { key: "skipNav", label: "Skip navigation" },
          { key: "skipCode", label: "Skip code blocks" },
          { key: "announceHeadings", label: "Announce headings" },
          { key: "announceCodeBlocks", label: "Announce code blocks" },
          { key: "autoScroll", label: "Auto-scroll to current" },
          { key: "highlightCurrent", label: "Highlight current block" }
        ].map(({ key, label }) => (
          <label
            key={key}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <input
              type="checkbox"
              checked={settings[key as keyof typeof settings] as boolean}
              onChange={(e) =>
                updateSettings({ [key]: e.target.checked })
              }
              className="no-drag w-3 h-3 rounded accent-reader-primary"
            />
            <span className="text-[10px] text-white/70 group-hover:text-white/90">
              {label}
            </span>
          </label>
        ))}
      </div>

      {/* Language */}
      <div>
        <label
          htmlFor="lang-select"
          className="text-white/60 text-[10px] block mb-1"
        >
          Language
        </label>
        <select
          id="lang-select"
          value={settings.language}
          onChange={(e) => updateSettings({ language: e.target.value })}
          className="no-drag w-full bg-white/10 text-white text-[10px] rounded px-2 py-1 border border-white/10"
        >
          <option value="pt-BR">Portugues (BR)</option>
          <option value="en-US">English (US)</option>
          <option value="en-GB">English (UK)</option>
          <option value="es-ES">Espanol</option>
          <option value="fr-FR">Francais</option>
          <option value="de-DE">Deutsch</option>
          <option value="it-IT">Italiano</option>
          <option value="ja-JP">Japanese</option>
          <option value="zh-CN">Chinese</option>
        </select>
      </div>

      {/* Volume & Pitch */}
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-white/60 text-[10px] block mb-1">
            Volume
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.volume}
            onChange={(e) =>
              updateSettings({ volume: parseFloat(e.target.value) })
            }
            aria-label="Volume"
            className="no-drag w-full h-1 accent-reader-primary"
          />
        </div>
        <div className="flex-1">
          <label className="text-white/60 text-[10px] block mb-1">
            Pitch
          </label>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={settings.pitch}
            onChange={(e) =>
              updateSettings({ pitch: parseFloat(e.target.value) })
            }
            aria-label="Pitch"
            className="no-drag w-full h-1 accent-reader-primary"
          />
        </div>
      </div>
    </div>
  )
}
