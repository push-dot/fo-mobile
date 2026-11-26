import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { countUnread, useSeededUnread } from '@/features/home'
import { fetchNotifications, readNotifications } from './fetchers'

export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications })

export const useUnreadCount = () => {
  const { data } = useNotifications()
  const seeded = useSeededUnread()
  return data ? countUnread(data) : seeded
}

export const useReadNotifications = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: readNotifications,
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
