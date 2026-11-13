import { View } from 'react-native'
import { Button, Text } from '@/shared/components'
import { radius, spacing } from '../../../../theme'
import { EMPTY_ACTION, EMPTY_BODY, EMPTY_TITLE } from './copy'

const BotHomeEmpty = ({ onCreate }: { onCreate: () => void }) => {
  const wrap = { paddingTop: 56, paddingHorizontal: 32, gap: spacing[2], alignItems: 'center' as const }
  const copy = { textAlign: 'center' as const }
  const button = { alignSelf: 'center' as const, marginTop: spacing[4], minHeight: 48, borderRadius: radius.confirmPanelTop, paddingHorizontal: spacing[1] }
  return (
    <View style={wrap}>
      <Text v="b1" weight="700" style={copy}>
        {EMPTY_TITLE}
      </Text>
      <Text v="c1" color="t3" style={copy}>
        {EMPTY_BODY}
      </Text>
      <Button label={EMPTY_ACTION} variant="primary" size="lg" onPress={onCreate} style={button} />
    </View>
  )
}

export default BotHomeEmpty
