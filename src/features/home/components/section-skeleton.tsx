import { View } from 'react-native'
import { PostingCardSkeleton } from '@/features/jobs'
import { LOADING_LABEL, Skeleton } from '../../../shared/components'
import { SECTION_SKELETON_CARDS, SECTION_SKELETON_CARD_WIDTH } from '../constants'
import { spacing } from '../../../theme'

const SectionSkeleton = () => (
  <View accessible accessibilityRole="progressbar" accessibilityLabel={LOADING_LABEL}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[5], paddingTop: spacing[6], paddingBottom: spacing[3] }}>
      <Skeleton width={140} height={20} />
      <Skeleton width={48} height={12} />
    </View>
    <View style={{ flexDirection: 'row', gap: spacing[3], paddingHorizontal: spacing[5], overflow: 'hidden' }}>
      {Array.from({ length: SECTION_SKELETON_CARDS }, (_, index) => (
        <PostingCardSkeleton key={index} width={SECTION_SKELETON_CARD_WIDTH} />
      ))}
    </View>
  </View>
)

export default SectionSkeleton
