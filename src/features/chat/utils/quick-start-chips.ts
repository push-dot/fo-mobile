import { QUICK_STARTS, type QuickStart } from '../constants'

export type Chip = Pick<QuickStart, 'key' | 'label' | 'icon'>

const byKey = (key: string) => QUICK_STARTS.filter((item) => item.key === key)

export const quickStartsFor = (kind: 'push' | 'company'): Chip[] =>
  kind === 'push' ? QUICK_STARTS : [...byKey('fit'), ...byKey('gap'), ...byKey('boost'), ...byKey('exp')]
