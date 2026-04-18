import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { CDFPoint } from '../../engine/statsByAge'
import { useContainerWidth } from '../../hooks/useContainerWidth'

interface CDFChartProps {
  points: CDFPoint[]
  xTicks: number[]
  xAxisLabel: string
  formatThreshold: (x: number) => string
  referencePercentiles?: number[]
}

const MALE_COLOR = '#06b6d4'
const FEMALE_COLOR = '#f43f5e'

const FS_TICK_PX = 12
const FS_TOOLTIP_PX = 13
const FS_AXIS_PX = 13

function formatPct(v: number): string {
  if (v <= 0) return '0'
  if (v < 0.1) return v.toFixed(2)
  if (v < 10) return v.toFixed(1)
  return v.toFixed(0)
}

export function CDFChart({
  points,
  xTicks,
  xAxisLabel,
  formatThreshold,
  referencePercentiles = [10, 25, 50],
}: CDFChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [wrapperRef, wrapperWidth] = useContainerWidth<HTMLDivElement>()

  const u = 720 / wrapperWidth

  const chart = useMemo(() => {
    const width = 720
    const height = 320
    const fsTick = FS_TICK_PX * u
    const fsTooltip = FS_TOOLTIP_PX * u
    const fsAxis = FS_AXIS_PX * u

    const padLeft = fsTick * 3.2 + 14
    const padRight = fsTick
    const padTop = fsAxis + 14
    const padBottom = fsTick + fsAxis + 20

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
      fsTick, fsTooltip, fsAxis,
      malePath: buildPath('male'),
      femalePath: buildPath('female'),
    }
  }, [points, u])

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
    <div ref={wrapperRef} className="w-full">
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
                strokeWidth={0.5 * u}
                opacity={0.6}
              />
              <text
                x={chart.padLeft - 6 * u}
                y={y}
                textAnchor="end"
                dominantBaseline="central"
                fontSize={chart.fsTick}
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
              strokeWidth={0.5 * u}
              strokeDasharray={`${2 * u} ${4 * u}`}
              opacity={0.35}
            />
          )
        })}

        <text x={4 * u} y={chart.fsAxis} fontSize={chart.fsAxis} fill="var(--color-text-muted)">
          上位%
        </text>

        {xTicks.map((t) => (
          <text
            key={`xt-${t}`}
            x={chart.xOf(t)}
            y={chart.height - chart.padBottom + chart.fsTick + 4 * u}
            textAnchor="middle"
            fontSize={chart.fsTick}
            fill="var(--color-text-muted)"
          >
            {t}
          </text>
        ))}
        <text
          x={(chart.padLeft + (chart.width - chart.padRight)) / 2}
          y={chart.height - 4 * u}
          textAnchor="middle"
          fontSize={chart.fsAxis}
          fill="var(--color-text-muted)"
        >
          {xAxisLabel}
        </text>

        <motion.path
          d={chart.malePath}
          fill="none"
          stroke={MALE_COLOR}
          strokeWidth={2 * u}
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
          strokeWidth={2 * u}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
        />

        {points.map((p, i) => {
          const cx = chart.xOf(p.x)
          const isHover = hoverIdx === i
          const r = (isHover ? 4 : 3) * u
          return (
            <g key={`pt-${i}`}>
              <circle cx={cx} cy={chart.yOf(p.male)} r={r} fill={MALE_COLOR} stroke="var(--color-bg-surface)" strokeWidth={1.5 * u} />
              <circle cx={cx} cy={chart.yOf(p.female)} r={r} fill={FEMALE_COLOR} stroke="var(--color-bg-surface)" strokeWidth={1.5 * u} />
              <rect
                x={cx - 22 * u}
                y={chart.padTop}
                width={44 * u}
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
          const rowH = chart.fsTooltip + 5 * u
          const boxW = 140 * u
          const boxH = chart.fsTooltip * 1.4 + 8 * u + 2 * rowH + 6 * u
          const flip = cx + boxW + 8 * u > chart.width - chart.padRight
          const bx = flip ? cx - boxW - 8 * u : cx + 8 * u
          const by = chart.padTop + 6 * u
          return (
            <g pointerEvents="none">
              <line x1={cx} x2={cx} y1={chart.padTop} y2={chart.height - chart.padBottom} stroke="var(--color-text-muted)" strokeDasharray={`${2 * u} ${3 * u}`} strokeWidth={0.5 * u} />
              <rect x={bx} y={by} width={boxW} height={boxH} rx={6 * u} fill="var(--color-bg-primary)" stroke="var(--color-border)" strokeWidth={1 * u} />
              <text x={bx + 8 * u} y={by + chart.fsTooltip + 4 * u} fontSize={chart.fsTooltip} fill="var(--color-text-secondary)" fontWeight={600}>
                {formatThreshold(p.x)}
              </text>
              <circle cx={bx + 12 * u} cy={by + chart.fsTooltip * 1.4 + 8 * u + rowH / 2} r={3 * u} fill={MALE_COLOR} />
              <text x={bx + 20 * u} y={by + chart.fsTooltip * 1.4 + 8 * u + rowH / 2} fontSize={chart.fsTooltip} fill="var(--color-text-primary)" dominantBaseline="central">
                男性 上位 {formatPct(p.male)}%
              </text>
              <circle cx={bx + 12 * u} cy={by + chart.fsTooltip * 1.4 + 8 * u + rowH * 1.5} r={3 * u} fill={FEMALE_COLOR} />
              <text x={bx + 20 * u} y={by + chart.fsTooltip * 1.4 + 8 * u + rowH * 1.5} fontSize={chart.fsTooltip} fill="var(--color-text-primary)" dominantBaseline="central">
                女性 上位 {formatPct(p.female)}%
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
