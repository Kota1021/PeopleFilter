export const INCOME_OPTIONS = [
  { value: '~100', label: '〜100万円' },
  { value: '100-200', label: '100〜200万円' },
  { value: '200-300', label: '200〜300万円' },
  { value: '300-400', label: '300〜400万円' },
  { value: '400-500', label: '400〜500万円' },
  { value: '500-600', label: '500〜600万円' },
  { value: '600-700', label: '600〜700万円' },
  { value: '700-800', label: '700〜800万円' },
  { value: '800-900', label: '800〜900万円' },
  { value: '900-1000', label: '900〜1000万円' },
  { value: '1000-1500', label: '1000〜1500万円' },
  { value: '1500+', label: '1500万円以上' },
] as const

export const EDUCATION_OPTIONS = [
  { value: 'junior_high', label: '中学卒' },
  { value: 'high_school', label: '高校卒' },
  { value: 'vocational', label: '専門学校卒' },
  { value: 'junior_college', label: '短大・高専卒' },
  { value: 'university', label: '大学卒' },
  { value: 'graduate', label: '大学院卒' },
] as const

export const OCCUPATION_OPTIONS = [
  { value: 'management', label: '管理職' },
  { value: 'professional', label: '専門・技術職' },
  { value: 'clerical', label: '事務職' },
  { value: 'sales', label: '販売職' },
  { value: 'service', label: 'サービス職' },
  { value: 'security', label: '保安職' },
  { value: 'agriculture', label: '農林漁業' },
  { value: 'manufacturing', label: '生産工程' },
  { value: 'transport', label: '輸送・機械運転' },
  { value: 'construction', label: '建設・採掘' },
  { value: 'logistics', label: '運搬・清掃・包装' },
] as const

export const HEIGHT_RANGE = { min: 140, max: 200 } as const
export const WEIGHT_RANGE = { min: 30, max: 120 } as const
export const AGE_RANGE = { min: 18, max: 80 } as const
