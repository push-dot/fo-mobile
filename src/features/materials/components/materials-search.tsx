import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, TextInput, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Glass, Icon, useKeyboardHeight } from '@/shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { fontFor, radius, spacing, type, useColors, useThemeMode } from '@/theme'
import { SEARCH_PLACEHOLDER } from '../constants'
import { useListSize } from './list-size'

const CLEAR = 44
const FADE = 28
const GAP_BELOW = spacing[2]

/** The room the field takes: the list's bottom padding, so its last row scrolls clear, and how far above the bottom safe inset a toast sits. */
export const useSearchRoom = () => {
  const { field } = useListSize()
  const bottom = useSafeAreaInsets().bottom
  return { list: FADE + field.height + GAP_BELOW + bottom, toast: field.height + GAP_BELOW + spacing[2] }
}

/** Untinted native glass draws near-black on the dark background, where the board draws its lighter --glass. */
export const useGlassTint = () => {
  const c = useColors()
  return useThemeMode() === 'dark' ? c.glass : undefined
}

/** `.msearch`: the search field floats at the bottom over a fade of the background, and rides up with the keyboard as the chat composer does. */
export const MaterialsSearch = ({ value, onChange }: { value: string; onChange: (q: string) => void }) => {
  const c = useColors()
  const tint = useGlassTint()
  const { field: size } = useListSize()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const screen = useWindowDimensions().height
  const [sheetHeight, setSheetHeight] = useState(screen)
  const field = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], height: size.height, paddingLeft: spacing[4], paddingRight: 6 }}>
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
        <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => onChange('')} style={{ width: CLEAR, height: CLEAR, alignItems: 'center', justifyContent: 'center', marginRight: -6 }}>
          <View style={{ width: 20, height: 20, borderRadius: radius.pill, backgroundColor: c.fill2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={12} color="t3" />
          </View>
        </Pressable>
      ) : null}
    </View>
  )
  return (
    // The view measures itself in the sheet but reads the keyboard in screen y. An iOS page sheet ends at the screen's bottom, so its top is the offset.
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? screen - sheetHeight : 0}
      onLayout={(e) => setSheetHeight(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}
    >
      <View style={{ paddingTop: FADE, paddingHorizontal: spacing[4], paddingBottom: (keyboard ? 0 : insets.bottom) + GAP_BELOW }}>
        <LinearGradient
          pointerEvents="none"
          colors={[c.bg, c.bg, `${c.bg}00`]}
          locations={[0, 0.72, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={{ position: 'absolute', inset: 0 }}
        />
        {Platform.OS === 'ios' ? (
          <Glass tint={tint} style={{ borderRadius: size.borderRadius }}>
            {field}
          </Glass>
        ) : (
          <View style={{ borderRadius: size.borderRadius, backgroundColor: c.fill }}>{field}</View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}
