import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppNotification, ListEnvelope } from '@push/api-client'
import { countUnread, useSeededUnread } from '@/features/home'
import { fetchNotifications, readNotifications } from './fetchers'

export const useNotifications = () =>
  useQuery({ queryKey: NOTIFICATIONS_KEY, queryFn: fetchNotifications })

export const useUnreadCount = () => {
  const { data } = useNotifications()
  const seeded = useSeededUnread()
  return data ? countUnread(data) : seeded
}

const NOTIFICATIONS_KEY = ['notifications']

export const useReadNotifications = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: readNotifications,
    onMutate: async (ids: string[] | 'all') => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_KEY })
      const prev = qc.getQueryData<ListEnvelope<AppNotification>>(NOTIFICATIONS_KEY)
      if (prev) {
        const readAt = new Date().toISOString()
        const hit = (n: AppNotification) => !n.readAt && (ids === 'all' || ids.includes(n.id))
        qc.setQueryData(NOTIFICATIONS_KEY, { ...prev, data: prev.data.map((n) => (hit(n) ? { ...n, readAt } : n)) })
      }
      return prev
    },
    onError: (_e, _ids, prev) => {
      if (prev) qc.setQueryData(NOTIFICATIONS_KEY, prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}
