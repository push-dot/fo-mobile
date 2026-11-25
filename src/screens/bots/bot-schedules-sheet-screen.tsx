import { useLocalSearchParams } from 'expo-router'
import { BotSchedulesSheet, type BotId } from '@/features/bots'

const BotSchedulesSheetScreen = () => {
  const { botId } = useLocalSearchParams<{ botId: string }>()
  return <BotSchedulesSheet botId={botId as BotId} />
}

export default BotSchedulesSheetScreen
