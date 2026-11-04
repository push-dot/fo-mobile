import { View } from 'react-native'
import { Button, Text } from '@/shared/components'
import { useChatAccount } from '../api/hooks'
import { usageExhausted } from '../utils/usage'
import { Appear } from './motion'

export const UsageExhausted = ({ onPlan, onCredits }: { onPlan: () => void; onCredits: () => void }) => {
  const account = useChatAccount(true)
  const u = usageExhausted(account.data?.plan ?? 'FREE')
  return (
    <Appear style={{ gap: 10 }}>
      <Text v="b2">{u.body}</Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {u.actions.map((label) => (
          <Button
            key={label}
            style={{ flex: 1 }}
            size="sm"
            variant={label === '크레딧 구매' && u.actions.length > 1 ? 'secondary' : 'primary'}
            label={label}
            onPress={label === '요금제 올리기' ? onPlan : onCredits}
          />
        ))}
      </View>
    </Appear>
  )
}
