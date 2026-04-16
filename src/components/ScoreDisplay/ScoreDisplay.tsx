import { motion } from 'motion/react'
import type { ScoreResult } from '../../engine/scorer'

interface ScoreDisplayProps {
  score: ScoreResult
}

const TIER_COLORS: Record<string, string> = {
  S: '#f59e0b', // amber
  A: '#10b981', // emerald
  B: '#06b6d4', // cyan
  C: '#94a3b8', // slate
  D: '#f97316', // orange
  E: '#ef4444', // red
}

const TIER_GLOW: Record<string, string> = {
  S: '0 0 20px rgba(245,158,11,0.5), 0 0 40px rgba(245,158,11,0.2)',
  A: '0 0 16px rgba(16,185,129,0.4)',
  B: '0 0 12px rgba(6,182,212,0.3)',
  C: 'none',
  D: 'none',
  E: 'none',
}

function PercentileBar({ percentile, color }: { percentile: number; color: string }) {
  return (
    <div className="w-full h-1.5 bg-bg-surface-hover rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.max(percentile, 2)}%` }}
        transition={{ type: 'spring', stiffness: 100, damping: 20, delay: 0.1 }}
      />
    </div>
  )
}

export function ScoreDisplay({ score }: ScoreDisplayProps) {
  const tierColor = TIER_COLORS[score.tier] ?? '#94a3b8'
  const tierGlow = TIER_GLOW[score.tier] ?? 'none'

  return (
    <motion.div
      className="mt-6 bg-bg-surface rounded-2xl border border-border p-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      <h2 className="text-sm font-bold text-text-secondary mb-4">
        配偶者魅力度スコア
        <span className="text-text-muted font-normal ml-2 text-xs">※ フィルター条件の中央値で算出</span>
      </h2>

      {/* Composite tier */}
      <div className="flex items-center gap-4 mb-5">
        <motion.div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black"
          style={{
            backgroundColor: `${tierColor}20`,
            color: tierColor,
            border: `2px solid ${tierColor}`,
            boxShadow: tierGlow,
          }}
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.4 }}
        >
          {score.tier}
        </motion.div>
        <div>
          <div className="text-lg font-bold" style={{ color: tierColor }}>
            {score.tierLabel}
          </div>
          <div className="text-xs text-text-muted tabular-nums">
            総合スコア: 上位 {Math.round(100 - score.compositePercentile)}%
          </div>
        </div>
      </div>

      {/* Per-criterion breakdown */}
      <div className="space-y-3">
        {score.criteria.map((c) => {
          const color = TIER_COLORS[c.tier] ?? '#94a3b8'
          return (
            <div key={c.id}>
              <div className="flex justify-between items-baseline mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold w-5 text-center" style={{ color }}>
                    {c.tier}
                  </span>
                  <span className="text-xs text-text-secondary">{c.label}</span>
                  <span className="text-xs text-text-muted">{c.value}</span>
                </div>
                <span className="text-xs tabular-nums text-text-muted">
                  上位 {Math.round(100 - c.percentile)}%
                </span>
              </div>
              <PercentileBar percentile={c.percentile} color={color} />
            </div>
          )
        })}
      </div>

      <p className="text-[10px] text-text-muted mt-4 leading-relaxed">
        ※ このスコアは統計データに基づく相対的な位置づけを示すもので、
        個人の価値を評価するものではありません。年齢は若い方が有利、
        学歴は高い方が有利、身長は高い方が有利、体重はBMI普通体重が最も有利として算出しています。
      </p>
    </motion.div>
  )
}
