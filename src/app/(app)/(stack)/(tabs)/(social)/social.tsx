import { useEffect, useState } from 'react'
import { useFocusedOnce } from '@/shared/navigation'

const loadScreen = () => import('@/screens/social/social-screen')

const Social = () => {
  const seen = useFocusedOnce()
  const [Screen, setScreen] = useState<React.ComponentType | null>(null)
  useEffect(() => {
    if (!seen || Screen) return
    void loadScreen().then((m) => setScreen(() => m.default))
  }, [seen, Screen])
  return Screen ? <Screen /> : null
}

export default Social
