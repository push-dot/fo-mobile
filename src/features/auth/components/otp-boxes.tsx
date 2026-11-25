import { View } from 'react-native'
import { Text } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { FIELD_RADIUS, OTP_LENGTH } from '../constants'

const OtpBoxes = ({ value, active, error = false }: { value: string; active: number | null; error?: boolean }) => (
  <View style={styles.row}>
    {Array.from({ length: OTP_LENGTH }, (_, index) => (
      <View key={index} style={[styles.box, active === index && (error ? styles.boxError : styles.boxActive)]}>
        {value[index] ? (
          <Text weight="800" style={styles.digit}>
            {value[index]}
          </Text>
        ) : active === index ? (
          <View style={styles.caret} />
        ) : null}
      </View>
    ))}
  </View>
)

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing[2] },
  box: { flex: 1, height: 60, borderRadius: FIELD_RADIUS, backgroundColor: theme.colors.bg2, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  boxActive: { borderColor: theme.colors.ac },
  boxError: { borderColor: theme.colors.red },
  digit: { fontSize: 24, lineHeight: 30, fontVariant: ['tabular-nums'] },
  caret: { width: 2, height: 24, borderRadius: 1, backgroundColor: theme.colors.ac },
}))

export default OtpBoxes
