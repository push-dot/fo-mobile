import { platform, radius } from '@push/design-system'
import type { TabPlatform } from './tab-color'

export const platformTokens = (os: TabPlatform) => ({
  ...platform[os],
  // Android's tab bar is the Material 3 NavigationBar, 80dp above the inset, not the 58 the artboards draw.
  tabBarHeight: os === 'ios' ? platform.ios.tabBarHeight : 80 + platform.android.safeBottom,
  buttonRadius: os === 'ios' ? radius.buttonIos : radius.buttonAndroid,
  buttonSmRadius: os === 'ios' ? radius.buttonSmIos : radius.buttonSmAndroid,
})
