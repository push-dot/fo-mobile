import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AppNotification } from '@push/api-client'
import { countUnread, NOTIFICATIONS_KEY, useSeededUnread } from '@/features/home'
import { fetchNotifications, readNotifications } from './fetchers'

export const notificationsQuery = queryOptions({ queryKey: NOTIFICATIONS_KEY, queryFn: fetchNotifications })

export const useNotifications = () => useQuery(notificationsQuery)

export const useUnreadCount = () => {
  const { data } = useNotifications()
  const seeded = useSeededUnread()
  return data ? countUnread(data) : seeded
}

export const useReadNotifications = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: readNotifications,
    onMutate: async (ids: string[] | 'all') => {
      await qc.cancelQueries({ queryKey: NOTIFICATIONS_KEY })
      const prev = qc.getQueryData(notificationsQuery.queryKey)
      if (prev) {
        const readAt = new Date().toISOString()
        const hit = (n: AppNotification) => !n.readAt && (ids === 'all' || ids.includes(n.id))
        qc.setQueryData(notificationsQuery.queryKey, { ...prev, data: prev.data.map((n) => (hit(n) ? { ...n, readAt } : n)) })
      }
      return prev
    },
    onError: (_e, _ids, prev) => {
      if (prev) qc.setQueryData(notificationsQuery.queryKey, prev)
    },
    onSettled: () => qc.invalidateQueries({ queryKey: NOTIFICATIONS_KEY }),
  })
}
