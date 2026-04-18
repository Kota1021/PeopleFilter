import { useMemo, useState } from 'react'
import { LineChart } from './LineChart'
import { CDFChart } from './CDFChart'
import { RangeSlider } from '../shared/RangeSlider'
import {
  averageIncomeByAge,
  averageHeightByAge,
  smokingRateByAge,
  incomeCDFByAge,
  heightCDFByAge,
  INCOME_AGE_RANGE,
  HEIGHT_AGE_RANGE,
} from '../../engine/statsByAge'

export function StatsView() {
  const incomeData = useMemo(() => averageIncomeByAge(), [])
  const heightData = useMemo(() => averageHeightByAge(), [])
  const smokingData = useMemo(() => smokingRateByAge(), [])

  const [incomeAgeRange, setIncomeAgeRange] = useState<[number, number]>([30, 39])
  const [heightAgeRange, setHeightAgeRange] = useState<[number, number]>([20, 39])

  const incomeCDF = useMemo(() => incomeCDFByAge(incomeAgeRange), [incomeAgeRange])
  const heightCDF = useMemo(() => heightCDFByAge(heightAgeRange), [heightAgeRange])

  const incomeHighlight = useMemo(() => {
    const idx = incomeData.findIndex(
      (p) => p.ageStart === incomeAgeRange[0] && p.ageEnd === incomeAgeRange[1],
    )
    return idx >= 0 ? idx : null
  }, [incomeData, incomeAgeRange])

  const heightHighlight = useMemo(() => {
    const idx = heightData.findIndex(
      (p) => p.ageStart === heightAgeRange[0] && p.ageEnd === heightAgeRange[1],
    )
    return idx >= 0 ? idx : null
  }, [heightData, heightAgeRange])

  return (
    <div className="flex flex-col gap-5">
      <StatsCard
        title="年齢別 平均年収"
        description="有業者の平均年収。配偶関係・学歴で加重平均したもの。点をクリックするとその年代の上位%を表示。"
        source="就業構造基本調査 2022 + 国勢調査 2020"
      >
        <LineChart
          points={incomeData}
          yUnit="万円"
          formatValue={(v) => `${Math.round(v)}`}
          yMinFloor={0}
          highlightIndex={incomeHighlight}
          onPointClick={(p) => setIncomeAgeRange([p.ageStart, p.ageEnd])}
        />
      </StatsCard>

      <StatsCard
        title={`上位%で見る年収（${incomeAgeRange[0]}〜${incomeAgeRange[1]}歳）`}
        description="横軸の年収以上に該当する人が有業者全体の何%か。左上ほど上位、右下ほど下位。"
        source="就業構造基本調査 2022 + 国勢調査 2020"
      >
        <div className="mb-4">
          <RangeSlider
            label="年齢帯"
            min={INCOME_AGE_RANGE.min}
            max={INCOME_AGE_RANGE.max}
            step={1}
            value={incomeAgeRange}
            onChange={setIncomeAgeRange}
            unit="歳"
          />
        </div>
        <CDFChart
          points={incomeCDF}
          xTicks={[0, 500, 1000, 1500, 2000]}
          xAxisLabel="年収（万円）"
          formatThreshold={(x) => (x === 0 ? '年収問わず' : `${Math.round(x)}万円以上`)}
        />
      </StatsCard>

      <StatsCard
        title="年齢別 平均身長"
        description="性別×年齢階級別の平均身長。点をクリックするとその年代の上位%を表示。"
        source="国民健康・栄養調査 2023"
      >
        <LineChart
          points={heightData}
          yUnit="cm"
          formatValue={(v) => `${v.toFixed(1)}`}
          highlightIndex={heightHighlight}
          onPointClick={(p) => setHeightAgeRange([p.ageStart, p.ageEnd])}
        />
      </StatsCard>

      <StatsCard
        title={`上位%で見る身長（${heightAgeRange[0]}〜${heightAgeRange[1]}歳）`}
        description="横軸の身長以上に該当する人がその年齢帯の何%か。正規分布近似で算出。"
        source="国民健康・栄養調査 2023 + 国勢調査 2020"
      >
        <div className="mb-4">
          <RangeSlider
            label="年齢帯"
            min={HEIGHT_AGE_RANGE.min}
            max={HEIGHT_AGE_RANGE.max}
            step={1}
            value={heightAgeRange}
            onChange={setHeightAgeRange}
            unit="歳"
          />
        </div>
        <CDFChart
          points={heightCDF}
          xTicks={[140, 150, 160, 170, 180, 190, 200]}
          xAxisLabel="身長（cm）"
          formatThreshold={(x) => `${x.toFixed(1)}cm以上`}
        />
      </StatsCard>

      <StatsCard
        title="年齢別 喫煙率"
        description="習慣的に喫煙している人の割合。"
        source="国民健康・栄養調査 2023"
      >
        <LineChart
          points={smokingData}
          yUnit="%"
          formatValue={(v) => `${v.toFixed(1)}`}
          yMinFloor={0}
        />
      </StatsCard>
    </div>
  )
}

interface StatsCardProps {
  title: string
  description: string
  source: string
  children: React.ReactNode
}

function StatsCard({ title, description, source, children }: StatsCardProps) {
  return (
    <section className="bg-bg-surface rounded-2xl border border-border p-5">
      <div className="mb-4">
        <h2 className="text-base font-bold text-text-primary">{title}</h2>
        <p className="text-xs text-text-secondary mt-1">{description}</p>
      </div>
      {children}
      <p className="text-[10px] text-text-muted mt-3 text-right">出典: {source}</p>
    </section>
  )
}
