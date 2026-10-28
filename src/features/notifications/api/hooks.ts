import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchNotifications, readNotifications } from './fetchers'

// shortcut: first 50 only (no paging); the inbox is short-lived. Page it if users keep more.
export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications })

export const useUnreadCount = () => useNotifications().data?.data.filter((n) => !n.readAt).length ?? 0

export const useReadNotifications = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: readNotifications,
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
