import { View } from 'react-native'
import { Skeleton } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { radius } from '../../../theme'
import { CARD_RADIUS } from '../constants'

const PostingCardSkeleton = ({ width }: { width: number }) => (
  <View style={styles.card(width)}>
    <View style={styles.head}>
      <Skeleton width={32} height={32} />
      <Skeleton width={72} height={12} />
    </View>
    <Skeleton width="100%" height={16} />
    <Skeleton width="70%" height={16} />
    <Skeleton width="50%" height={12} />
    <View style={styles.foot}>
      <Skeleton width={64} height={16} />
      <Skeleton width={40} height={20} radius={radius.xs} />
    </View>
  </View>
)

const styles = StyleSheet.create((theme) => ({
  card: (width: number) => ({ width, gap: theme.spacing[3], padding: theme.spacing[4], borderRadius: CARD_RADIUS, backgroundColor: theme.colors.bg2 }),
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  foot: { flexDirection: 'row', justifyContent: 'space-between' },
}))

export default PostingCardSkeleton
