import { Pressable, useWindowDimensions, View } from 'react-native'
import { Text } from '@/shared/components'
import { isXlBoardText } from '@/shared/components/xl-chrome'
import { cssShadow, spacing, useColors, useThemeMode } from '@/theme'
import { TABS } from '../constants'
import type { MaterialTab } from '../types'

/** `.seg` is 44 high, 52 under `.xl` (MaterialsXL: `.xl .mnav .seg`). */
const HEIGHT = 44
const HEIGHT_XL = 52
const INSET = spacing[1]

/**
 * The boards' `.seg button.on`: the selected tab is a raised `bg` pill (dark: `fill2`) at weight 800 on both platforms.
 * The shared SegmentedControl fills it with `fill` on iOS, which the Materials boards do not draw.
 */
export const MaterialsTabs = ({ value, onChange }: { value: MaterialTab; onChange: (tab: MaterialTab) => void }) => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  const height = isXlBoardText(useWindowDimensions().fontScale) ? HEIGHT_XL : HEIGHT
  const track = { height, borderRadius: height / 2 }
  const row = (
    <View accessibilityRole="tablist" accessibilityLabel="자료 종류" style={{ flex: 1, flexDirection: 'row', padding: INSET }}>
      {TABS.map((tab) => {
        const on = tab.key === value
        return (
          <Pressable
            key={tab.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            hitSlop={{ top: INSET, bottom: INSET }}
            onPress={() => onChange(tab.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: (height - 2 * INSET) / 2,
              backgroundColor: on ? (dark ? c.fill2 : c.bg) : undefined,
              boxShadow: on ? cssShadow.segment : undefined,
            }}
          >
            <Text v="segLabel" color={on ? 't1' : 't3'} weight={on ? '800' : undefined} numberOfLines={1}>
              {tab.label}
            </Text>
          </Pressable>
        )
      })}
    </View>
  )
  return <View style={[track, { backgroundColor: c.fill }]}>{row}</View>
}
