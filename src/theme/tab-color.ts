import type { Colors } from './tokens'

export type TabPlatform = 'ios' | 'android'

export const tabColor = (
  platform: TabPlatform,
  selected: boolean,
  colors: Pick<Colors, 't1' | 't3' | 'acText'>,
): string => {
  if (platform === 'ios') return selected ? colors.acText : colors.t1
  return selected ? colors.t1 : colors.t3
}
