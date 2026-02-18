import { useReaderStore } from "~store"

const PRESETS = [0.5, 0.75, 1, 1.25, 1.5, 2]

export function SpeedControl() {
  const { settings, updateSettings } = useReaderStore()

  const setRate = (rate: number) => {
    updateSettings({ rate: Math.max(0.5, Math.min(3, rate)) })
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] text-white/60 shrink-0" id="speed-label">
        Speed
      </label>
      <div className="flex items-center gap-1 flex-1">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            onClick={() => setRate(preset)}
            aria-label={`Set speed to ${preset}x`}
            className={`no-drag px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
              Math.abs(settings.rate - preset) < 0.01
                ? "bg-reader-primary text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {preset}x
          </button>
        ))}
      </div>
      <input
        type="range"
        min="0.5"
        max="3"
        step="0.25"
        value={settings.rate}
        onChange={(e) => setRate(parseFloat(e.target.value))}
        aria-labelledby="speed-label"
        aria-valuetext={`${settings.rate}x speed`}
        className="no-drag w-16 h-1 accent-reader-primary"
      />
      <span className="text-xs text-white font-mono w-8 text-right">
        {settings.rate}x
      </span>
    </div>
  )
}
