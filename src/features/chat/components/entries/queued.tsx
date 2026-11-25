import { StyleSheet } from 'react-native-unistyles'
import { Icon, Text } from '@/shared/components'
import Appear from '../motion'
import { useBubbleMax } from './user'

const Queued = ({ text }: { text: string }) => {
  const maxWidth = useBubbleMax(27)
  return (
    <Appear
      kind="bubble"
      style={styles.queued(maxWidth)}
    >
      <Icon name="clock" size={16} color="t2" />
      <Text v="c1" color="t2" style={[styles.small, styles.shrink]}>
        {text}
      </Text>
    </Appear>
  )
}

const styles = StyleSheet.create((theme) => ({
  small: { fontSize: 14, lineHeight: 20 },
  shrink: { flexShrink: 1 },
  queued: (maxWidth: number) => ({ alignSelf: 'flex-end', maxWidth, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: theme.spacing[2], paddingHorizontal: theme.spacing[3], borderRadius: 14, backgroundColor: theme.colors.fill }),
}))

export default Queued
