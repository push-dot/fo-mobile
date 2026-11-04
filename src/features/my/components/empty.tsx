import { View } from 'react-native'
import { Button, Text } from '@/shared/components'

const Empty = ({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) => {
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 20 }}>
      <Text v="b2" color="t3" style={{ textAlign: 'center', paddingTop: 48, paddingBottom: action ? 0 : 48 }}>
        {text}
      </Text>
      {action && onAction ? <Button label={action} onPress={onAction} size="sm" /> : null}
    </View>
  )
}

export default Empty
