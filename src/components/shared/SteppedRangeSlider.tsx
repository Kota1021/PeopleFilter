import { useCallback } from 'react'

interface SteppedRangeSliderProps {
  label: string
  steps: readonly number[]
  stepLabels: Record<number, string>
  value: [number, number]
  onChange: (value: [number, number]) => void
}

export function SteppedRangeSlider({
  label,
  steps,
  stepLabels,
  value,
  onChange,
}: SteppedRangeSliderProps) {
  const minIndex = steps.indexOf(value[0]) >= 0 ? steps.indexOf(value[0]) : 0
  const maxIndex = steps.indexOf(value[1]) >= 0 ? steps.indexOf(value[1]) : steps.length - 1
  const lastIndex = steps.length - 1

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = Number(e.target.value)
      const newMin = steps[Math.min(idx, maxIndex)]
      onChange([newMin, value[1]])
    },
    [steps, maxIndex, value, onChange],
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const idx = Number(e.target.value)
      const newMax = steps[Math.max(idx, minIndex)]
      onChange([value[0], newMax])
    },
    [steps, minIndex, value, onChange],
  )

  const leftPercent = (minIndex / lastIndex) * 100
  const rightPercent = (maxIndex / lastIndex) * 100

  const minLabel = stepLabels[value[0]] ?? String(value[0])
  const maxLabel = stepLabels[value[1]] ?? String(value[1])

  // Show a few tick labels
  const tickIndices = [0, Math.floor(lastIndex / 4), Math.floor(lastIndex / 2), Math.floor(lastIndex * 3 / 4), lastIndex]
  const uniqueTicks = [...new Set(tickIndices)]

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-medium tabular-nums">
          {minLabel} 〜 {maxLabel}
        </span>
      </div>
      <div className="relative h-8 flex items-center">
        <div className="absolute w-full h-1.5 bg-bg-surface-hover rounded-full" />
        <div
          className="absolute h-1.5 bg-accent-male rounded-full"
          style={{
            left: `${leftPercent}%`,
            width: `${rightPercent - leftPercent}%`,
          }}
        />
        <input
          type="range"
          min={0}
          max={lastIndex}
          step={1}
          value={minIndex}
          onChange={handleMinChange}
          className="absolute w-full pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto appearance-none bg-transparent z-10"
        />
        <input
          type="range"
          min={0}
          max={lastIndex}
          step={1}
          value={maxIndex}
          onChange={handleMaxChange}
          className="absolute w-full pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto appearance-none bg-transparent z-20"
        />
      </div>
      {/* Tick labels */}
      <div className="relative h-4">
        {uniqueTicks.map((idx) => (
          <span
            key={idx}
            className="absolute text-[10px] text-text-muted -translate-x-1/2"
            style={{ left: `${(idx / lastIndex) * 100}%` }}
          >
            {stepLabels[steps[idx]] ?? steps[idx]}
          </span>
        ))}
      </div>
    </div>
  )
}
