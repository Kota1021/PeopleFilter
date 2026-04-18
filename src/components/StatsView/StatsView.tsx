import { useMemo } from 'react'
import { LineChart } from './LineChart'
import {
  averageIncomeByAge,
  averageHeightByAge,
  smokingRateByAge,
} from '../../engine/statsByAge'

export function StatsView() {
  const incomeData = useMemo(() => averageIncomeByAge(), [])
  const heightData = useMemo(() => averageHeightByAge(), [])
  const smokingData = useMemo(() => smokingRateByAge(), [])

  return (
    <div className="flex flex-col gap-5">
      <StatsCard
        title="年齢別 平均年収"
        description="有業者の平均年収。配偶関係・学歴で加重平均したもの。"
        source="就業構造基本調査 2022 + 国勢調査 2020"
      >
        <LineChart
          points={incomeData}
          yUnit="万円"
          formatValue={(v) => `${Math.round(v)}`}
          yMinFloor={0}
        />
      </StatsCard>

      <StatsCard
        title="年齢別 平均身長"
        description="性別×年齢階級別の平均身長。"
        source="国民健康・栄養調査 2023"
      >
        <LineChart
          points={heightData}
          yUnit="cm"
          formatValue={(v) => `${v.toFixed(1)}`}
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
