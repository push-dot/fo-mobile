import { router, useLocalSearchParams } from 'expo-router'
import { BotColorSheet, useBot, type BotAddress } from '@/features/bots'

const BotColorSheetScreen = () => {
  const { botId } = useLocalSearchParams<{ botId: string }>()
  const address = (typeof botId === 'string' ? botId : 'push') as BotAddress
  const { data } = useBot(address)
  if (!data || data.kind !== 'company') return null
  return <BotColorSheet bot={data} onClose={() => router.back()} />
}

export default BotColorSheetScreen
