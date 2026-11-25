import { View } from 'react-native'
import { LOADING_LABEL } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { GRID_SKELETON_CARDS } from '../constants'
import PostingCardSkeleton from './posting-card-skeleton'

const PostingGridSkeleton = ({ cardWidth }: { cardWidth: number }) => (
  <View accessible accessibilityRole="progressbar" accessibilityLabel={LOADING_LABEL} style={styles.grid}>
    {Array.from({ length: GRID_SKELETON_CARDS }, (_, index) => (
      <PostingCardSkeleton key={index} width={cardWidth} />
    ))}
  </View>
)

const styles = StyleSheet.create((theme) => ({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[3], paddingHorizontal: theme.spacing[5] },
}))

export default PostingGridSkeleton
