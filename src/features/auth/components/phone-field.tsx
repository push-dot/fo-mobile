import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { Icon, Text } from '../../../shared/components'
import { fontFor, spacing, useColors } from '../../../theme'
import { COUNTRY_CODE, COUNTRY_CODE_LABEL, FIELD_RADIUS } from '../constants'

const PhoneField = ({ value, onChange }: { value: string; onChange: (next: string) => void }) => {
  const c = useColors()
  const [focused, setFocused] = useState(false)
  return (
    <View style={{ flexDirection: 'row', gap: spacing[2] }}>
      <View
        accessible
        accessibilityLabel={COUNTRY_CODE_LABEL}
        style={{ height: 56, paddingHorizontal: spacing[4], borderRadius: FIELD_RADIUS, backgroundColor: c.bg2, flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}
      >
        <Text v="b1" weight="700">
          {COUNTRY_CODE}
        </Text>
        <Icon name="down" size={16} color="t3" />
      </View>
      <View
        style={{ flex: 1, height: 56, paddingHorizontal: 14, borderRadius: FIELD_RADIUS, backgroundColor: c.bg2, borderWidth: 2, borderColor: focused ? c.ac : 'transparent', justifyContent: 'center' }}
      >
        <TextInput
          accessibilityLabel="휴대폰 번호"
          value={value}
          onChangeText={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          keyboardType="phone-pad"
          placeholder="010-1234-5678"
          placeholderTextColor={c.t4}
          maxLength={13}
          selectionColor={c.ac}
          style={[{ fontSize: 19, letterSpacing: 0.4, color: c.t1, fontVariant: ['tabular-nums'] }, fontFor('700')]}
        />
      </View>
    </View>
  )
}

export default PhoneField
