import { motion, AnimatePresence } from 'motion/react'
import type { FunnelStage } from '../../engine/types'
import { formatPopulation, formatPercentage } from '../../utils/format'

interface FunnelChartProps {
  stages: FunnelStage[]
}

function getBarColor(index: number, total: number): string {
  const colors = [
    '#06b6d4', '#0891b2', '#0e7490', '#0369a1',
    '#1d4ed8', '#4338ca', '#6366f1', '#7c3aed', '#9333ea',
  ]
  const colorIndex = Math.min(Math.floor((index / Math.max(total - 1, 1)) * (colors.length - 1)), colors.length - 1)
  return colors[colorIndex]
}

export function FunnelChart({ stages }: FunnelChartProps) {
  if (stages.length === 0) return null

  const baseCount = stages[0].count

  return (
    <div>
      <AnimatePresence mode="popLayout">
        {stages.map((stage, index) => {
          const widthPercent = baseCount > 0
            ? Math.max((stage.count / baseCount) * 100, 2)
            : 100
          const barColor = getBarColor(index, stages.length)

          return (
            <motion.div
              key={stage.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 150, damping: 25 }}
              className="flex flex-col items-center py-0.5"
            >
              {/* Label row — always full width, never clipped */}
              <div className="w-full flex justify-between items-baseline px-1 mb-0.5">
                <span className="text-xs text-text-secondary truncate mr-2">
                  {stage.label}
                </span>
                <span className="text-xs font-bold tabular-nums whitespace-nowrap" style={{ color: barColor }}>
                  {formatPopulation(stage.count)}
                  {index > 0 && (
                    <span className="text-text-muted font-normal ml-1.5">
                      {formatPercentage(stage.percentage)}
                    </span>
                  )}
                </span>
              </div>

              {/* Connector trapezoid */}
              {index > 0 && (
                <svg
                  viewBox="0 0 100 8"
                  className="w-full h-2 -mb-px"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    fill={barColor}
                    opacity={0.25}
                    initial={false}
                    animate={{
                      d: (() => {
                        const prevWidth = baseCount > 0
                          ? Math.max((stages[index - 1].count / baseCount) * 100, 2)
                          : 100
                        const prevLeft = (100 - prevWidth) / 2
                        const currLeft = (100 - widthPercent) / 2
                        return `M ${prevLeft} 0 L ${currLeft} 8 L ${currLeft + widthPercent} 8 L ${prevLeft + prevWidth} 0 Z`
                      })(),
                    }}
                    transition={{ type: 'spring', stiffness: 150, damping: 25 }}
                  />
                </svg>
              )}

              {/* Bar — visual only, no text inside */}
              <motion.div
                className="rounded-md h-5"
                style={{ backgroundColor: barColor }}
                initial={false}
                animate={{ width: `${widthPercent}%` }}
                transition={{ type: 'spring', stiffness: 150, damping: 25 }}
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
