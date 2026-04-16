import { useCallback, useRef } from 'react'

interface RangeSliderProps {
  label: string
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  formatValue?: (v: number) => string
  unit?: string
}

export function RangeSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  formatValue = String,
  unit = '',
}: RangeSliderProps) {
  const sliderRef = useRef<HTMLDivElement>(null)

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMin = Number(e.target.value)
      onChange([Math.min(newMin, value[1]), value[1]])
    },
    [value, onChange],
  )

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newMax = Number(e.target.value)
      onChange([value[0], Math.max(newMax, value[0])])
    },
    [value, onChange],
  )

  const leftPercent = ((value[0] - min) / (max - min)) * 100
  const rightPercent = ((value[1] - min) / (max - min)) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-medium tabular-nums">
          {formatValue(value[0])}{unit} 〜 {formatValue(value[1])}{unit}
        </span>
      </div>
      <div ref={sliderRef} className="relative h-8 flex items-center">
        {/* Track background */}
        <div className="absolute w-full h-1.5 bg-bg-surface-hover rounded-full" />
        {/* Active range highlight */}
        <div
          className="absolute h-1.5 bg-accent-male rounded-full"
          style={{
            left: `${leftPercent}%`,
            width: `${rightPercent - leftPercent}%`,
          }}
        />
        {/* Min slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[0]}
          onChange={handleMinChange}
          className="absolute w-full pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto appearance-none bg-transparent z-10"
        />
        {/* Max slider */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value[1]}
          onChange={handleMaxChange}
          className="absolute w-full pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto appearance-none bg-transparent z-20"
        />
      </div>
    </div>
  )
}
