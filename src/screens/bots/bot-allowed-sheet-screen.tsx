import { router, useLocalSearchParams } from 'expo-router'
import { BotAllowedSheet, type BotAddress } from '@/features/bots'

const BotAllowedSheetScreen = () => {
  const { botId } = useLocalSearchParams<{ botId: string }>()
  const address = (typeof botId === 'string' ? botId : 'push') as BotAddress
  return <BotAllowedSheet address={address} onClose={() => router.back()} />
}

export default BotAllowedSheetScreen
