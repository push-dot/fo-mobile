import { useState } from 'react'
import { Alert, Pressable } from 'react-native'
import { updateProfile } from '@/features/my/api/fetchers'
import { queryClient } from '@/providers/query-client'
import { Text } from '@/shared/components'
import { UNDO_LABEL } from '../../utils/gate-modals'
import { undoOf } from '../../utils/profile-undo'

const UNDONE = '되돌렸어요'

/** The profile was saved at once (rule 39); 되돌리기 sends the old values back. Nothing is drawn for a line with no kept values (a reopened chat). */
const ProfileUndo = ({ id }: { id: string }) => {
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')
  const patch = undoOf(id)
  if (!patch) return null
  const run = () => {
    setState('busy')
    updateProfile(patch).then(
      (profile) => {
        queryClient.setQueryData(['me', 'profile'], profile)
        setState('done')
      },
      () => {
        setState('idle')
        Alert.alert('되돌리지 못했어요', '잠시 뒤에 다시 해 주세요.')
      },
    )
  }
  return state === 'done' ? (
    <Text v="b2" color="t3">
      {UNDONE}
    </Text>
  ) : (
    <Pressable accessibilityRole="button" accessibilityLabel={UNDO_LABEL} disabled={state === 'busy'} onPress={run} hitSlop={10} style={{ alignSelf: 'flex-start' }}>
      <Text v="b2" weight="600" color="acText">
        {UNDO_LABEL}
      </Text>
    </Pressable>
  )
}

export default ProfileUndo
