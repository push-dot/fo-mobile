import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { countUnread } from '@/features/home'
import { usePushDevice } from '../hooks'
import { fetchNotifications, readNotifications } from './fetchers'

export const useNotifications = () =>
  useQuery({ queryKey: ['notifications'], queryFn: fetchNotifications })

export const useUnreadCount = () => {
  usePushDevice()
  return countUnread(useNotifications().data)
}

export const useReadNotifications = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: readNotifications,
    onSettled: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })
}
