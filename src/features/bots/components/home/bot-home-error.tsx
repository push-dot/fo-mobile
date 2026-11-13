import { View } from 'react-native'
import { Button, Text } from '@/shared/components'
import { spacing, type } from '../../../../theme'
import { ERROR_BODY, ERROR_NOTE, ERROR_TITLE, RETRY_LABEL } from './copy'

const BotHomeError = ({ onRetry }: { onRetry: () => void }) => {
  const wrap = { paddingHorizontal: 32, paddingTop: 28, gap: spacing[2] }
  const title = { fontSize: type.h3.fontSize, lineHeight: type.h3.lineHeight }
  const body = { fontSize: 14, lineHeight: 20 }
  return (
    <View style={wrap}>
      <Text weight="700" style={title}>
        {ERROR_TITLE}
      </Text>
      <Text color="t3" style={body}>
        {ERROR_BODY}
      </Text>
      <Text color="t3" style={body}>
        {ERROR_NOTE}
      </Text>
      <Button label={RETRY_LABEL} size="md" onPress={onRetry} />
    </View>
  )
}

export default BotHomeError
