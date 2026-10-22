import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../shared/infrastructure'
import { NOTIFICATION_PAGE_LIMIT } from '../constants'

// shortcut: first 50 only (no paging); the inbox is short-lived. Page it if users keep more.
export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: () => api.me.notifications({ limit: NOTIFICATION_PAGE_LIMIT }) })

export const useUnreadCount = () => useNotifications().data?.data.filter((n) => !n.readAt).length ?? 0

export const useReadNotifications = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[] | 'all') => api.me.readNotifications(ids),
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
