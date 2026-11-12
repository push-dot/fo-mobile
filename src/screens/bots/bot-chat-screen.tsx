import { useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { useBot, type BotAddress } from '@/features/bots'
import { Text } from '@/shared/components'
import { spacing } from '@/theme'

const PLACEHOLDER = '공고 링크를 붙여넣어 보세요'

const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

const BotChatScreen = () => {
  const id = param(useLocalSearchParams<{ botId?: string }>().botId)
  const { data } = useBot((id ?? 'push') as BotAddress)
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing[2] }}>
      {data?.name ? (
        <Text weight="800" accessibilityRole="header">
          {data.name}
        </Text>
      ) : null}
      <Text color="t3">{PLACEHOLDER}</Text>
    </View>
  )
}

export default BotChatScreen
