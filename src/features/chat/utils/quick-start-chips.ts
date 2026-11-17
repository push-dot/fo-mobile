import { QUICK_STARTS, type QuickStart } from '../constants'

export type Chip = Pick<QuickStart, 'key' | 'label' | 'icon'>

/** The design has 부족한 점 찾기 beside 적합도 보기 (Push Bot: before it, company Bot: after it); both open the 적합도 sheet, which already tells the gaps. */
const GAP_CHIP: Chip = { key: 'fit', label: '부족한 점 찾기', icon: 'qs-gap' }

const byKey = (key: string) => QUICK_STARTS.filter((item) => item.key === key)

/** ChatBotOnboardPush: 13 chips. ChatBotOnboard (company Bot): 적합도 보기 · 부족한 점 찾기 · 점수 올리기 · 경험 만들기. */
export const quickStartsFor = (kind: 'push' | 'company'): Chip[] =>
  kind === 'push'
    ? QUICK_STARTS.flatMap((item) => (item.key === 'fit' ? [GAP_CHIP, item] : [item]))
    : [...byKey('fit'), GAP_CHIP, ...byKey('boost'), ...byKey('exp')]
