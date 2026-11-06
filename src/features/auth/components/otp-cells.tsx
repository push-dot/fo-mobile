import { TextInput, View } from 'react-native'
import { OTP_LENGTH } from '../constants'
import OtpBoxes from './otp-boxes'

const OtpCells = ({ value, onChange, error }: { value: string; onChange: (next: string) => void; error?: boolean }) => (
  <View style={{ position: 'relative' }}>
    <OtpBoxes value={value} active={value.length < OTP_LENGTH ? value.length : null} error={error} />
    <TextInput
      accessibilityLabel="인증번호"
      value={value}
      onChangeText={(next) => onChange(next.replace(/\D/g, '').slice(0, OTP_LENGTH))}
      keyboardType="number-pad"
      textContentType="oneTimeCode"
      autoComplete="sms-otp"
      maxLength={OTP_LENGTH}
      autoFocus
      caretHidden
      contextMenuHidden
      // Android draws a transparent text color in its default ink, so opacity hides it too; above 0.01 so iOS still hit-tests it and TalkBack and autofill still see it.
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, color: 'transparent', opacity: 0.02 }}
    />
  </View>
)

export default OtpCells
