import { useLocalSearchParams } from 'expo-router'
import { BotProfileView, type BotAddress } from '@/features/bots'

const BotProfileScreen = () => {
  const { botId } = useLocalSearchParams<{ botId: string }>()
  const address = (typeof botId === 'string' ? botId : 'push') as BotAddress
  return <BotProfileView address={address} />
}

export default BotProfileScreen
