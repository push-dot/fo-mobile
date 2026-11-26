import { useQueryClient } from '@tanstack/react-query'
import { Slot } from 'expo-router'
import { useEffect } from 'react'
import { API_MOCK, useSession } from '@/shared/infrastructure'
import { useColdStartTermsCheck } from '@/features/auth'
import { recoverPurchases } from '@/features/billing'
import { botListQuery } from '@/features/bots'
import { useHomeSnapshotSync } from '@/features/home'
import { usePushDevice } from '@/features/notifications'
import { profileListQuery, useHubFilterStore } from '@/features/hub'
import { consentsQuery, myProfileQuery, unreadOffersQuery } from '@/features/my'
import { postsQuery } from '@/features/social'
import WarmWebView from '@/shared/components/warm-web-view'

const useTabPrefetch = (ready: boolean) => {
  const qc = useQueryClient()
  useEffect(() => {
    if (!ready) return
    const { category, sheet } = useHubFilterStore.getState()
    void qc.prefetchInfiniteQuery(profileListQuery(category, sheet))
    void qc.prefetchInfiniteQuery(postsQuery(null))
    void qc.prefetchQuery(botListQuery)
    void qc.prefetchQuery(myProfileQuery)
    void qc.prefetchQuery(unreadOffersQuery)
    void qc.prefetchQuery(consentsQuery)
  }, [qc, ready])
}

const useRecoverPurchases = () => {
  const userId = useSession((s) => s.session?.user.id)
  useEffect(() => {
    if (userId) void recoverPurchases()
  }, [userId])
}

const PushDevice = () => {
  usePushDevice()
  return null
}

const AppLayout = () => {
  const ready = useHomeSnapshotSync()
  useColdStartTermsCheck()
  useTabPrefetch(ready)
  useRecoverPurchases()
  if (!ready) return null
  return (
    <>
      <Slot />
      <PushDevice />
      {API_MOCK ? null : <WarmWebView />}
    </>
  )
}

export default AppLayout
