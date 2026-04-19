interface DataSource {
  label: string
  url: string
  items: string
}

const DATA_SOURCES: DataSource[] = [
  {
    label: '令和2年 国勢調査 人口等基本集計（総務省統計局）',
    url: 'https://www.e-stat.go.jp/stat-search/files?tclass=000001125102',
    items: '性別×年齢×配偶関係別人口、都道府県別人口',
  },
  {
    label: '令和2年 国勢調査 就業状態等基本集計（総務省統計局）',
    url: 'https://www.e-stat.go.jp/stat-search/database?statdisp_id=0003450693',
    items: '性別×年齢×職業大分類別就業者数',
  },
  {
    label: '令和2年 国勢調査 教育×配偶関係別人口（総務省統計局）',
    url: 'https://www.e-stat.go.jp/stat-search/database?statdisp_id=0003450581',
    items: '性別×年齢×学歴分布',
  },
  {
    label: '令和4年 就業構造基本調査 表04000（総務省統計局）',
    url: 'https://www.e-stat.go.jp/stat-search/database?statdisp_id=0004008157',
    items: '性別×年齢×配偶関係×所得×学歴 5次元クロス集計',
  },
  {
    label: '令和5年 国民健康・栄養調査 第14表（厚生労働省）',
    url: 'https://www.e-stat.go.jp/stat-search/files?stat_infid=000040275973',
    items: '性別×年齢別 身長・体重の平均値及び標準偏差',
  },
  {
    label: '令和5年 国民健康・栄養調査 第73表（厚生労働省）',
    url: 'https://www.e-stat.go.jp/stat-search/files?stat_infid=000040276090',
    items: '性別×年齢別 習慣的喫煙率',
  },
]

export function Footer() {
  return (
    <footer className="border-t border-border mt-12 py-8 px-4 space-y-4">
      <div className="space-y-2 max-w-2xl mx-auto">
        <h3 className="text-xs font-bold text-text-secondary text-center">データソース（出典）</h3>
        <ul className="text-[11px] text-text-muted space-y-1.5">
          {DATA_SOURCES.map((src) => (
            <li key={src.url}>
              <a
                href={src.url}
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-text-primary break-all"
              >
                {src.label}
              </a>
              <span className="text-text-muted/80">（{src.items}）</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-2 max-w-lg mx-auto">
        <h3 className="text-xs font-bold text-text-secondary text-center">計算方法について</h3>
        <ul className="text-xs text-text-muted space-y-1">
          <li>・年収と学歴は同時分布（クロス集計）を使用し、両者の相関を考慮しています</li>
          <li>・身長・体重は正規分布を仮定し、他の条件とは独立として計算しています</li>
          <li>・年収データは有業者のみが対象です</li>
          <li>・職業と年収を同時に指定した場合、両者の相関は考慮されていません</li>
          <li>・「向こう5年で結婚する確率」は 2015→2020 国勢調査のコホート追跡で算出しています</li>
          <li>・結果は統計データに基づく推定値であり、実際の人数とは異なる場合があります</li>
        </ul>
      </div>

      <p className="text-xs text-text-muted pt-2 text-center">
        本サイトは婚活における条件の現実感を可視化する目的で作成されたものです
      </p>
    </footer>
  )
}
