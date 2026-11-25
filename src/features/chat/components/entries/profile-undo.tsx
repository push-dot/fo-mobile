import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Pressable } from 'react-native'
import { ApiError } from '@push/api-client'
import { fetchProfileChange, undoProfileChange } from '@/features/my/api/fetchers'
import { queryClient } from '@/providers/query-client'
import { Text } from '@/shared/components'
import { UNDO_LABEL } from '../../constants'

const UNDONE = '되돌렸어요'

const ProfileUndo = ({ changeId }: { changeId: string }) => {
  const key = ['me', 'profile-change', changeId]
  const change = useQuery({ queryKey: key, queryFn: () => fetchProfileChange(changeId), retry: false })
  const undo = useMutation({
    mutationFn: () => undoProfileChange(changeId),
    onSuccess: (profile) => {
      queryClient.setQueryData(['me', 'profile'], profile)
      void queryClient.invalidateQueries({ queryKey: key })
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: key })
        return void queryClient.invalidateQueries({ queryKey: ['me', 'profile'] })
      }
      Alert.alert('되돌리지 못했어요', '잠시 뒤에 다시 해 주세요.')
    },
  })
  if (change.error instanceof ApiError && change.error.status === 404 && !undo.isSuccess) return null
  return change.data?.undone || undo.isSuccess ? (
    <Text v="b2" color="t3">
      {UNDONE}
    </Text>
  ) : (
    <Pressable accessibilityRole="button" accessibilityLabel={UNDO_LABEL} disabled={undo.isPending} onPress={() => undo.mutate()} hitSlop={10} style={{ alignSelf: 'flex-start' }}>
      <Text v="b2" weight="600" color="acText">
        {UNDO_LABEL}
      </Text>
    </Pressable>
  )
}

export default ProfileUndo
