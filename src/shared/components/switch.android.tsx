import { Switch as ComposeSwitch } from '@expo/ui/jetpack-compose'
import { semantics } from '@expo/ui/jetpack-compose/modifiers'
import { onAccent, spacing, useColors } from '../../theme'
import NativeHost from './native-host'

/** Android: Material 3 switch. iOS keeps RN Switch, which is UISwitch. */
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
  // M3 pads the 32dp switch to a 48dp touch target; the negative margin keeps the target but lays out 32dp
  return (
    <NativeHost matchContents style={{ marginVertical: -spacing[2] }}>
      <ComposeSwitch
        value={value}
        onCheckedChange={onValueChange}
        colors={{
          checkedTrackColor: c.ac,
          checkedThumbColor: onAccent,
          uncheckedTrackColor: c.fill2,
          uncheckedThumbColor: onAccent,
          uncheckedBorderColor: c.fill2,
        }}
        modifiers={[semantics({ contentDescription: label })]}
      />
    </NativeHost>
  )
}

export default Switch
