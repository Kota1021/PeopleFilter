import clsx from 'clsx'
import { useFilterStore } from '../../store/filterStore'
import { RangeSlider } from '../shared/RangeSlider'
import { ChipSelector } from '../shared/ChipSelector'
import { SteppedRangeSlider } from '../shared/SteppedRangeSlider'
import { PrefectureSelector } from '../shared/PrefectureSelector'
import {
  MARITAL_STATUS_OPTIONS,
  INCOME_STEPS,
  INCOME_STEP_LABELS,
  EDUCATION_OPTIONS,
  OCCUPATION_OPTIONS,
  AGE_RANGE,
  HEIGHT_RANGE,
  WEIGHT_RANGE,
} from '../../constants/filterOptions'

export function FilterPanel() {
  const store = useFilterStore()

  return (
    <div className="space-y-6">
      {/* Gender selector */}
      <div className="space-y-2">
        <span className="text-sm text-text-secondary">探す相手</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => store.setTargetGender('male')}
            className={clsx(
              'py-3 rounded-lg font-medium text-sm transition-all duration-200 border',
              store.targetGender === 'male'
                ? 'bg-accent-male/15 border-accent-male text-accent-male shadow-[0_0_12px_rgba(6,182,212,0.2)]'
                : 'bg-bg-surface border-border text-text-secondary hover:border-text-muted',
            )}
          >
            男性を探す
          </button>
          <button
            onClick={() => store.setTargetGender('female')}
            className={clsx(
              'py-3 rounded-lg font-medium text-sm transition-all duration-200 border',
              store.targetGender === 'female'
                ? 'bg-accent-female/15 border-accent-female text-accent-female shadow-[0_0_12px_rgba(244,63,94,0.2)]'
                : 'bg-bg-surface border-border text-text-secondary hover:border-text-muted',
            )}
          >
            女性を探す
          </button>
        </div>
      </div>

      {/* Marital status */}
      <div className="space-y-2">
        <span className="text-sm text-text-secondary">配偶関係</span>
        <div className="flex flex-wrap gap-2">
          {MARITAL_STATUS_OPTIONS.map((opt) => {
            const isActive = store.maritalStatuses.includes(opt.value)
            return (
              <button
                key={opt.value}
                onClick={() => store.toggleMaritalStatus(opt.value)}
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

      {/* Age range */}
      <RangeSlider
        label="年齢"
        min={AGE_RANGE.min}
        max={AGE_RANGE.max}
        step={1}
        value={store.ageRange}
        onChange={store.setAgeRange}
        unit="歳"
      />

      {/* Income range slider */}
      <SteppedRangeSlider
        label="年収"
        steps={INCOME_STEPS}
        stepLabels={INCOME_STEP_LABELS}
        value={store.incomeRange}
        onChange={store.setIncomeRange}
      />

      {/* Education */}
      <ChipSelector
        label="学歴"
        options={EDUCATION_OPTIONS}
        selected={store.educationLevels}
        onToggle={store.toggleEducation}
      />

      {/* Height range */}
      <RangeSlider
        label="身長"
        min={HEIGHT_RANGE.min}
        max={HEIGHT_RANGE.max}
        step={1}
        value={store.heightRange}
        onChange={store.setHeightRange}
        unit="cm"
      />

      {/* Weight range */}
      <RangeSlider
        label="体重"
        min={WEIGHT_RANGE.min}
        max={WEIGHT_RANGE.max}
        step={1}
        value={store.weightRange}
        onChange={store.setWeightRange}
        unit="kg"
      />

      {/* Occupation */}
      <ChipSelector
        label="職業"
        options={OCCUPATION_OPTIONS}
        selected={store.occupations}
        onToggle={store.toggleOccupation}
      />

      {/* Prefecture */}
      <PrefectureSelector
        selected={store.prefectures}
        onToggle={store.togglePrefecture}
      />

      {/* Reset button */}
      <button
        onClick={store.resetAll}
        className="w-full py-2 rounded-lg text-sm text-text-muted border border-border hover:text-text-secondary hover:border-text-muted transition-colors"
      >
        条件をリセット
      </button>
    </div>
  )
}
