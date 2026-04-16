import clsx from 'clsx'
import { useSelfStore } from '../../store/selfStore'
import { EDUCATION_OPTIONS, MARITAL_STATUS_OPTIONS } from '../../constants/filterOptions'

function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  step?: number
  unit?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className="text-sm font-medium tabular-nums">
          {value}{unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </div>
  )
}

export function SelfInput() {
  const store = useSelfStore()

  return (
    <div className="space-y-5">
      {/* Gender */}
      <div className="space-y-2">
        <span className="text-sm text-text-secondary">性別</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => store.setGender('male')}
            className={clsx(
              'py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border',
              store.gender === 'male'
                ? 'bg-accent-male/15 border-accent-male text-accent-male shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-bg-surface border-border text-text-secondary hover:border-text-muted',
            )}
          >
            男性
          </button>
          <button
            onClick={() => store.setGender('female')}
            className={clsx(
              'py-2.5 rounded-lg font-medium text-sm transition-all duration-200 border',
              store.gender === 'female'
                ? 'bg-accent-female/15 border-accent-female text-accent-female shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : 'bg-bg-surface border-border text-text-secondary hover:border-text-muted',
            )}
          >
            女性
          </button>
        </div>
      </div>

      {/* Age */}
      <NumberInput label="年齢" value={store.age} onChange={store.setAge} min={18} max={80} unit="歳" />

      {/* Marital Status */}
      <div className="space-y-2">
        <span className="text-sm text-text-secondary">配偶関係</span>
        <div className="flex flex-wrap gap-2">
          {MARITAL_STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => store.setMaritalStatus(opt.value)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border',
                store.maritalStatus === opt.value
                  ? 'bg-accent-male/20 border-accent-male text-accent-male shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-text-muted hover:text-text-primary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Income */}
      <NumberInput label="年収" value={store.income} onChange={store.setIncome} min={0} max={2000} step={50} unit="万円" />

      {/* Education */}
      <div className="space-y-2">
        <span className="text-sm text-text-secondary">学歴</span>
        <div className="flex flex-wrap gap-2">
          {EDUCATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => store.setEducation(opt.value)}
              className={clsx(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border',
                store.education === opt.value
                  ? 'bg-accent-male/20 border-accent-male text-accent-male shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-bg-surface border-border text-text-secondary hover:border-text-muted hover:text-text-primary',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Height */}
      <NumberInput label="身長" value={store.height} onChange={store.setHeight} min={140} max={200} unit="cm" />

      {/* Weight */}
      <NumberInput label="体重" value={store.weight} onChange={store.setWeight} min={30} max={120} unit="kg" />
    </div>
  )
}
