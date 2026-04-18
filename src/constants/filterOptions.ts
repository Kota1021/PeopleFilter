export const INCOME_STEPS = [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000] as const

export const INCOME_STEP_LABELS: Record<number, string> = {
  0: '0',
  100: '100万',
  200: '200万',
  300: '300万',
  400: '400万',
  500: '500万',
  600: '600万',
  700: '700万',
  800: '800万',
  900: '900万',
  1000: '1000万',
  1500: '1500万',
  2000: '上限なし',
}

/** Maps income range [min, max] to the data's category keys */
export function incomeRangeToCategories(min: number, max: number): string[] {
  const mapping: Array<{ key: string; lower: number; upper: number }> = [
    { key: '~100', lower: 0, upper: 100 },
    { key: '100-200', lower: 100, upper: 200 },
    { key: '200-300', lower: 200, upper: 300 },
    { key: '300-400', lower: 300, upper: 400 },
    { key: '400-500', lower: 400, upper: 500 },
    { key: '500-600', lower: 500, upper: 600 },
    { key: '600-700', lower: 600, upper: 700 },
    { key: '700-800', lower: 700, upper: 800 },
    { key: '800-900', lower: 800, upper: 900 },
    { key: '900-1000', lower: 900, upper: 1000 },
    { key: '1000-1500', lower: 1000, upper: 1500 },
    { key: '1500-2000', lower: 1500, upper: 2000 },
    { key: '2000-3000', lower: 2000, upper: 3000 },
    { key: '3000+', lower: 3000, upper: Infinity },
  ]
  return mapping
    .filter(({ lower, upper }) => lower >= min && upper <= (max >= 2000 ? Infinity : max))
    .map(({ key }) => key)
}

export const MARITAL_STATUS_OPTIONS = [
  { value: 'unmarried' as const, label: '未婚' },
  { value: 'married' as const, label: '既婚' },
  { value: 'divorced' as const, label: '離別' },
  { value: 'widowed' as const, label: '死別' },
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
export const AGE_RANGE = { min: 0, max: 80 } as const

export const CHILDREN_DESIRE_OPTIONS = [
  { value: 'any' as const, label: '気にしない' },
  { value: 'want' as const, label: 'ほしい人' },
  { value: 'no' as const, label: 'ほしくない人' },
] as const

export const SMOKING_OPTIONS = [
  { value: 'any' as const, label: '気にしない' },
  { value: 'nonsmoker' as const, label: '非喫煙者' },
] as const

export const DRINKING_OPTIONS = [
  { value: 'any' as const, label: '気にしない' },
  { value: 'light' as const, label: '飲まない〜たまに' },
  { value: 'none' as const, label: '飲まない人のみ' },
] as const

export const COMPATIBILITY_AXES = [
  { key: 'looks' as const, label: '顔立ち' },
  { key: 'money' as const, label: '金銭感覚' },
  { key: 'personality' as const, label: '性格の相性' },
  { key: 'food' as const, label: '食の好み' },
  { key: 'values' as const, label: '価値観' },
  { key: 'lifestyle' as const, label: '朝型/夜型' },
] as const

/** 0=誰でもOK (1.0), 5=完璧主義 (0.05) */
export const COMPATIBILITY_COEF_MAP = [1.0, 0.7, 0.5, 0.3, 0.15, 0.05] as const

export const COMPATIBILITY_LEVEL_LABELS = [
  '誰でも',
  'ゆるい',
  'ふつう',
  'こだわる',
  '強いこだわり',
  '完璧主義',
] as const
