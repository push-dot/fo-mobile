import { View, type DimensionValue } from 'react-native'
import { useColors } from '../../theme'

type Props = { width: DimensionValue; height: number; radius?: number }

const Skeleton = ({ width, height, radius = 8 }: Props) => {
  const c = useColors()
  return <View style={{ width, height, borderRadius: radius, backgroundColor: c.fill2 }} />
}

export default Skeleton
