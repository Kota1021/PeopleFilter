import clsx from 'clsx'

interface ChipOption {
  value: string
  label: string
}

interface ChipSelectorProps {
  label: string
  options: readonly ChipOption[]
  selected: string[]
  onToggle: (value: string) => void
}

export function ChipSelector({ label, options, selected, onToggle }: ChipSelectorProps) {
  return (
    <div className="space-y-2">
      <span className="text-sm text-text-secondary">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isActive = selected.includes(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => onToggle(opt.value)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border',
                isActive
                  ? 'bg-accent-male/20 border-accent-male text-accent-male shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-text-muted hover:text-text-primary',
              )}
            >
              {opt.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
