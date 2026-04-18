import { useMemo, useState } from 'react'
import { motion } from 'motion/react'
import type { AgePoint } from '../../engine/statsByAge'
import { useContainerWidth } from '../../hooks/useContainerWidth'

interface LineChartProps {
  points: AgePoint[]
  yUnit: string
  formatValue?: (v: number) => string
  yMinFloor?: number
  onPointClick?: (point: AgePoint) => void
  highlightIndex?: number | null
}

const MALE_COLOR = '#06b6d4'
const FEMALE_COLOR = '#f43f5e'

// Target CSS pixel sizes — what the user actually sees on any device.
const FS_TICK_PX = 12    // matches text-xs
const FS_TOOLTIP_PX = 13
const FS_AXIS_PX = 13

function niceStep(roughStep: number): number {
  if (roughStep <= 0) return 1
  const exp = Math.floor(Math.log10(roughStep))
  const frac = roughStep / Math.pow(10, exp)
  const niceFrac = frac < 1.5 ? 1 : frac < 3 ? 2 : frac < 7 ? 5 : 10
  return niceFrac * Math.pow(10, exp)
}

function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min]
  const step = niceStep((max - min) / count)
  const niceMin = Math.floor(min / step) * step
  const niceMax = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let v = niceMin; v <= niceMax + step * 0.5; v += step) {
    ticks.push(Number((Math.round(v / step) * step).toFixed(10)))
  }
  return ticks
}

