import { View } from 'react-native'
import { useColors } from '../../../theme'
import { ComposerBody, type ComposerProps } from './composer-body'

/** Android: flat bg2 box, same layout. */
export const Composer = (p: ComposerProps) => {
  const c = useColors()
  return (
    <View style={{ borderRadius: 28, backgroundColor: c.bg2 }}>
      <ComposerBody {...p} />
    </View>
  )
}
