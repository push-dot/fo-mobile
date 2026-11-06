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
      // Not opacity 0: iOS skips views under 0.01 alpha when hit-testing, so tapping the boxes could not refocus the code.
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, color: 'transparent' }}
    />
  </View>
)

export default OtpCells
