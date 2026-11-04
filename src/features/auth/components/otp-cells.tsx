import { TextInput, View } from 'react-native'
import { radius, useColors } from '../../../theme'
import { Text } from '../../../shared/components'

const CELLS = [0, 1, 2, 3, 4, 5]

const OtpCells = ({ value, onChange }: { value: string; onChange: (next: string) => void }) => {
  const c = useColors()
  return (
    <View style={{ position: 'relative' }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {CELLS.map((index) => (
          <View
            key={index}
            style={{
              flex: 1,
              height: 56,
              borderRadius: radius.sm,
              backgroundColor: c.fill,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: value.length === index ? 1.5 : 0,
              borderColor: c.ac,
            }}
          >
            <Text v="h2">{value[index] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        accessibilityLabel="인증번호"
        value={value}
        onChangeText={(next) => onChange(next.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={6}
        autoFocus
        style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, opacity: 0 }}
      />
    </View>
  )
}

export default OtpCells
