# agent.md

This file provides guidance to AI coding agents when working with code in this repository.

## Project Overview

PeopleFilter — 婚活における理想条件の現実感を可視化するWebインフォグラフィック。日本の政府統計データ（国勢調査・就業構造基本調査・国民健康栄養調査）を基に、設定した条件に合致する人が日本に何人いるかをファネルチャートで表示する。「自分を測る」モードでは自身の属性の統計的レア度をスコア化する。「統計を見る」モードでは年齢別の年収・身長・喫煙率や年収/身長の上位%（CDF）を可視化する。

## Commands

- `npm run dev` — Vite dev server (http://localhost:5173/PeopleFilter/)
- `npm run build` — TypeScript check + production build
- `npm run test` — Vitest watch mode
- `npm run test:run` — Run all tests once
- `npm run lint` — ESLint

## Tech Stack

React 19 + Vite 8 + TypeScript, Tailwind CSS v4, Zustand with persist (localStorage), Motion (Framer Motion), Noto Sans JP. No D3.js.

## Architecture

### Three Modes

1. **相手を探す** — フィルター条件で人口を段階的に絞り込むファネル表示 + 条件のレア度スコア
2. **自分を測る** — 自分の属性を入力してレア度スコアを表示
3. **統計を見る** — 年齢別の平均年収・平均身長・喫煙率、および選択年齢帯における年収・身長の上位%（CDF）

### Data Flow

```
[相手を探す]
FilterPanel → filterStore (Zustand+persist) → useCalculation → calculator.ts → FunnelChart + ResultDisplay
                                                             → scorer.ts   → ScoreDisplay

[自分を測る]
SelfInput → selfStore (Zustand+persist) → scorer.ts → ScoreDisplay

[統計を見る]
StatsView → statsByAge.ts → LineChart (年齢別指標)
                         → CDFChart  (年齢帯別の上位% — 年収/身長)
```

### Calculation Engine (`src/engine/`)

- **calculator.ts** — メイン計算パイプライン。`FilterState` → `FunnelStage[]`。性別・配偶関係でループし、年齢グループごとに人口加重平均で確率を算出。
  - 年収×学歴: **同時分布**（就業構造基本調査のクロス集計、配偶関係別に分離）
  - 身長・体重: **正規分布**近似（独立性仮定）
  - 都道府県: 国勢調査比率（正確）
  - 職業: 独立性仮定
  - 年収分布は配偶関係別（`distribution` = 未婚者、`distributionMarried` = 既婚者）を使い分け
- **scorer.ts** — レア度スコア算出。各条件の「最低許容ライン」でパーセンタイルを計算。
  - 年齢: 若い方が有利（人口累積分布）
  - 年収: 高い方が有利（性別×年齢階級別の周辺分布から算出）
  - 学歴: 院卒 > 大卒 > 専門 > 短大 > 高卒 > 中卒（国勢調査の累積分布）
  - 身長: 高い方が有利（正規分布CDF）
  - BMI: 22が理想、普通体重 > 痩せ > 肥満
  - 総合: 幾何平均 → S/A/B/C/D/E ティア
- **normalDistribution.ts** — 正規分布CDF（Abramowitz & Stegun erfc近似）
- **statsByAge.ts** — 「統計を見る」タブ用のアグリゲータ。フィルタ非依存、ピュア関数。
  - `averageIncomeByAge()` / `averageHeightByAge()` / `smokingRateByAge()` — 年齢階級×性別の折れ線用 `AgePoint[]`
  - `incomeDistributionByAge(ageRange)` — 選択年齢帯の有業者における12段階の年収帯構成比（CDF算出の内部利用）
  - `incomeCDFByAge(ageRange)` — 年収しきい値ごとの「上位%」。`INCOME_AGE_RANGE` = 20-54
  - `heightCDFByAge(ageRange)` — 身長しきい値ごとの「上位%」。正規分布近似を人口加重平均。`HEIGHT_AGE_RANGE` = 15-89
- **types.ts** — `FunnelStage`, `AgeGroup` 定義。0-4歳から80+歳の17グループ。

### Data (`src/data/`)

政府統計を前処理したJSON。git管理。

| File | Source | Content |
|---|---|---|
| `population.json` | 国勢調査 2020 | 性別×年齢5歳階級の総人口 + 配偶関係比率（未婚/既婚/離別/死別） |
| `income-education.json` | 就業構造基本調査 2022 + 国勢調査 | 配偶関係別の有業率 + 年収×学歴同時分布（未婚者 `distribution` / 既婚者 `distributionMarried`）+ 学歴分布 |
| `height-weight.json` | 国民健康・栄養調査 2023 | 性別×年齢別の身長・体重（平均+標準偏差） |
| `occupation.json` | 国勢調査 2020 | 性別×年齢別の職業分布 |
| `prefecture.json` | 国勢調査 2020 | 47都道府県の人口比率 |
| `smoking.json` | 国民健康・栄養調査 2023 | 10歳階級×性別の習慣的喫煙率（%）。20歳以上が対象 |

### State (`src/store/`)

- **filterStore.ts** — 検索条件。`zustand/middleware/persist` で `localStorage:people-filter-search` に自動保存。性別は複数選択、配偶関係も複数選択（最低1つ）。年収はステップ付きレンジ `[min, max]`。
- **selfStore.ts** — 自己プロフィール。`localStorage:people-filter-self` に自動保存。

### UI Components (`src/components/`)

- **FilterPanel/** — 検索条件入力（性別トグル、配偶関係チップ、年齢/年収/身長/体重スライダー、学歴/職業チップ、都道府県ドロップダウン）
- **FunnelChart/** — ファネル可視化。ラベルはバー外に表示（狭幅でも読める）。SVG台形コネクタ。Motionのspring animation。
- **ResultDisplay/** — 最終人数 + アニメーションカウンター + レアリティバッジ
- **ScoreDisplay/** — レア度スコアカード。S〜Eティア + 各条件のパーセンタイルバー
- **SelfAssessment/** — 自己プロフィール入力フォーム
- **StatsView/** — 「統計を見る」タブ。`LineChart`（年齢×指標の折れ線、クリックで年齢帯選択＋ハイライト）と `CDFChart`（横軸=年収/身長、縦軸=上位%、ホバーツールチップ + 上位10/25/50%の参照チップ）。年齢帯は年収用・身長用で独立したstateを持つ。
- **shared/** — RangeSlider, SteppedRangeSlider, ChipSelector, PrefectureSelector

## Key Design Decisions

- **年収×学歴は独立性仮定を回避**: 就業構造基本調査の5次元クロス集計（性別×年齢×配偶関係×年収×学歴）を使用
- **配偶関係別の年収分布**: 既婚男性は高収入帯にシフト、既婚女性はパート等で低収入帯が増加（就業構造基本調査準拠）
- **スコアは「最低許容ライン」で算出**: 年齢は上限、身長は下限、学歴は最低の選択を使用
- **レア度表現**: 人を評価する「ハイスペ」等ではなく、統計的希少性の「激レア」「ふつう」等を使用

## Known Limitations

- 身長/体重は他の条件と独立として計算（実際は相関あり）
- 職業×年収の相関は未考慮（同時フィルタ時に不正確）
- 年収データは有業者のみ（無職・非労働力人口は除外）
- 国勢調査は2020年データ（人口は変動済み）
- 0-14歳には年収・学歴・職業データなし（フォールバック値使用）
- 「統計を見る」の年収CDFは 20-54歳のみ対応（就業構造基本調査の年収×学歴同時分布が 50-54 までしか揃っていないため）
- 喫煙率は10歳階級（20-29 / 30-39 …）粒度。他指標の5歳階級より粗い
- 「今後結婚する確率」は 2020年国勢調査の断面データで、現在の 50-54歳未婚率を生涯未婚率の代理指標として用いる近似。世代効果（若い世代ほど未婚率上昇）を反映しないため、若年層を**やや楽観的に過大評価**する傾向がある（コホート追跡法に比べて）

## Deployment

Static site. `vite.config.ts` の `base: '/PeopleFilter/'` で GitHub Pages 向け。`dist/` に出力。
