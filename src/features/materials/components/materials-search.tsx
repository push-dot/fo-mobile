import { LinearGradient } from 'expo-linear-gradient'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, TextInput, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GlassField, Icon, useKeyboardHeight } from '@/shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { StyleSheet } from 'react-native-unistyles'
import { fontFor, spacing, useColors } from '@/theme'
import { SEARCH_PLACEHOLDER } from '../constants'
import { useListSize } from './list-size'

const CLEAR = 44
const FADE = 28
const GAP_BELOW = spacing[2]

export const useSearchRoom = () => {
  const { field } = useListSize()
  const bottom = useSafeAreaInsets().bottom
  return { list: FADE + field.height + GAP_BELOW + bottom, toast: field.height + GAP_BELOW + spacing[2] }
}

export const MaterialsSearch = ({ value, onChange }: { value: string; onChange: (q: string) => void }) => {
  const c = useColors()
  const { field: size } = useListSize()
  const keyboard = useKeyboardHeight()
  const insets = useSafeAreaInsets()
  const screen = useWindowDimensions().height
  const [sheetHeight, setSheetHeight] = useState(screen)
  const field = (
    <View style={styles.field(size.height)}>
      <Icon name="search" size={20} color="t3" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={SEARCH_PLACEHOLDER}
        placeholderTextColor={c.t3}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        lineBreakStrategyIOS="hangul-word"
        accessibilityLabel="자료 검색"
        style={styles.input}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => onChange('')} style={styles.clear}>
          <View style={styles.clearDot}>
            <Icon name="x" size={12} color="t3" />
          </View>
        </Pressable>
      ) : null}
    </View>
  )
  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? screen - sheetHeight : 0}
      onLayout={(e) => setSheetHeight(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      pointerEvents="box-none"
      style={styles.dock}
    >
      <View style={styles.wrap(Boolean(keyboard), insets.bottom)}>
        <LinearGradient
          pointerEvents="none"
          colors={[c.bg, c.bg, `${c.bg}00`]}
          locations={[0, 0.72, 1]}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={styles.fade}
        />
        <GlassField style={styles.glass(size.borderRadius)}>{field}</GlassField>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create((theme) => ({
  field: (height: number) => ({ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], height, paddingLeft: theme.spacing[4], paddingRight: 6 }),
  input: {
    flex: 1,
    fontSize: theme.type.b1.fontSize,
    letterSpacing: theme.type.b1.letterSpacing,
    color: theme.colors.t1,
    ...inputReset,
    ...fontFor('400'),
  },
  clear: { width: CLEAR, height: CLEAR, alignItems: 'center', justifyContent: 'center', marginRight: -6 },
  clearDot: { width: 20, height: 20, borderRadius: theme.radius.pill, backgroundColor: theme.colors.fill2, alignItems: 'center', justifyContent: 'center' },
  dock: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  wrap: (keyboardOpen: boolean, bottom: number) => ({ paddingTop: FADE, paddingHorizontal: theme.spacing[4], paddingBottom: (keyboardOpen ? 0 : bottom) + GAP_BELOW }),
  fade: { position: 'absolute', inset: 0 },
  glass: (borderRadius: number) => ({ borderRadius }),
}))
