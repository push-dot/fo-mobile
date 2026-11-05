import { View } from 'react-native'
import { Button, Text } from '@/shared/components'
import { spacing } from '../../../theme'

const Empty = ({ text, action, onAction }: { text: string; action?: string; onAction?: () => void }) => {
  return (
    <View style={{ flexGrow: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingHorizontal: 40, paddingBottom: 140 }}>
      <Text v="b1" weight="700" color="t2" style={{ textAlign: 'center' }}>
        {text}
      </Text>
      {action && onAction ? (
        <Button label={action} onPress={onAction} variant="secondary" size="pill" style={{ marginTop: spacing[3] }} />
      ) : null}
    </View>
  )
}

export default Empty
