import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { remainingSeconds, showAppleButton } from './utils/auth-flow'

export const useCountdown = (endsAt: number | null) => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (endsAt == null) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [endsAt])
  if (endsAt == null) return 0
  return remainingSeconds(endsAt, now)
}

export const useAppleSignIn = () => {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    if (Platform.OS !== 'ios') return
    let live = true
    void import('expo-apple-authentication')
      .then(async (mod) => {
        const ok = await mod.isAvailableAsync()
        if (live) setAvailable(ok)
      })
      .catch(() => undefined)
    return () => {
      live = false
    }
  }, [])
  return showAppleButton(Platform.OS, available)
}
