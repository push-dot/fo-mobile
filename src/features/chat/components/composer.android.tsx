import { View } from 'react-native'
import { radius, useColors } from '../../../theme'
import { ComposerBody, type ComposerProps } from './composer-body'

/** Android: flat box, same layout: bg2 for the chat box, fill for the post comment box (PostDetail board `.cbox`). */
export const Composer = (p: ComposerProps) => {
  const c = useColors()
  return (
    <View style={{ borderRadius: radius.xl, backgroundColor: p.layout === 'inline' ? c.fill : c.bg2 }}>
      <ComposerBody {...p} />
    </View>
  )
}
