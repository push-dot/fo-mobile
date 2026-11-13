import { View } from 'react-native'
import { radius, useColors } from '../../../theme'
import { ComposerBody, type ComposerProps } from './composer-body'

/** iOS: the chat box and the post comment box are flat bg2 with no shadow (ChatBotHeader, PostDetail boards; rule 18: glass is for header buttons). */
export const Composer = (p: ComposerProps) => {
  const c = useColors()
  return (
    <View style={{ borderRadius: radius.xl, backgroundColor: c.bg2 }}>
      <ComposerBody {...p} />
    </View>
  )
}
