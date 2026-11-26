import { router, useLocalSearchParams } from 'expo-router'
import { BotColorSheet, botAddressParam, useBot } from '@/features/bots'

const BotColorSheetScreen = () => {
  const { botId } = useLocalSearchParams<{ botId: string }>()
  const address = botAddressParam(botId)
  const { data } = useBot(address)
  if (!data || data.kind !== 'company') return null
  return <BotColorSheet bot={data} onClose={() => router.back()} />
}

export default BotColorSheetScreen
