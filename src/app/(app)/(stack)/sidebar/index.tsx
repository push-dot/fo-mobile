import { useLocalSearchParams } from 'expo-router'
import { ChatSidebar } from '@/features/chat'

const SidebarRoute = () => {
  const { current } = useLocalSearchParams<{ current?: string }>()
  return <ChatSidebar currentId={current} />
}

export default SidebarRoute
