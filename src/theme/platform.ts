import { platform, radius } from '@push/design-system'
import type { TabPlatform } from './tab-color'

export const platformTokens = (os: TabPlatform) => ({
  ...platform[os],
  buttonRadius: os === 'ios' ? radius.buttonIos : radius.buttonAndroid,
  buttonSmRadius: os === 'ios' ? radius.buttonSmIos : radius.buttonSmAndroid,
})
