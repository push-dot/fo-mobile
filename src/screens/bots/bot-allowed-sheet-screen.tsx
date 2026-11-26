import { router, useLocalSearchParams } from 'expo-router'
import { BotAllowedSheet, botAddressParam } from '@/features/bots'

const BotAllowedSheetScreen = () => {
  const { botId } = useLocalSearchParams<{ botId: string }>()
  const address = botAddressParam(botId)
  return <BotAllowedSheet address={address} onClose={() => router.back()} />
}

export default BotAllowedSheetScreen
