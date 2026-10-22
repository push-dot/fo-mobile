import { useLocalSearchParams } from 'expo-router'
import ConversationScreen from '@/screens/chat/conversation-screen'

const Conversation = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  // key: switching conversations from the drawer resets screen state.
  return <ConversationScreen key={id} id={id} />
}

export default Conversation
