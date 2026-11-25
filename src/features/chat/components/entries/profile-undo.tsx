import { Pressable } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import { useProfileUndo } from '../../api/hooks'
import { UNDO_LABEL } from '../../constants'

const UNDONE = '되돌렸어요'

const ProfileUndo = ({ changeId }: { changeId: string }) => {
  const { gone, done, pending, undo } = useProfileUndo(changeId)
  if (gone) return null
  return done ? (
    <Text v="b2" color="t3">
      {UNDONE}
    </Text>
  ) : (
    <Pressable accessibilityRole="button" accessibilityLabel={UNDO_LABEL} disabled={pending} onPress={undo} hitSlop={10} style={styles.undo}>
      <Text v="b2" weight="600" color="acText">
        {UNDO_LABEL}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  undo: { alignSelf: 'flex-start' },
})

export default ProfileUndo
