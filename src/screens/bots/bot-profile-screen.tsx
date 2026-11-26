import { useLocalSearchParams } from 'expo-router'
import { BotProfileView, botAddressParam } from '@/features/bots'

const BotProfileScreen = () => {
  const { botId } = useLocalSearchParams<{ botId: string }>()
  const address = botAddressParam(botId)
  return <BotProfileView address={address} />
}

export default BotProfileScreen
