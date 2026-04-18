import { motion } from 'motion/react'
import type { IncomeBandPoint } from '../../engine/statsByAge'

interface IncomeHistogramProps {
  bands: IncomeBandPoint[]
}

const MALE_COLOR = '#06b6d4'
const FEMALE_COLOR = '#f43f5e'

export function IncomeHistogram({ bands }: IncomeHistogramProps) {
  const maxRatio = Math.max(
    ...bands.flatMap((b) => [b.male, b.female]),
    0.001,
  )

  const niceMax = niceCeiling(maxRatio)

  return (
    <div className="w-full">
      <div className="flex gap-4 text-xs text-text-secondary mb-2 justify-end pr-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: MALE_COLOR }} />
          男性
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: FEMALE_COLOR }} />
          女性
        </div>
      </div>

      <div className="grid grid-cols-[96px_1fr] gap-x-2 gap-y-2 items-center">
        {[...bands].reverse().map((b, i) => (
          <Row key={b.band} band={b} niceMax={niceMax} index={i} />
        ))}
        {/* Axis */}
        <div />
        <div className="relative h-5 text-[10px] text-text-muted mt-1 pr-12">
          <AxisTicks niceMax={niceMax} />
        </div>
      </div>

      <p className="text-[11px] text-text-muted mt-4 leading-relaxed">
        ※ 各%は「選択年齢帯の<strong className="text-text-secondary font-medium">男女それぞれの有業者</strong>のうち、その年収帯に属する人の割合」。男女別で合計100%。
      </p>
    </div>
  )
}

function Row({ band, niceMax, index }: { band: IncomeBandPoint; niceMax: number; index: number }) {
  const maleW = Math.min((band.male / niceMax) * 100, 100)
  const femaleW = Math.min((band.female / niceMax) * 100, 100)
  return (
    <>
      <div className="text-xs text-text-secondary text-right tabular-nums pr-1">
        {band.label}
        <span className="text-text-muted ml-1">万</span>
      </div>
      <div className="relative h-6 bg-bg-surface-hover/30 rounded pr-12">
        {/* Male bar */}
        <motion.div
          className="absolute left-0 top-0 h-[11px] rounded-r"
          style={{ backgroundColor: MALE_COLOR }}
          initial={{ width: 0 }}
          animate={{ width: `${maleW}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, delay: index * 0.02 }}
        />
        <motion.span
          className="absolute top-0 text-[11px] font-semibold tabular-nums leading-[11px] pl-1.5 pointer-events-none whitespace-nowrap"
          style={{ color: MALE_COLOR }}
          initial={{ left: 0, opacity: 0 }}
          animate={{ left: `${maleW}%`, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, delay: index * 0.02 + 0.15 }}
        >
          {formatPct(band.male)}
        </motion.span>

        {/* Female bar */}
        <motion.div
          className="absolute left-0 bottom-0 h-[11px] rounded-r"
          style={{ backgroundColor: FEMALE_COLOR }}
          initial={{ width: 0 }}
          animate={{ width: `${femaleW}%` }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, delay: index * 0.02 + 0.04 }}
        />
        <motion.span
          className="absolute bottom-0 text-[11px] font-semibold tabular-nums leading-[11px] pl-1.5 pointer-events-none whitespace-nowrap"
          style={{ color: FEMALE_COLOR }}
          initial={{ left: 0, opacity: 0 }}
          animate={{ left: `${femaleW}%`, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 22, delay: index * 0.02 + 0.19 }}
        >
          {formatPct(band.female)}
        </motion.span>
      </div>
    </>
  )
}

function AxisTicks({ niceMax }: { niceMax: number }) {
  const ticks = [0, niceMax * 0.25, niceMax * 0.5, niceMax * 0.75, niceMax]
  return (
    <>
      {ticks.map((t, i) => (
        <span
          key={i}
          className="absolute tabular-nums"
          style={{
            left: `${(t / niceMax) * 100}%`,
            transform: i === 0 ? 'translateX(0)' : i === ticks.length - 1 ? 'translateX(-100%)' : 'translateX(-50%)',
          }}
        >
          {(t * 100).toFixed(t < 0.1 ? 1 : 0)}%
        </span>
      ))}
    </>
  )
}

function formatPct(ratio: number): string {
  const pct = ratio * 100
  if (pct < 0.05) return '0'
  if (pct < 1) return pct.toFixed(1)
  if (pct < 10) return pct.toFixed(1)
  return pct.toFixed(0)
}

function niceCeiling(v: number): number {
  if (v <= 0) return 0.01
  const exp = Math.floor(Math.log10(v))
  const frac = v / Math.pow(10, exp)
  const niceFrac = frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 5 ? 5 : 10
  return niceFrac * Math.pow(10, exp)
}
