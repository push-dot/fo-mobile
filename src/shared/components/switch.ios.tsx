import { Switch as RNSwitch } from 'react-native'
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
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: c.ac, false: c.fill2 }}
      thumbColor={onAccent}
      ios_backgroundColor={c.fill2}
    />
  )
}

export default Switch
