import ChatHomeScreen from '@/screens/chat/chat-home-screen'
import { useFocusedOnce } from '@/shared/navigation'

const Chat = () => (useFocusedOnce() ? <ChatHomeScreen /> : null)

export default Chat
