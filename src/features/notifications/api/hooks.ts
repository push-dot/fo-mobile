import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { countUnread } from '@/features/home/snapshot/dto'
import { fetchNotifications, readNotifications } from './fetchers'

// shortcut: first 50 only (no paging); the inbox is short-lived. Page it if users keep more.
export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications })

export const useUnreadCount = () => countUnread(useNotifications().data)

export const useReadNotifications = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: readNotifications,
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
