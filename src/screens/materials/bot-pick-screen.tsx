import { useLocalSearchParams } from 'expo-router'
import { SendBotPage, isMaterialKind } from '@/features/materials'

const BotPickScreen = () => {
  const { kind, id } = useLocalSearchParams<{ kind: string; id: string }>()
  return isMaterialKind(kind) && typeof id === 'string' ? <SendBotPage kind={kind} id={id} /> : null
}

export default BotPickScreen
