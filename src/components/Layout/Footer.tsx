export function Footer() {
  return (
    <footer className="border-t border-border mt-12 py-8 px-4 text-center space-y-4">
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-text-secondary">データソース</h3>
        <ul className="text-xs text-text-muted space-y-1">
          <li>総務省統計局「国勢調査」（2020年）- 人口・配偶関係・学歴・職業</li>
          <li>総務省統計局「就業構造基本調査」（2022年）- 年収×学歴同時分布</li>
          <li>厚生労働省「国民健康・栄養調査」（2023年）- 身長・体重・喫煙率</li>
        </ul>
      </div>

      <div className="space-y-2">
        <h3 className="text-xs font-bold text-text-secondary">計算方法について</h3>
        <ul className="text-xs text-text-muted space-y-1 max-w-lg mx-auto text-left">
          <li>・年収と学歴は同時分布（クロス集計）を使用し、両者の相関を考慮しています</li>
          <li>・身長・体重は正規分布を仮定し、他の条件とは独立として計算しています</li>
          <li>・年収データは有業者のみが対象です</li>
          <li>・職業と年収を同時に指定した場合、両者の相関は考慮されていません</li>
          <li>・結果は統計データに基づく推定値であり、実際の人数とは異なる場合があります</li>
        </ul>
      </div>

      <p className="text-xs text-text-muted pt-2">
        本サイトは婚活における条件の現実感を可視化する目的で作成されたものです
      </p>
    </footer>
  )
}
