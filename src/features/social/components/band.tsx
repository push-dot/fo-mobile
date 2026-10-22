import { View } from 'react-native'
import { useColors } from '../../../theme'

const Band = ({ style }: { style?: object }) => {
  const c = useColors()
  return <View style={[{ height: 10, backgroundColor: c.bg2 }, style]} />
}

export default Band