export function LineChart({ points, yUnit, formatValue, yMinFloor, onPointClick, highlightIndex }: LineChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const [wrapperRef, wrapperWidth] = useContainerWidth<HTMLDivElement>()

  // 1 CSS pixel = `u` SVG user units. viewBox width / rendered width.
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

    const xMin = Math.min(...points.map(p => p.ageStart))
    const xMax = Math.max(...points.map(p => p.ageEnd))

    const allValues = points.flatMap(p => [p.male, p.female]).filter((v): v is number => v != null)
    const dataMin = Math.min(...allValues)
    const dataMax = Math.max(...allValues)
    const rangePad = (dataMax - dataMin) * 0.1 || dataMax * 0.1
    const yLo = yMinFloor != null ? Math.min(yMinFloor, dataMin - rangePad) : dataMin - rangePad
    const ticks = niceTicks(yLo, dataMax + rangePad, 5)
    const yMin = ticks[0]
    const yMax = ticks[ticks.length - 1]

    const xOf = (age: number) => padLeft + ((age - xMin) / (xMax - xMin)) * innerW
    const yOf = (v: number) => padTop + innerH - ((v - yMin) / (yMax - yMin)) * innerH
    const xCenter = (p: AgePoint) => xOf((p.ageStart + p.ageEnd) / 2)

    const buildPath = (series: 'male' | 'female') => {
      const coords = points
        .map((p) => ({ x: xCenter(p), y: p[series] != null ? yOf(p[series] as number) : null }))
        .filter((c): c is { x: number; y: number } => c.y != null)
      if (coords.length === 0) return ''
      return coords
        .map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(2)} ${c.y.toFixed(2)}`)
        .join(' ')
    }

    return {
      width, height, padLeft, padRight, padTop, padBottom, innerW, innerH,
      xOf, yOf, xCenter, ticks, yMin, yMax,
      fsTick, fsTooltip, fsAxis,
      malePath: buildPath('male'),
      femalePath: buildPath('female'),
    }
  }, [points, yMinFloor, u])

  const fmt = formatValue ?? ((v: number) => `${v.toFixed(1)}`)

  return (
    <div ref={wrapperRef} className="w-full">
      {/* Legend */}
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
        {/* Horizontal grid + Y-axis labels */}
        {chart.ticks.map((t) => {
          const y = chart.yOf(t)
          return (
            <g key={`tick-${t}`}>
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
                {fmt(t)}
              </text>
            </g>
          )
        })}

        {/* Y axis unit label */}
        <text
          x={4 * u}
          y={chart.fsAxis}
          fontSize={chart.fsAxis}
          fill="var(--color-text-muted)"
        >
          {yUnit}
        </text>

        {/* X axis labels */}
        {points.map((p, i) => {
          const x = chart.xCenter(p)
          return (
            <text
              key={`xlbl-${i}`}
              x={x}
              y={chart.height - chart.padBottom + chart.fsTick + 4 * u}
              textAnchor="middle"
              fontSize={chart.fsTick}
              fill="var(--color-text-muted)"
            >
              {p.ageLabel}
            </text>
          )
        })}
        <text
          x={(chart.padLeft + (chart.width - chart.padRight)) / 2}
          y={chart.height - 4 * u}
          textAnchor="middle"
          fontSize={chart.fsAxis}
          fill="var(--color-text-muted)"
        >
          年齢
        </text>

        {/* Lines */}
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

        {/* Points + hover targets */}
        {points.map((p, i) => {
          const cx = chart.xCenter(p)
          const isHover = hoverIdx === i
          const r = (isHover ? 4 : 3) * u
          return (
            <g key={`pt-${i}`}>
              {p.male != null && (
                <circle
                  cx={cx}
                  cy={chart.yOf(p.male)}
                  r={r}
                  fill={MALE_COLOR}
                  stroke="var(--color-bg-surface)"
                  strokeWidth={1.5 * u}
                />
              )}
              {p.female != null && (
                <circle
                  cx={cx}
                  cy={chart.yOf(p.female)}
                  r={r}
                  fill={FEMALE_COLOR}
                  stroke="var(--color-bg-surface)"
                  strokeWidth={1.5 * u}
                />
              )}
              {/* Highlight band */}
              {highlightIndex === i && (
                <rect
                  x={cx - 16 * u}
                  y={chart.padTop}
                  width={32 * u}
                  height={chart.innerH}
                  fill="var(--color-funnel-end)"
                  opacity={0.08}
                  rx={4 * u}
                />
              )}
              {/* Wide invisible hover target */}
              <rect
                x={cx - 20 * u}
                y={chart.padTop}
                width={40 * u}
                height={chart.innerH}
                fill="transparent"
                style={onPointClick ? { cursor: 'pointer' } : undefined}
                onMouseEnter={() => setHoverIdx(i)}
                onClick={onPointClick ? () => onPointClick(p) : undefined}
              />
            </g>
          )
        })}

        {/* Tooltip */}
        {hoverIdx != null && (() => {
          const p = points[hoverIdx]
          const cx = chart.xCenter(p)
          const lines: Array<{ label: string; val: string; color: string }> = []
          if (p.male != null) lines.push({ label: '男性', val: fmt(p.male), color: MALE_COLOR })
          if (p.female != null) lines.push({ label: '女性', val: fmt(p.female), color: FEMALE_COLOR })
          const rowH = chart.fsTooltip + 5 * u
          const boxW = 90 * u
          const boxH = chart.fsTooltip * 1.4 + 8 * u + lines.length * rowH + 6 * u
          const flip = cx + boxW + 8 * u > chart.width - chart.padRight
          const bx = flip ? cx - boxW - 8 * u : cx + 8 * u
          const by = chart.padTop + 6 * u
          return (
            <g pointerEvents="none">
              <line x1={cx} x2={cx} y1={chart.padTop} y2={chart.height - chart.padBottom} stroke="var(--color-text-muted)" strokeDasharray={`${2 * u} ${3 * u}`} strokeWidth={0.5 * u} />
              <rect x={bx} y={by} width={boxW} height={boxH} rx={6 * u} fill="var(--color-bg-primary)" stroke="var(--color-border)" strokeWidth={1 * u} />
              <text x={bx + 8 * u} y={by + chart.fsTooltip + 4 * u} fontSize={chart.fsTooltip} fill="var(--color-text-secondary)" fontWeight={600}>
                {p.ageLabel}歳
              </text>
              {lines.map((ln, i) => {
                const cy = by + chart.fsTooltip * 1.4 + 8 * u + i * rowH + rowH / 2
                return (
                  <g key={ln.label}>
                    <circle cx={bx + 12 * u} cy={cy} r={3 * u} fill={ln.color} />
                    <text x={bx + 20 * u} y={cy} fontSize={chart.fsTooltip} fill="var(--color-text-primary)" dominantBaseline="central">
                      {ln.label} {ln.val}
                    </text>
                  </g>
                )
              })}
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
