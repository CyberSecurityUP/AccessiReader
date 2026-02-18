import { useReaderStore } from "~store"

export function ProgressBar() {
  const progress = useReaderStore((s) => s.progress)

  return (
    <div className="w-full px-1">
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress.percentage)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Reading progress: ${Math.round(progress.percentage)}%`}
        className="w-full h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer"
      >
        <div
          className="h-full bg-reader-primary rounded-full transition-all duration-300"
          style={{ width: `${progress.percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-[10px] text-white/50 mt-0.5 px-0.5">
        <span>
          {progress.totalBlocks > 0
            ? `${progress.currentIndex + 1} / ${progress.totalBlocks}`
            : "---"}
        </span>
        <span>{Math.round(progress.percentage)}%</span>
      </div>
    </div>
  )
}
