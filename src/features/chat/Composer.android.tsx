import { View } from 'react-native'
import { useColors } from '../../theme'
import { ComposerBody, type ComposerProps } from './ComposerBody'

/** Android: flat bg2 box, same layout. */
export function Composer(p: ComposerProps) {
  const c = useColors()
  return (
    <View style={{ borderRadius: 28, backgroundColor: c.bg2 }}>
      <ComposerBody {...p} />
    </View>
  )
}
