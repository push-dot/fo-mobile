import { Switch as ComposeSwitch } from '@expo/ui/jetpack-compose'
import { semantics } from '@expo/ui/jetpack-compose/modifiers'
import { onAccent, useColors } from '../../theme'
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
  return (
    <NativeHost matchContents>
      <ComposeSwitch
        value={value}
        onCheckedChange={onValueChange}
        colors={{
          checkedTrackColor: c.ac,
          checkedThumbColor: onAccent,
          uncheckedTrackColor: c.fill2,
          uncheckedThumbColor: c.t3,
          uncheckedBorderColor: c.t3,
        }}
        modifiers={[semantics({ contentDescription: label })]}
      />
    </NativeHost>
  )
}

export default Switch
