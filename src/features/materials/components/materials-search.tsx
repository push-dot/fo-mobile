import { LinearGradient } from 'expo-linear-gradient'
import { Platform, Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Glass, Icon, useKeyboardHeight } from '@/shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { fontFor, radius, spacing, type, useColors, useThemeMode } from '@/theme'
import { SEARCH_PLACEHOLDER } from '../constants'

const FIELD = 44
const FADE = 28
const GAP_BELOW = spacing[2]

/** How far above the bottom safe inset a toast sits to clear the search field. */
export const TOAST_ABOVE_SEARCH = FIELD + GAP_BELOW + spacing[2]
/** The list's bottom padding, so its last row scrolls clear of the field. */
export const useSearchClearance = () => FADE + FIELD + GAP_BELOW + useSafeAreaInsets().bottom

/** `.msearch`: the search field floats at the bottom over a fade of the background, and rides up with the keyboard. */
export const MaterialsSearch = ({ value, onChange }: { value: string; onChange: (q: string) => void }) => {
  const c = useColors()
  const dark = useThemeMode() === 'dark'
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const field = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], height: FIELD, paddingLeft: spacing[4], paddingRight: 6 }}>
      <Icon name="search" size={20} color="t3" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={SEARCH_PLACEHOLDER}
        placeholderTextColor={c.t3}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="자료 검색"
        style={[{ flex: 1, fontSize: type.b1.fontSize, letterSpacing: type.b1.letterSpacing, color: c.t1, ...inputReset }, fontFor('400')]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => onChange('')} style={{ width: FIELD, height: FIELD, alignItems: 'center', justifyContent: 'center', marginRight: -6 }}>
          <View style={{ width: 20, height: 20, borderRadius: radius.pill, backgroundColor: c.fill2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={12} color="t3" />
          </View>
        </Pressable>
      ) : null}
    </View>
  )
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, bottom: keyboard, paddingTop: FADE, paddingHorizontal: spacing[4], paddingBottom: (keyboard ? 0 : insets.bottom) + GAP_BELOW }}>
      <LinearGradient
        pointerEvents="none"
        colors={[c.bg, c.bg, `${c.bg}00`]}
        locations={[0, 0.72, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 0, y: 0 }}
        style={{ position: 'absolute', inset: 0 }}
      />
      {Platform.OS === 'ios' ? (
        // Untinted native glass draws near-black on the dark background, the board draws its lighter --glass.
        <Glass tint={dark ? c.glass : undefined} style={{ borderRadius: radius.pill }}>
          {field}
        </Glass>
      ) : (
        <View style={{ borderRadius: radius.pill, backgroundColor: c.fill }}>{field}</View>
      )}
    </View>
  )
}
