import { useLocalSearchParams } from 'expo-router'
import { SendBotSheet, isMaterialKind } from '@/features/materials'

const BotPickSheetScreen = () => {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>()
  return isMaterialKind(kind) && typeof id === 'string' ? <SendBotSheet kind={kind} id={id} /> : null
}

export default BotPickSheetScreen
