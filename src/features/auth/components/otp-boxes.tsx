import { View } from 'react-native'
import { Text } from '../../../shared/components'
import { spacing, useColors } from '../../../theme'
import { FIELD_RADIUS, OTP_LENGTH } from '../constants'

const OtpBoxes = ({ value, active, error = false }: { value: string; active: number | null; error?: boolean }) => {
  const c = useColors()
  return (
    <View style={{ flexDirection: 'row', gap: spacing[2] }}>
      {Array.from({ length: OTP_LENGTH }, (_, index) => (
        <View
          key={index}
          style={{ flex: 1, height: 60, borderRadius: FIELD_RADIUS, backgroundColor: c.bg2, borderWidth: 2, borderColor: active === index ? (error ? c.red : c.ac) : 'transparent', alignItems: 'center', justifyContent: 'center' }}
        >
          {value[index] ? (
            <Text weight="800" style={{ fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] }}>
              {value[index]}
            </Text>
          ) : active === index ? (
            <View style={{ width: 2, height: 24, borderRadius: 1, backgroundColor: c.ac }} />
          ) : null}
        </View>
      ))}
    </View>
  )
}

export default OtpBoxes
