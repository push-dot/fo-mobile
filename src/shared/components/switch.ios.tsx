import { Switch as RNSwitch } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { onAccent, useColors } from '../../theme'

const Switch = ({
  value,
  onValueChange,
  label,
}: {
  value: boolean
  onValueChange: (v: boolean) => void
  label: string
}) => {
  const c = useColors()
  return (
    <RNSwitch
      style={styles.switch}
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: c.ac, false: c.fill2 }}
      thumbColor={onAccent}
      ios_backgroundColor={c.fill2}
    />
  )
}

const styles = StyleSheet.create(() => ({
  switch: { alignSelf: 'center' },
}))

export default Switch
