import { router } from 'expo-router'
import { Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon, Text } from '../../../shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { fontFor, radius, spacing, type, useColors } from '../../../theme'

const SearchBar = ({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit: () => void }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const field = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], minHeight: 44, paddingHorizontal: spacing[4] }}>
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
        style={[{ flex: 1, fontSize: type.b1.fontSize, color: c.t1, ...inputReset }, fontFor('400')]}
      />
      {value ? (
        <Pressable accessibilityRole="button" accessibilityLabel="검색어 지우기" onPress={() => onChange('')} hitSlop={12}>
          <View style={{ width: 20, height: 20, borderRadius: radius.pill, backgroundColor: c.t4, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="x" size={12} color={c.bg} />
          </View>
        </Pressable>
      ) : null}
    </View>
  )
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: c.bg, zIndex: 3 }}>
      <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[3] }}>
        <View style={{ flex: 1 }}>
          <View style={{ borderRadius: 22, backgroundColor: c.fill }}>{field}</View>
        </View>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 6 }}>
          <Text v="b2" weight="700">
            취소
          </Text>
        </Pressable>
      </View>
    </View>
  )
}

export default SearchBar
