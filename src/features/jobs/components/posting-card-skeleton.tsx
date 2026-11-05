import { View } from 'react-native'
import { Skeleton } from '../../../shared/components'
import { useColors } from '../../../theme'
import { CARD_RADIUS } from '../constants'

const PostingCardSkeleton = ({ width }: { width: number }) => {
  const c = useColors()
  return (
    <View style={{ width, gap: 12, padding: 16, borderRadius: CARD_RADIUS, backgroundColor: c.bg2 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Skeleton width={32} height={32} />
        <Skeleton width={72} height={12} />
      </View>
      <Skeleton width="100%" height={16} />
      <Skeleton width="70%" height={16} />
      <Skeleton width="50%" height={12} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width={64} height={16} />
        <Skeleton width={40} height={20} radius={6} />
      </View>
    </View>
  )
}

export default PostingCardSkeleton
