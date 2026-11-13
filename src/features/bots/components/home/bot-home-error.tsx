import { View } from 'react-native'
import { Button, Text } from '@/shared/components'
import { spacing } from '../../../../theme'
import { ERROR_BODY, ERROR_NOTE, ERROR_TITLE, RETRY_LABEL } from './copy'

const BotHomeError = ({ onRetry }: { onRetry: () => void }) => {
  const wrap = { paddingTop: 48, paddingHorizontal: 36, gap: spacing[2], alignItems: 'center' as const }
  const copy = { textAlign: 'center' as const }
  const button = { alignSelf: 'center' as const }
  return (
    <View accessibilityRole="alert" style={wrap}>
      <Text v="h3" weight="700" style={copy}>
        {ERROR_TITLE}
      </Text>
      <Text v="b2" color="t3" style={copy}>
        {ERROR_BODY}
        {'\n'}
        {ERROR_NOTE}
      </Text>
      <Button label={RETRY_LABEL} variant="secondary" size="sm" onPress={onRetry} style={button} />
    </View>
  )
}

export default BotHomeError
