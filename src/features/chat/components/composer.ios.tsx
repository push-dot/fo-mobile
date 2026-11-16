import { View } from 'react-native'
import { radius, useColors } from '../../../theme'
import { ComposerBody, type ComposerProps } from './composer-body'

/** iOS: the post comment box is a flat bg2 box (PostDetail board); the chat composer is one row of its own controls (rule 18: glass is for the input and header buttons). */
export const Composer = (p: ComposerProps) => {
  const c = useColors()
  return p.layout === 'inline' ? (
    <View style={{ borderRadius: radius.xl, backgroundColor: c.bg2 }}>
      <ComposerBody {...p} />
    </View>
  ) : (
    <ComposerBody {...p} />
  )
}
