# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PeopleFilter is a Japanese web infographic that calculates and visualizes how many people in Japan match specific partner criteria for marriage/dating. Users set filters (age, income, education, height, weight, occupation, prefecture) and a funnel chart shows how the population narrows with each filter, based on real Japanese government statistics.

## Commands

- `npm run dev` — Start Vite dev server (http://localhost:5173/PeopleFilter/)
- `npm run build` — TypeScript check + production build
- `npm run test` — Run Vitest in watch mode
- `npm run test:run` — Run all tests once
- `npm run lint` — ESLint

## Tech Stack

React 19 + Vite + TypeScript, Tailwind CSS v4, Zustand (state), Motion/Framer Motion (animation), Noto Sans JP font. No D3.js — funnel is CSS/SVG + Motion.

## Architecture

### Data Flow
```
FilterPanel (UI) → Zustand store (filterStore.ts) → useCalculation hook → calculator.ts → FunnelChart + ResultDisplay
```

### Calculation Engine (`src/engine/`)
- **calculator.ts** — Main pipeline. Takes `FilterState`, produces `FunnelStage[]`. Applies filters sequentially: base population → age → prefecture → income+education (joint) → height → weight → occupation.
- **normalDistribution.ts** — Normal CDF (Abramowitz & Stegun erfc approximation). Used for height/weight probability calculations.

**Key statistical methodology:**
- Income × education use **joint distribution** from 就業構造基本調査 2022 (no independence assumption needed)
- Height and weight use **normal distribution** (mean + SD) with independence assumption
- Prefecture filtering uses census proportions (exact)
- Occupation assumes independence from other criteria

### Data (`src/data/`)
All JSON files are pre-processed government statistics committed to the repo:
- `population.json` — 国勢調査 2020: unmarried population by gender × 5-year age group
- `income-education.json` — 就業構造基本調査 2022: joint income × education distribution + education distribution + employment rates
- `height-weight.json` — 国民健康・栄養調査 2023: height/weight mean + SD by gender × age
- `occupation.json` — 国勢調査 2020: occupation distribution by gender × age
- `prefecture.json` — 国勢調査 2020: prefecture population ratios

### State Management (`src/store/`)
Single Zustand store (`filterStore.ts`) holding all filter state. Filter components read/write directly via `useFilterStore()`.

### UI Components (`src/components/`)
- **FilterPanel/** — All filter controls (gender toggle, sliders, chip selectors, prefecture dropdown)
- **FunnelChart/** — Animated funnel visualization with SVG trapezoid connectors
- **ResultDisplay/** — Final count with animated counter and rarity badges
- **shared/** — Reusable RangeSlider, ChipSelector, PrefectureSelector

## Deployment

Static site. `vite.config.ts` sets `base: '/PeopleFilter/'` for GitHub Pages. Build output goes to `dist/`.

## Known Limitations

- Height/weight independence assumption (correlated in reality)
- Occupation × income correlation not captured when both are filtered
- Income data covers only employed persons (有業者)
- Census data is from 2020; population has shifted since
