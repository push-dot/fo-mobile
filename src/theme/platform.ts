import { platform, radius } from '@push/design-system'
import type { TabPlatform } from './tab-color'

export const platformTokens = (os: TabPlatform) => ({
  ...platform[os],
  tabBarHeight: os === 'ios' ? platform.ios.tabBarHeight : 80 + platform.android.safeBottom,
  buttonRadius: os === 'ios' ? radius.buttonIos : radius.buttonAndroid,
  buttonSmRadius: os === 'ios' ? radius.buttonSmIos : radius.buttonSmAndroid,
})
