import { useLocalSearchParams } from 'expo-router'
import { ConversationScreen } from '../../features/chat/ConversationScreen'

export default function Conversation() {
  const { id } = useLocalSearchParams<{ id: string }>()
  // key: switching conversations from the drawer resets screen state.
  return <ConversationScreen key={id} id={id} />
}
