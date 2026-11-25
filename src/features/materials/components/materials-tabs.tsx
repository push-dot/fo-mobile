import { Picker, Text as SwiftText } from '@expo/ui/swift-ui'
import { pickerStyle, tag } from '@expo/ui/swift-ui/modifiers'
import { Platform, Pressable, useWindowDimensions, View } from 'react-native'
import { Text } from '@/shared/components'
import NativeHost from '@/shared/components/native-host'
import { isXlBoardText } from '@/shared/components/xl-chrome'
import { StyleSheet } from 'react-native-unistyles'
import { cssShadow, spacing, useThemeMode } from '@/theme'
import { TABS } from '../constants'
import type { MaterialTab } from '../types'

const HEIGHT = 44
const HEIGHT_XL = 52
const INSET = spacing[1]

type Props = { value: MaterialTab; onChange: (tab: MaterialTab) => void }

const NativeTabs = ({ value, onChange }: Props) => (
  <NativeHost style={styles.native}>
    <Picker label="자료 종류" selection={value} onSelectionChange={onChange} modifiers={[pickerStyle('segmented')]}>
      {TABS.map((tab) => (
        <SwiftText key={tab.key} modifiers={[tag(tab.key)]}>
          {tab.label}
        </SwiftText>
      ))}
    </Picker>
  </NativeHost>
)

const DrawnTabs = ({ value, onChange }: Props) => {
  const dark = useThemeMode() === 'dark'
  const height = isXlBoardText(useWindowDimensions().fontScale) ? HEIGHT_XL : HEIGHT
  const row = (
    <View accessibilityRole="tablist" accessibilityLabel="자료 종류" style={styles.row}>
      {TABS.map((tab) => {
        const on = tab.key === value
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            hitSlop={{ top: INSET, bottom: INSET }}
            onPress={() => onChange(tab.key)}
            style={[styles.tab(height), on && (dark ? styles.tabOnDark : styles.tabOn)]}
          >
            <Text v="segLabel" color={on ? 't1' : 't3'} weight={on ? '800' : undefined} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
  return <View style={styles.track(height)}>{row}</View>
}

const MaterialsTabs = (props: Props) => (Platform.OS === 'ios' ? <NativeTabs {...props} /> : <DrawnTabs {...props} />)

const styles = StyleSheet.create((theme) => ({
  native: { height: HEIGHT },
  row: { flex: 1, flexDirection: 'row', padding: INSET },
  tab: (height: number) => ({ flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: (height - 2 * INSET) / 2 }),
  tabOn: { backgroundColor: theme.colors.bg, boxShadow: cssShadow.segment },
  tabOnDark: { backgroundColor: theme.colors.fill2, boxShadow: cssShadow.segment },
  track: (height: number) => ({ height, borderRadius: height / 2, backgroundColor: theme.colors.fill }),
}))

export default MaterialsTabs
