import { View } from 'react-native'
import { Glass } from '@/shared/components'
import { radius, useColors } from '../../../theme'
import { ComposerBody, type ComposerProps } from './composer-body'

/** iOS: the chat box is flat bg2 (ChatBotHeader board; rule 18: glass is for header buttons); the comment box keeps Liquid Glass. */
export const Composer = (p: ComposerProps) => {
  const c = useColors()
  if (p.layout === 'inline')
    return (
      <Glass interactive style={{ borderRadius: radius.xl }}>
        <ComposerBody {...p} />
      </Glass>
    )
  return (
    <View style={{ borderRadius: radius.xl, backgroundColor: c.bg2 }}>
      <ComposerBody {...p} />
    </View>
  )
}
