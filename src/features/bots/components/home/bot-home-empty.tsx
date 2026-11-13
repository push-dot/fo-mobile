import { View } from 'react-native'
import { Button, Text } from '@/shared/components'
import { spacing, type } from '../../../../theme'
import { EMPTY_ACTION, EMPTY_BODY, EMPTY_TITLE } from './copy'

const BotHomeEmpty = ({ onCreate }: { onCreate: () => void }) => {
  const wrap = { paddingHorizontal: 32, paddingTop: 28, gap: spacing[2] }
  const title = { fontSize: type.h3.fontSize, lineHeight: type.h3.lineHeight }
  const body = { fontSize: 14, lineHeight: 20 }
  return (
    <View style={wrap}>
      <Text weight="700" style={title}>
        {EMPTY_TITLE}
      </Text>
      <Text color="t3" style={body}>
        {EMPTY_BODY}
      </Text>
      <Button label={EMPTY_ACTION} size="md" onPress={onCreate} />
    </View>
  )
}

export default BotHomeEmpty
