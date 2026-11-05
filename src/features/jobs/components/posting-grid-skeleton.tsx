import { View } from 'react-native'
import { LOADING_LABEL } from '../../../shared/components'
import { GRID_SKELETON_CARDS } from '../constants'
import PostingCardSkeleton from './posting-card-skeleton'

const PostingGridSkeleton = ({ cardWidth }: { cardWidth: number }) => (
  <View
    accessible
    accessibilityRole="progressbar"
    accessibilityLabel={LOADING_LABEL}
    style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20 }}
  >
    {Array.from({ length: GRID_SKELETON_CARDS }, (_, index) => (
      <PostingCardSkeleton key={index} width={cardWidth} />
    ))}
  </View>
)

export default PostingGridSkeleton
