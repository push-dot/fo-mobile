import { QUICK_STARTS, type QuickStart } from '../constants'

export type Chip = Pick<QuickStart, 'key' | 'label' | 'icon'>

const byKey = (key: string) => QUICK_STARTS.filter((item) => item.key === key)

/** ChatBotOnboardPush: 13 chips, 부족한 점 찾기 before 적합도 보기. ChatBotOnboard (company Bot): 적합도 보기 · 부족한 점 찾기 · 점수 올리기 · 경험 만들기. */
export const quickStartsFor = (kind: 'push' | 'company'): Chip[] =>
  kind === 'push' ? QUICK_STARTS : [...byKey('fit'), ...byKey('gap'), ...byKey('boost'), ...byKey('exp')]
