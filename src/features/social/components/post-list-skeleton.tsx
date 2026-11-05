import { Fragment } from 'react'
import { View } from 'react-native'
import { LOADING_LABEL, Skeleton } from '../../../shared/components'
import { spacing } from '../../../theme'
import { FEED_SKELETON_CARDS } from '../constants'
import Band from './band'

const PostListSkeleton = () => (
  <View accessible accessibilityRole="progressbar" accessibilityLabel={LOADING_LABEL}>
    {Array.from({ length: FEED_SKELETON_CARDS }, (_, index) => (
      <Fragment key={index}>
        <View style={{ gap: spacing[3], padding: spacing[5] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
            <Skeleton width={36} height={36} radius={18} />
            <View style={{ gap: 6 }}>
              <Skeleton width={64} height={12} />
              <Skeleton width={96} height={10} />
            </View>
          </View>
          <Skeleton width="80%" height={18} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="90%" height={14} />
          <Skeleton width={72} height={12} />
        </View>
        <Band />
      </Fragment>
    ))}
  </View>
)

export default PostListSkeleton
