import { useEffect, useState } from 'react'
import { useFocusedOnce } from '@/shared/navigation'

const Hub = () => {
  const seen = useFocusedOnce()
  const [Screen, setScreen] = useState<React.ComponentType | null>(null)
  useEffect(() => {
    if (!seen || Screen) return
    void import('@/screens/hub/hub-screen').then((m) => setScreen(() => m.default))
  }, [seen, Screen])
  return Screen ? <Screen /> : null
}

export default Hub
