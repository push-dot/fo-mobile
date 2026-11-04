import { router } from 'expo-router'
import { ConversationList } from '@/features/chat'

const ConversationsScreen = () => <ConversationList onClose={() => router.back()} />

export default ConversationsScreen
