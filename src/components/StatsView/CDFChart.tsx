import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { CDFPoint } from '../../engine/statsByAge'

interface CDFChartProps {
  points: CDFPoint[]
  xTicks: number[]
  xAxisLabel: string
  formatThreshold: (x: number) => string
  referencePercentiles?: number[]
}

const MALE_COLOR = '#06b6d4'
const FEMALE_COLOR = '#f43f5e'

export function CDFChart({
  points,
  xTicks,
  xAxisLabel,
  formatThreshold,
  referencePercentiles = [10, 25, 50],
}: CDFChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const chart = useMemo(() => {
    const width = 720
    const height = 320
    const padLeft = 58
    const padRight = 16
    const padTop = 24
    const padBottom = 52

    const innerW = width - padLeft - padRight
    const innerH = height - padTop - padBottom

    const xMin = Math.min(...points.map(p => p.x))
    const xMax = Math.max(...points.map(p => p.x))
    const yMin = 0
    const yMax = 100

    const xOf = (v: number) => padLeft + ((v - xMin) / (xMax - xMin)) * innerW
    const yOf = (v: number) => padTop + innerH - ((v - yMin) / (yMax - yMin)) * innerH

    const buildPath = (series: 'male' | 'female') =>
      points
        .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xOf(p.x).toFixed(2)} ${yOf(p[series]).toFixed(2)}`)
        .join(' ')

    const yTicks = [0, 25, 50, 75, 100]

    return {
      width, height, padLeft, padRight, padTop, padBottom, innerW, innerH,
      xOf, yOf, yTicks,
      malePath: buildPath('male'),
      femalePath: buildPath('female'),
    }
  }, [points])

  const crossings = useMemo(() => {
    const result: Record<number, { male: number | null; female: number | null }> = {}
    for (const pct of referencePercentiles) {
      result[pct] = {
        male: interpolateXAt(points, pct, 'male'),
        female: interpolateXAt(points, pct, 'female'),
      }
    }
    return result
  }, [points, referencePercentiles])

  return (
    <div className="w-full">
      <div className="flex gap-4 text-sm text-text-secondary mb-2 justify-end pr-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-0.5 rounded-full" style={{ backgroundColor: MALE_COLOR }} />
          男性
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-0.5 rounded-full" style={{ backgroundColor: FEMALE_COLOR }} />
          女性
        </div>
      </div>

      <svg
        viewBox={`0 0 ${chart.width} ${chart.height}`}
        className="w-full h-auto"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {chart.yTicks.map((t) => {
          const y = chart.yOf(t)
          return (
            <g key={`yt-${t}`}>
              <line
                x1={chart.padLeft}
                x2={chart.width - chart.padRight}
                y1={y}
                y2={y}
                stroke="var(--color-border)"
                strokeWidth={0.5}
                opacity={0.6}
              />
              <text
                x={chart.padLeft - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={14}
                fill="var(--color-text-muted)"
              >
                {t}%
              </text>
            </g>
          )
        })}

        {referencePercentiles.map((pct) => {
          const y = chart.yOf(pct)
          return (
            <line
              key={`ref-${pct}`}
              x1={chart.padLeft}
              x2={chart.width - chart.padRight}
              y1={y}
              y2={y}
              stroke="var(--color-funnel-end)"
              strokeWidth={0.5}
              strokeDasharray="2 4"
              opacity={0.35}
            />
          )
        })}

        <text x={chart.padLeft - 48} y={chart.padTop - 6} fontSize={14} fill="var(--color-text-muted)">
          上位%
        </text>

        {xTicks.map((t) => (
          <text
            key={`xt-${t}`}
            x={chart.xOf(t)}
            y={chart.height - chart.padBottom + 18}
            textAnchor="middle"
            fontSize={14}
            fill="var(--color-text-muted)"
          >
            {t}
          </text>
        ))}
        <text
          x={(chart.padLeft + (chart.width - chart.padRight)) / 2}
          y={chart.height - 6}
          textAnchor="middle"
          fontSize={14}
          fill="var(--color-text-muted)"
        >
          {xAxisLabel}
        </text>

        <motion.path
          d={chart.malePath}
          fill="none"
          stroke={MALE_COLOR}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
        <motion.path
          d={chart.femalePath}
          fill="none"
          stroke={FEMALE_COLOR}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />

        {points.map((p, i) => {
          const cx = chart.xOf(p.x)
          const isHover = hoverIdx === i
          return (
            <g key={`pt-${i}`}>
              <circle cx={cx} cy={chart.yOf(p.male)} r={isHover ? 4 : 3} fill={MALE_COLOR} stroke="var(--color-bg-surface)" strokeWidth={1.5} />
              <circle cx={cx} cy={chart.yOf(p.female)} r={isHover ? 4 : 3} fill={FEMALE_COLOR} stroke="var(--color-bg-surface)" strokeWidth={1.5} />
              <rect
                x={cx - 18}
                y={chart.padTop}
                width={36}
                height={chart.innerH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
              />
            </g>
          )
        })}

        {hoverIdx != null && (() => {
          const p = points[hoverIdx]
          const cx = chart.xOf(p.x)
          const boxW = 170
          const boxH = 76
          const flip = cx + boxW + 8 > chart.width - chart.padRight
          const bx = flip ? cx - boxW - 8 : cx + 8
          const by = chart.padTop + 8
          return (
            <g pointerEvents="none">
              <line x1={cx} x2={cx} y1={chart.padTop} y2={chart.height - chart.padBottom} stroke="var(--color-text-muted)" strokeDasharray="2 3" strokeWidth={0.5} />
              <rect x={bx} y={by} width={boxW} height={boxH} rx={6} fill="var(--color-bg-primary)" stroke="var(--color-border)" />
              <text x={bx + 10} y={by + 18} fontSize={13} fill="var(--color-text-secondary)" fontWeight={600}>
                {formatThreshold(p.x)}
              </text>
              <circle cx={bx + 14} cy={by + 40} r={3.5} fill={MALE_COLOR} />
              <text x={bx + 22} y={by + 40} fontSize={13} fill="var(--color-text-primary)" dominantBaseline="central">
                男性 上位 {p.male.toFixed(1)}%
              </text>
              <circle cx={bx + 14} cy={by + 60} r={3.5} fill={FEMALE_COLOR} />
              <text x={bx + 22} y={by + 60} fontSize={13} fill="var(--color-text-primary)" dominantBaseline="central">
                女性 上位 {p.female.toFixed(1)}%
              </text>
            </g>
          )
        })()}
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        {referencePercentiles.map((pct) => (
          <div key={pct} className="rounded-md border border-border bg-bg-surface-hover/20 px-2.5 py-1.5">
            <div className="text-text-muted mb-0.5">上位 {pct}%</div>
            <div className="flex flex-col gap-0.5">
              <div className="tabular-nums" style={{ color: MALE_COLOR }}>
                男性: {formatCrossing(crossings[pct].male, formatThreshold)}
              </div>
              <div className="tabular-nums" style={{ color: FEMALE_COLOR }}>
                女性: {formatCrossing(crossings[pct].female, formatThreshold)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function interpolateXAt(points: CDFPoint[], targetPct: number, series: 'male' | 'female'): number | null {
  for (let i = 0; i < points.length - 1; i++) {
    const y0 = points[i][series]
    const y1 = points[i + 1][series]
    if (y0 >= targetPct && y1 <= targetPct) {
      const x0 = points[i].x
      const x1 = points[i + 1].x
      if (y0 === y1) return x0
      const t = (y0 - targetPct) / (y0 - y1)
      return x0 + (x1 - x0) * t
    }
  }
  return null
}

function formatCrossing(v: number | null, fmt: (x: number) => string): string {
  if (v == null) return '—'
  return fmt(v)
}
