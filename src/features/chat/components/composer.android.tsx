import { View } from 'react-native'
import { radius, useColors } from '../../../theme'
import { ComposerBody, type ComposerProps } from './composer-body'

/** Android: the post comment box is a flat fill box (PostDetail board `.cbox`); the chat composer is one row of its own controls. */
export const Composer = (p: ComposerProps) => {
  const c = useColors()
  return p.layout === 'inline' ? (
    <View style={{ borderRadius: radius.xl, backgroundColor: c.fill }}>
      <ComposerBody {...p} />
    </View>
  ) : (
    <ComposerBody {...p} />
  )
}
