import { useState, useMemo } from 'react'
import clsx from 'clsx'
import prefectureData from '../../data/prefecture.json'

interface PrefectureSelectorProps {
  selected: string[]
  onToggle: (code: string) => void
}

const regions: Record<string, string[]> = {
  '北海道・東北': ['01', '02', '03', '04', '05', '06', '07'],
  '関東': ['08', '09', '10', '11', '12', '13', '14'],
  '中部': ['15', '16', '17', '18', '19', '20', '21', '22', '23'],
  '近畿': ['24', '25', '26', '27', '28', '29', '30'],
  '中国・四国': ['31', '32', '33', '34', '35', '36', '37', '38', '39'],
  '九州・沖縄': ['40', '41', '42', '43', '44', '45', '46', '47'],
}

const prefectures = prefectureData.prefectures as Record<string, { name: string; ratio: number }>

export function PrefectureSelector({ selected, onToggle }: PrefectureSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)

  const selectedNames = useMemo(
    () => selected.map((code) => prefectures[code]?.name ?? code),
    [selected],
  )

  return (
    <div className="space-y-2">
      <span className="text-sm text-text-secondary">居住地</span>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-lg bg-bg-surface border border-border text-left text-sm hover:border-text-muted transition-colors"
      >
        {selected.length === 0 ? (
          <span className="text-text-muted">全国（指定なし）</span>
        ) : (
          <span className="text-text-primary">
            {selectedNames.length <= 3
              ? selectedNames.join('、')
              : `${selectedNames.slice(0, 2).join('、')} 他${selectedNames.length - 2}件`}
          </span>
        )}
        <span className="float-right text-text-muted">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="bg-bg-surface border border-border rounded-lg p-3 max-h-64 overflow-y-auto space-y-3">
          {Object.entries(regions).map(([regionName, codes]) => (
            <div key={regionName}>
              <div className="text-xs text-text-muted mb-1.5 font-medium">{regionName}</div>
              <div className="flex flex-wrap gap-1.5">
                {codes.map((code) => {
                  const isActive = selected.includes(code)
                  return (
                    <button
                      key={code}
                      onClick={() => onToggle(code)}
                      className={clsx(
                        'px-2 py-1 rounded text-xs transition-all duration-150 border',
                        isActive
                          ? 'bg-accent-male/20 border-accent-male text-accent-male'
                          : 'bg-bg-primary border-transparent text-text-secondary hover:text-text-primary',
                      )}
                    >
                      {prefectures[code]?.name}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
