import type { Colors } from './tokens'

export type TabPlatform = 'ios' | 'android'

/**
 * Canvas audit 2026-10 tab bar.
 * iOS idle t1 / selected acText. Android idle t3 / selected t1.
 * The tab layout applies this. Screen restyles stay with that layout.
 */
export const tabColor = (
  platform: TabPlatform,
  selected: boolean,
  colors: Pick<Colors, 't1' | 't3' | 'acText'>,
): string => {
  if (platform === 'ios') return selected ? colors.acText : colors.t1
  return selected ? colors.t1 : colors.t3
}
