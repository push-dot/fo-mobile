import { Box, Switch as ComposeSwitch } from '@expo/ui/jetpack-compose'
import { semantics } from '@expo/ui/jetpack-compose/modifiers'
import { onAccent, spacing, useColors } from '../../theme'
import NativeHost from './native-host'

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
      >
        <ComposeSwitch.ThumbContent>
          <Box />
        </ComposeSwitch.ThumbContent>
      </ComposeSwitch>
    </NativeHost>
  )
}

export default Switch
