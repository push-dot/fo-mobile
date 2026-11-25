import { NativeTabs } from 'expo-router/native-tabs'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { platformTheme, tabColor, useColors, useThemeMode } from '@/theme'

const ICONS = {
  home: { default: require('../../../../../assets/tabs/tab-home.png'), selected: require('../../../../../assets/tabs/tab-home-on.png') },
  hub: { default: require('../../../../../assets/tabs/tab-hub.png'), selected: require('../../../../../assets/tabs/tab-hub-on.png') },
  social: { default: require('../../../../../assets/tabs/tab-social.png'), selected: require('../../../../../assets/tabs/tab-social-on.png') },
  my: { default: require('../../../../../assets/tabs/tab-my.png'), selected: require('../../../../../assets/tabs/tab-my-on.png') },
  agent: { light: require('../../../../../assets/tabs/tab-agent.png'), dark: require('../../../../../assets/tabs/tab-agent-dark.png') },
}

const TABS = [
  { route: '(home)', name: '홈', icon: ICONS.home },
  { route: '(hub)', name: '허브', icon: ICONS.hub },
  { route: '(social)', name: '소셜', icon: ICONS.social },
  { route: '(bots)', name: 'Bot', mascot: ICONS.agent },
  { route: '(my)', name: '마이', icon: ICONS.my },
] as const

const BAR_HEIGHT = platformTheme.tabBarHeight - platformTheme.safeBottom

const TabsLayout = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const mode = useThemeMode()
  const platform = Platform.OS === 'android' ? 'android' : 'ios'
  const idle = tabColor(platform, false, c)
  const selected = tabColor(platform, true, c)
  const android = platform === 'android'
  const tabs = (
    <NativeTabs
      minimizeBehavior="onScrollDown"
      labelVisibilityMode="unlabeled"
      tintColor={selected}
      iconColor={{ default: idle, selected }}
      backgroundColor={android ? c.bg : undefined}
      rippleColor={c.fill}
      disableIndicator
    >
      {TABS.map((tab) => (
        <NativeTabs.Trigger key={tab.route} name={tab.route} accessibilityLabel={tab.name}>
          {'mascot' in tab ? (
            <NativeTabs.Trigger.Icon src={tab.mascot[mode]} renderingMode="original" />
          ) : (
            <NativeTabs.Trigger.Icon src={tab.icon} renderingMode="template" />
          )}
          <NativeTabs.Trigger.Label hidden />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  )
  if (!android) return tabs
  return (
    <View style={{ flex: 1 }}>
      {tabs}
      <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: BAR_HEIGHT + insets.bottom, height: 1, backgroundColor: c.line }} />
    </View>
  )
}

export default TabsLayout
