import { router } from 'expo-router'
import { Platform, Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { Glass, GlassField, Icon, Text } from '../../../shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { fontFor, useColors, useThemeMode } from '../../../theme'

const CLOSE_SHAPE = { flex: 1, minHeight: 44, borderRadius: 22, paddingHorizontal: 18, justifyContent: 'center' } as const

const SearchBar = ({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) => {
  const c = useColors()
  const ios = Platform.OS === 'ios'
  const dark = useThemeMode() === 'dark'
  const insets = useSafeAreaInsets()
  const field = (
    <View style={styles.field}>
      <Icon name="search" size={18} color="t3" />
      <TextInput
        autoFocus
        value={value}
        onChangeText={onChange}
        onSubmitEditing={onSubmit}
        placeholder="회사, 직무, 기술 검색"
        placeholderTextColor={c.t3}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="검색어"
        style={styles.input}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => onChange('')} hitSlop={12}>
          <View style={styles.clear}>
            <Icon name="x" size={12} color={c.bg} />
          </View>
        </Pressable>
      ) : null}
    </View>
  )
  const closeLabel = (
    <Text v="b1" weight="700">
      닫기
    </Text>
  )
  return (
    <View style={styles.bar(insets.top)}>
      <View style={styles.inner}>
        <View style={styles.row}>
          <View style={styles.fieldWrap}>
            <GlassField style={styles.glassField}>{field}</GlassField>
          </View>
          <Pressable accessibilityRole="button" onPress={() => router.back()}>
            {ios ? (
              <Glass interactive tint={dark ? c.glass : undefined} style={CLOSE_SHAPE}>
                {closeLabel}
              </Glass>
            ) : (
              <View style={[CLOSE_SHAPE, styles.closeFill]}>{closeLabel}</View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  field: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], minHeight: 44, paddingHorizontal: theme.spacing[4] },
  input: {
    flex: 1,
    fontSize: theme.type.b1.fontSize,
    letterSpacing: theme.type.b1.letterSpacing,
    color: theme.colors.t1,
    ...inputReset,
    ...fontFor('400'),
  },
  clear: { width: 20, height: 20, borderRadius: theme.radius.pill, backgroundColor: theme.colors.t4, alignItems: 'center', justifyContent: 'center' },
  bar: (top: number) => ({ paddingTop: top, backgroundColor: theme.colors.bg, zIndex: 3 }),
  inner: { minHeight: 56, justifyContent: 'center', paddingHorizontal: Platform.OS === 'ios' ? theme.spacing[3] : theme.spacing[2] },
  row: { flexDirection: 'row', alignItems: 'stretch', gap: theme.spacing[2] },
  fieldWrap: { flex: 1 },
  glassField: { flex: 1, borderRadius: 22 },
  closeFill: { backgroundColor: theme.colors.fill },
}))

export default SearchBar
