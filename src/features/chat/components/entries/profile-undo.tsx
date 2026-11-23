import { useMutation, useQuery } from '@tanstack/react-query'
import { Alert, Pressable } from 'react-native'
import { ApiError } from '@push/api-client'
import { fetchProfileChange, undoProfileChange } from '@/features/my/api/fetchers'
import { queryClient } from '@/providers/query-client'
import { Text } from '@/shared/components'
import { UNDO_LABEL } from '../../constants'

const UNDONE = '되돌렸어요'

/** The profile was saved at once (rule 39). The server keeps the old values under the change id, so 되돌리기 works after the chat is reopened and on another device; it can run once. */
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
      // 409: another screen or device already put it back.
      if (error instanceof ApiError && error.status === 409) {
        void queryClient.invalidateQueries({ queryKey: key })
        return void queryClient.invalidateQueries({ queryKey: ['me', 'profile'] })
      }
      Alert.alert('되돌리지 못했어요', '잠시 뒤에 다시 해 주세요.')
    },
  })
  // Only a change that is not the caller's is hidden; a failed read (offline) still lets the person try.
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
