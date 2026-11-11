import { useEffect, useState } from 'react'
import { useFocusedOnce } from '@/shared/navigation'

const Chat = () => {
  const seen = useFocusedOnce()
  const [Screen, setScreen] = useState<React.ComponentType | null>(null)
  useEffect(() => {
    if (!seen || Screen) return
    void import('@/screens/chat/chat-home-screen').then((m) => setScreen(() => m.default))
  }, [seen, Screen])
  return Screen ? <Screen /> : null
}

export default Chat
