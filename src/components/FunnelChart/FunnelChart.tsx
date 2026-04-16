import { motion, AnimatePresence } from 'motion/react'
import type { FunnelStage } from '../../engine/types'
import { formatPopulation, formatPercentage } from '../../utils/format'

interface FunnelChartProps {
  stages: FunnelStage[]
}

function getBarColor(index: number, total: number): string {
  // Gradient from teal to indigo
  const colors = [
    '#06b6d4', // cyan-500
    '#0891b2', // cyan-600
    '#0e7490', // cyan-700
    '#0369a1', // sky-700
    '#1d4ed8', // blue-700
    '#4338ca', // indigo-700
    '#6366f1', // indigo-500
    '#7c3aed', // violet-600
    '#9333ea', // purple-600
  ]
  const colorIndex = Math.min(Math.floor((index / Math.max(total - 1, 1)) * (colors.length - 1)), colors.length - 1)
  return colors[colorIndex]
}

export function FunnelChart({ stages }: FunnelChartProps) {
  if (stages.length === 0) return null

  const baseCount = stages[0].count

  return (
    <div className="space-y-0">
      <AnimatePresence mode="popLayout">
        {stages.map((stage, index) => {
          const widthPercent = baseCount > 0
            ? Math.max((stage.count / baseCount) * 100, 2) // min 2% width for visibility
            : 100

          return (
            <motion.div
              key={stage.id}
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 150, damping: 25 }}
              className="flex flex-col items-center py-1"
            >
              {/* Connector trapezoid */}
              {index > 0 && (
                <svg
                  viewBox="0 0 200 12"
                  className="w-full h-3 -mb-0.5"
                  preserveAspectRatio="none"
                >
                  <motion.path
                    d={(() => {
                      const prevWidth = baseCount > 0
                        ? Math.max((stages[index - 1].count / baseCount) * 100, 2)
                        : 100
                      const prevLeft = (100 - prevWidth) / 2
                      const currLeft = (100 - widthPercent) / 2
                      return `M ${prevLeft} 0 L ${currLeft} 12 L ${currLeft + widthPercent} 12 L ${prevLeft + prevWidth} 0 Z`
                    })()}
                    fill={getBarColor(index, stages.length)}
                    opacity={0.3}
                    initial={false}
                    animate={{
                      d: (() => {
                        const prevWidth = baseCount > 0
                          ? Math.max((stages[index - 1].count / baseCount) * 100, 2)
                          : 100
                        const prevLeft = (100 - prevWidth) / 2
                        const currLeft = (100 - widthPercent) / 2
                        return `M ${prevLeft} 0 L ${currLeft} 12 L ${currLeft + widthPercent} 12 L ${prevLeft + prevWidth} 0 Z`
                      })(),
                    }}
                    transition={{ type: 'spring', stiffness: 150, damping: 25 }}
                  />
                </svg>
              )}

              {/* Bar */}
              <motion.div
                className="relative rounded-lg overflow-hidden"
                style={{ backgroundColor: getBarColor(index, stages.length) }}
                initial={false}
                animate={{ width: `${widthPercent}%` }}
                transition={{ type: 'spring', stiffness: 150, damping: 25 }}
              >
                <div className="px-3 py-2.5 flex justify-between items-center min-w-0">
                  <span className="text-xs text-white/80 truncate mr-2">
                    {stage.label}
                  </span>
                  <span className="text-xs font-bold text-white tabular-nums whitespace-nowrap">
                    {formatPopulation(stage.count)}
                  </span>
                </div>
              </motion.div>

              {/* Percentage label */}
              {index > 0 && (
                <motion.span
                  className="text-[10px] text-text-muted mt-0.5 tabular-nums"
                  initial={false}
                  animate={{ opacity: 1 }}
                >
                  {formatPercentage(stage.percentage)}
                </motion.span>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
