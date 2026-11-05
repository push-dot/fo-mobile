import { router, useLocalSearchParams } from 'expo-router'
import { ConversationList } from '@/features/chat'

const ConversationsRoute = () => {
  const { current } = useLocalSearchParams<{ current?: string }>()
  return <ConversationList onClose={() => router.back()} currentId={current} onDeleted={current ? () => router.dismissTo('/chat') : undefined} />
}

export default ConversationsRoute
