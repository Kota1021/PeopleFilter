import { Header } from './components/Layout/Header'
import { Footer } from './components/Layout/Footer'
import { FilterPanel } from './components/FilterPanel/FilterPanel'
import { FunnelChart } from './components/FunnelChart/FunnelChart'
import { ResultDisplay } from './components/ResultDisplay/ResultDisplay'
import { useCalculation } from './hooks/useCalculation'

function App() {
  const { stages, finalStage } = useCalculation()

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="max-w-6xl mx-auto">
        <Header />

        <div className="px-4 pb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filter Panel */}
            <div className="w-full lg:w-[380px] shrink-0">
              <div className="lg:sticky lg:top-4 bg-bg-surface rounded-2xl border border-border p-5">
                <h2 className="text-sm font-bold text-text-secondary mb-4">理想の条件</h2>
                <FilterPanel />
              </div>
            </div>

            {/* Funnel + Result */}
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
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </div>
  )
}

export default App
