import { QUICK_STARTS, type QuickStart } from '../constants'

const COMPANY_CHIP_KEYS = ['fit', 'boost', 'exp'] as const

export type Chip = Pick<QuickStart, 'key' | 'label' | 'icon'>

/** The previous design has 부족한 점 찾기 beside 적합도 보기; both open the 적합도 sheet, which already tells the gaps. */
const GAP_CHIP: Chip = { key: 'fit', label: '부족한 점 찾기', icon: 'qs-gap' }

export const quickStartsFor = (kind: 'push' | 'company'): Chip[] =>
  kind === 'push'
    ? QUICK_STARTS.flatMap((item) => (item.key === 'fit' ? [GAP_CHIP, item] : [item]))
    : COMPANY_CHIP_KEYS.flatMap((key) => {
        const row = QUICK_STARTS.find((item) => item.key === key)
        return row ? [row] : []
      })
