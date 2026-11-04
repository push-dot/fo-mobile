import { Host, type UniversalHostProps } from '@expo/ui'
import { useColors, useThemeMode } from '../../theme'

const NativeHost = (props: UniversalHostProps) => {
  const c = useColors()
  const mode = useThemeMode()
  return <Host colorScheme={mode} seedColor={c.ac} {...props} />
}

export default NativeHost
