import { useEffect, useState } from 'react'
import { useFocusedOnce } from '@/shared/navigation'

const loadScreen = () => import('@/screens/my/my-screen')

const My = () => {
  const seen = useFocusedOnce()
  const [Screen, setScreen] = useState<React.ComponentType | null>(null)
  useEffect(() => {
    void loadScreen().then((m) => setScreen(() => m.default))
  }, [])
  return seen && Screen ? <Screen /> : null
}

export default My
