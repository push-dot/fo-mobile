import { useState } from 'react'
import { TextInput, View } from 'react-native'
import { Icon, Text } from '../../../shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { StyleSheet } from 'react-native-unistyles'
import { fontFor, useColors } from '../../../theme'
import { COUNTRY_CODE, COUNTRY_CODE_LABEL, FIELD_RADIUS } from '../constants'
import { softPad } from '../utils/soft-pad'

const PhoneField = ({ value, onChange }: { value: string; onChange: (next: string) => void }) => {
  const c = useColors()
  const [focused, setFocused] = useState(false)
  return (
    <View style={styles.row}>
      <View
        accessible
        accessibilityLabel={COUNTRY_CODE_LABEL}
        style={styles.country}
      >
        <Text v="b1" weight="700">
          {COUNTRY_CODE}
        </Text>
        <Icon name="down" size={16} color="t3" />
      </View>
      <View
        style={[styles.field, focused && styles.fieldFocused]}
      >
        <TextInput
          autoFocus
          showSoftInputOnFocus={softPad.shown}
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
          style={styles.input}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing[2] },
  country: { height: 56, paddingHorizontal: theme.spacing[4], borderRadius: FIELD_RADIUS, backgroundColor: theme.colors.bg2, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] },
  field: { flex: 1, height: 56, paddingHorizontal: 14, borderRadius: FIELD_RADIUS, backgroundColor: theme.colors.bg2, borderWidth: 2, borderColor: 'transparent', justifyContent: 'center' },
  fieldFocused: { borderColor: theme.colors.ac },
  input: { ...inputReset, fontSize: 19, letterSpacing: 0.4, color: theme.colors.t1, fontVariant: ['tabular-nums'], ...fontFor('700') },
}))

export default PhoneField
