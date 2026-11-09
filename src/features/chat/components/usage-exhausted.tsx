import { View } from 'react-native'
import { Button, Icon, Text } from '@/shared/components'
import { paymentsOpen } from '@/features/billing'
import { radius, spacing, useColors } from '../../../theme'
import { useChatAccount } from '../api/hooks'
import { usageExhausted } from '../utils/usage'
import { Appear } from './motion'


export const UsageExhausted = ({ onPlan, onCredits }: { onPlan: () => void; onCredits: () => void }) => {
  const c = useColors()
  const account = useChatAccount(true)
  const u = usageExhausted(account.data?.plan, paymentsOpen(account.data))
  return (
    <Appear style={{ gap: spacing[4], padding: spacing[5], borderRadius: radius.card, backgroundColor: c.bg2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
        <View style={{ width: 36, height: 36, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: c.orangeSoft }}>
          <Icon name="credit" size={20} color="orange" />
        </View>
        <Text v="b1" weight="700" style={{ flex: 1, paddingTop: spacing[2] }}>
          {u.body}
        </Text>
      </View>
      {u.actions.length ? (
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          {u.actions.map((a) => (
            <View key={a.id} style={{ flex: 1 }}>
              <Button variant={a.variant} label={a.label} onPress={a.id === 'plan' ? onPlan : onCredits} />
            </View>
          ))}
        </View>
      ) : null}
    </Appear>
  )
}
