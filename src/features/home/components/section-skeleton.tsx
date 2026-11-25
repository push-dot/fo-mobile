import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { PostingCardSkeleton } from '@/features/jobs'
import { LOADING_LABEL, Skeleton } from '../../../shared/components'
import { SECTION_SKELETON_CARDS, SECTION_SKELETON_CARD_WIDTH } from '../constants'

const SectionSkeleton = () => (
  <View accessible accessibilityRole="progressbar" accessibilityLabel={LOADING_LABEL}>
    <View style={styles.head}>
      <Skeleton width={140} height={20} />
      <Skeleton width={48} height={12} />
    </View>
    <View style={styles.cards}>
      {Array.from({ length: SECTION_SKELETON_CARDS }, (_, index) => (
        <PostingCardSkeleton key={index} width={SECTION_SKELETON_CARD_WIDTH} />
      ))}
    </View>
  </View>
)

const styles = StyleSheet.create((theme) => ({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[5],
    paddingTop: theme.spacing[6],
    paddingBottom: theme.spacing[3],
  },
  cards: { flexDirection: 'row', gap: theme.spacing[3], paddingHorizontal: theme.spacing[5], overflow: 'hidden' },
}))

export default SectionSkeleton
