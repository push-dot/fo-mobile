import { SkeletonRows } from '@/shared/components'
import { radius } from '../../../theme'

const LINES = [
  { width: '60%', height: 16 },
  { width: '40%', height: 12 },
] as const

const ListSkeleton = ({ count = 5 }: { count?: number }) => (
  <SkeletonRows count={count} lead={{ size: 48, radius: radius.md }} lines={LINES} />
)

export default ListSkeleton
