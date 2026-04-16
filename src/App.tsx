import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Header } from './components/Layout/Header'
import { Footer } from './components/Layout/Footer'
import { FilterPanel } from './components/FilterPanel/FilterPanel'
import { FunnelChart } from './components/FunnelChart/FunnelChart'
import { ResultDisplay } from './components/ResultDisplay/ResultDisplay'
import { ScoreDisplay } from './components/ScoreDisplay/ScoreDisplay'
import { SelfInput } from './components/SelfAssessment/SelfInput'
import { useCalculation } from './hooks/useCalculation'
import { useFilterStore } from './store/filterStore'
import { useSelfStore } from './store/selfStore'
import { calculateScore, calculateSelfScore } from './engine/scorer'

type Tab = 'search' | 'self'

function App() {
  const [tab, setTab] = useState<Tab>('search')
  const { stages, finalStage } = useCalculation()
  const filters = useFilterStore()
  const selfState = useSelfStore()

  const partnerScore = useMemo(() => calculateScore(filters), [filters])

  const selfScore = useMemo(() => calculateSelfScore(selfState), [selfState])

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-6xl mx-auto">
        <Header />

        {/* Tab switcher */}
        <div className="px-4 mb-6">
          <div className="flex gap-1 bg-bg-surface rounded-xl p-1 max-w-md mx-auto border border-border">
            <button
              onClick={() => setTab('search')}
              className={clsx(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                tab === 'search'
                  ? 'bg-accent-male/15 text-accent-male shadow-sm'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              相手を探す
            </button>
            <button
              onClick={() => setTab('self')}
              className={clsx(
                'flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                tab === 'self'
                  ? 'bg-accent-female/15 text-accent-female shadow-sm'
                  : 'text-text-muted hover:text-text-secondary',
              )}
            >
              自分を測る
            </button>
          </div>
        </div>

        <div className="px-4 pb-8">
          {tab === 'search' ? (
            /* ===== Search mode ===== */
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-[380px] shrink-0">
                <div className="lg:sticky lg:top-4 bg-bg-surface rounded-2xl border border-border p-5">
                  <h2 className="text-sm font-bold text-text-secondary mb-4">理想の条件</h2>
                  <FilterPanel />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="bg-bg-surface rounded-2xl border border-border p-5">
                  <h2 className="text-sm font-bold text-text-secondary mb-4">絞り込み結果</h2>
                  <FunnelChart stages={stages} />
                  {finalStage && (
                    <ResultDisplay
                      stage={finalStage}
                      baseCount={stages[0]?.count ?? 1}
                    />
                  )}
                </div>

                {partnerScore && <ScoreDisplay score={partnerScore} title="求める相手のレア度" />}
              </div>
            </div>
          ) : (
            /* ===== Self-assessment mode ===== */
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-[380px] shrink-0">
                <div className="lg:sticky lg:top-4 bg-bg-surface rounded-2xl border border-border p-5">
                  <h2 className="text-sm font-bold text-text-secondary mb-4">あなたのプロフィール</h2>
                  <SelfInput />
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <ScoreDisplay score={selfScore} title="あなたのレア度" />
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default App
