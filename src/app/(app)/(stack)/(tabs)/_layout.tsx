import { NativeTabs } from 'expo-router/native-tabs'
import { Platform } from 'react-native'
import { fontFor, tabColor, type, useColors, useThemeMode } from '@/theme'

// Tab bar icons rendered from the Claude Design line icons and the mascot (assets/tabs, @2x/@3x).
const ICONS = {
  home: { default: require('../../../../../assets/tabs/tab-home.png'), selected: require('../../../../../assets/tabs/tab-home-on.png') },
  hub: { default: require('../../../../../assets/tabs/tab-hub.png'), selected: require('../../../../../assets/tabs/tab-hub-on.png') },
  social: { default: require('../../../../../assets/tabs/tab-social.png'), selected: require('../../../../../assets/tabs/tab-social-on.png') },
  my: { default: require('../../../../../assets/tabs/tab-my.png'), selected: require('../../../../../assets/tabs/tab-my-on.png') },
  agent: { light: require('../../../../../assets/tabs/tab-agent.png'), dark: require('../../../../../assets/tabs/tab-agent-dark.png') },
}

const TabsLayout = () => {
  const c = useColors()
  const mode = useThemeMode()
  const platform = Platform.OS === 'android' ? 'android' : 'ios'
  const idle = tabColor(platform, false, c)
  const selected = tabColor(platform, true, c)
  const android = platform === 'android'
  // The iOS floating tab bar draws 10px labels, Android 11px (design .ios .tabbar a).
  const label = { ...fontFor(type.tab.weight), fontSize: android ? type.tab.fontSize : 10 }
  return (
    // Android: label every tab like the design boards (Material hides unselected labels by default).
    <NativeTabs
      minimizeBehavior="onScrollDown"
      labelVisibilityMode="labeled"
      tintColor={selected}
      iconColor={{ default: idle, selected }}
      labelStyle={{ default: { ...label, color: idle }, selected: { ...label, color: selected } }}
      backgroundColor={android ? c.bg : undefined}
      rippleColor={c.fill}
      disableIndicator
    >
      <NativeTabs.Trigger name="(home)">
        <NativeTabs.Trigger.Icon src={ICONS.home} renderingMode="template" />
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(hub)">
        <NativeTabs.Trigger.Icon src={ICONS.hub} renderingMode="template" />
        <NativeTabs.Trigger.Label>허브</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(social)">
        <NativeTabs.Trigger.Icon src={ICONS.social} renderingMode="template" />
        <NativeTabs.Trigger.Label>소셜</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(chat)">
        {/* The mascot keeps its own colors in both states, as in the design. */}
        <NativeTabs.Trigger.Icon src={ICONS.agent[mode]} renderingMode="original" />
        <NativeTabs.Trigger.Label>에이전트</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(my)">
        <NativeTabs.Trigger.Icon src={ICONS.my} renderingMode="template" />
        <NativeTabs.Trigger.Label>마이</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}

export default TabsLayout
