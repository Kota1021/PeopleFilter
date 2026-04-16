import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'motion/react'
import type { FunnelStage } from '../../engine/types'
import { formatPopulation, formatPercentage } from '../../utils/format'

interface ResultDisplayProps {
  stage: FunnelStage
  baseCount: number
  baseLabel: string
}

function AnimatedNumber({ value }: { value: number }) {
  const motionValue = useMotionValue(0)
  const rounded = useTransform(motionValue, (v) => formatPopulation(Math.round(v)))
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration: 0.8,
      ease: [0.32, 0.72, 0, 1],
    })
    return controls.stop
  }, [value, motionValue])

  useEffect(() => {
    const unsubscribe = rounded.on('change', (v) => {
      if (ref.current) ref.current.textContent = v
    })
    return unsubscribe
  }, [rounded])

  return <span ref={ref}>{formatPopulation(value)}</span>
}

function getRarityLevel(percentage: number): { label: string; glowClass: string } | null {
  if (percentage < 0.0001) {
    return { label: '超激レア', glowClass: 'text-red-400 animate-pulse' }
  }
  if (percentage < 0.001) {
    return { label: '激レア', glowClass: 'text-amber-400' }
  }
  if (percentage < 0.01) {
    return { label: 'レア', glowClass: 'text-yellow-300' }
  }
  return null
}

export function ResultDisplay({ stage, baseCount, baseLabel }: ResultDisplayProps) {
  const percentage = baseCount > 0 ? stage.count / baseCount : 0
  const rarity = getRarityLevel(percentage)

  return (
    <motion.div
      className="text-center py-8 space-y-3"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2 }}
    >
      <p className="text-text-secondary text-sm">あなたの理想の相手は…</p>

      <div className="relative">
        <motion.div
          className="text-5xl md:text-6xl font-black tabular-nums"
          style={{
            textShadow: percentage < 0.01
              ? '0 0 20px rgba(6, 182, 212, 0.5), 0 0 40px rgba(6, 182, 212, 0.2)'
              : 'none',
          }}
        >
          <AnimatedNumber value={stage.count} />
        </motion.div>

        {rarity && (
          <motion.span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold ${rarity.glowClass}`}
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}
          >
            {rarity.label}
          </motion.span>
        )}
      </div>

      <p className="text-text-muted text-lg tabular-nums">
        {baseLabel}の <span className="text-text-primary font-bold">{formatPercentage(percentage)}</span>
      </p>
    </motion.div>
  )
}
