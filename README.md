# PeopleFilter

婚活における理想条件の現実感を可視化する Web インフォグラフィック。日本の政府統計データを基に、設定した条件に合致する人が日本にどれくらいいるかをファネルチャートで表示します。

## モード

- **相手を探す** — フィルター条件で人口を段階的に絞り込むファネル表示 + 条件のレア度スコア
- **自分を測る** — 自分の属性を入力してレア度スコアを表示
- **統計を見る** — 年齢別の平均年収・平均身長・喫煙率・結婚確率、年収/身長の上位%（CDF）

## 開発

```bash
npm install
npm run dev      # http://localhost:5173/PeopleFilter/
npm run build    # 型チェック + 本番ビルド
npm run test     # Vitest watch
npm run test:run # 全テスト一度実行
npm run lint     # ESLint
```

## データソース

すべて政府公式統計から取得。出典はアプリ下部のフッター + `src/data/*.json` の `sourceUrl` フィールドに記載。

| データ | 出典 | URL |
|---|---|---|
| 性別×年齢×配偶関係別人口 | 令和2年 国勢調査 人口等基本集計 | [e-Stat](https://www.e-stat.go.jp/stat-search/files?tclass=000001125102) |
| 都道府県別人口 | 令和2年 国勢調査 | [結果概要PDF](https://www.stat.go.jp/data/kokusei/2020/kekka/pdf/outline_01.pdf) |
| 職業分布（12大分類） | 令和2年 国勢調査 表9-3-1 | [e-Stat](https://www.e-stat.go.jp/stat-search/database?statdisp_id=0003450693) |
| 年収×学歴×配偶関係 同時分布 | 令和4年 就業構造基本調査 表04000 | [e-Stat](https://www.e-stat.go.jp/stat-search/database?statdisp_id=0004008157) |
| 学歴分布 | 令和2年 国勢調査 表11-1 | [e-Stat](https://www.e-stat.go.jp/stat-search/database?statdisp_id=0003450581) |
| 身長・体重 | 令和5年 国民健康・栄養調査 第14表 | [e-Stat](https://www.e-stat.go.jp/stat-search/files?stat_infid=000040275973) |
| 習慣的喫煙率 | 令和5年 国民健康・栄養調査 第73表 | [e-Stat](https://www.e-stat.go.jp/stat-search/files?stat_infid=000040276090) |

## アーキテクチャ

詳細は [agent.md](./agent.md) を参照。

## デプロイ

GitHub Pages 用に `vite.config.ts` で `base: '/PeopleFilter/'` を設定。`npm run build` で `dist/` に出力。
