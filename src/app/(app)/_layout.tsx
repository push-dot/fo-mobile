import { useQueryClient } from '@tanstack/react-query'
import { Slot } from 'expo-router'
import { useEffect } from 'react'
import { API_MOCK } from '@/shared/infrastructure'
import { useColdStartTermsCheck } from '@/features/auth'
import { botListQuery } from '@/features/bots'
import { useHomeSnapshotSync } from '@/features/home'
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

const AppLayout = () => {
  const ready = useHomeSnapshotSync()
  useColdStartTermsCheck()
  useTabPrefetch(ready)
  if (!ready) return null
  return (
    <>
      <Slot />
      {API_MOCK ? null : <WarmWebView />}
    </>
  )
}

export default AppLayout
