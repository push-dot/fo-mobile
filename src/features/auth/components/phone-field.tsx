import { TextInput, View } from 'react-native'
import { Text } from '../../../shared/components'
import { fontFor, radius, useColors } from '../../../theme'

const PhoneField = ({ value, onChange }: { value: string; onChange: (next: string) => void }) => {
  const c = useColors()
  return (
    <View
      style={{
        height: 56,
        borderRadius: radius.md,
        backgroundColor: c.fill,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        gap: 12,
      }}
    >
      <Text v="b1" weight="700">
        +82
      </Text>
      <View style={{ width: 1, height: 20, backgroundColor: c.line }} />
      <TextInput
        accessibilityLabel="휴대폰 번호"
        value={value}
        onChangeText={onChange}
        keyboardType="phone-pad"
        placeholder="010-1234-5678"
        placeholderTextColor={c.t4}
        maxLength={13}
        style={[{ flex: 1, fontSize: 16, color: c.t1 }, fontFor('400')]}
      />
    </View>
  )
}

export default PhoneField
