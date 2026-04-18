import { COMPATIBILITY_COEF_MAP, COMPATIBILITY_LEVEL_LABELS } from '../../constants/filterOptions'

interface CompatibilitySliderProps {
  label: string
  value: number
  onChange: (v: number) => void
}

export function CompatibilitySlider({ label, value, onChange }: CompatibilitySliderProps) {
  const coef = COMPATIBILITY_COEF_MAP[Math.max(0, Math.min(5, value))]
  const levelLabel = COMPATIBILITY_LEVEL_LABELS[Math.max(0, Math.min(5, value))]
  const percent = (value / 5) * 100

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-xs tabular-nums">
          <span className="text-text-primary font-medium">{levelLabel}</span>
          <span className="text-text-muted ml-2">×{coef.toFixed(2)}</span>
        </span>
      </div>
      <div className="relative h-8 flex items-center">
        <div className="absolute w-full h-1.5 bg-bg-surface-hover rounded-full" />
        <div
          className="absolute h-1.5 bg-accent-male rounded-full"
          style={{ width: `${percent}%` }}
        />
        <input
          type="range"
          min={0}
          max={5}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute w-full appearance-none bg-transparent z-10"
        />
      </div>
    </div>
  )
}
