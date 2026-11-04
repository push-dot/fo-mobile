import { Switch as RNSwitch } from 'react-native'
import { useColors } from '../../theme'

const Switch = ({ value, onValueChange, label }: { value: boolean; onValueChange: (v: boolean) => void; label: string }) => {
  const c = useColors()
  return (
    <RNSwitch
      accessibilityLabel={label}
      value={value}
      onValueChange={onValueChange}
      trackColor={{ true: c.ac, false: c.fill2 }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={c.fill2}
    />
  )
}

export default Switch
