import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native'
import { spacing } from '../../theme'
import Text from './text'

export const LOADING_LABEL = '불러오는 중'

const LoadingNote = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  return (
    <View style={[{ alignItems: 'center', gap: spacing[2] }, style]}>
      <ActivityIndicator />
      <Text v="b2" color="t2">
        {LOADING_LABEL}
      </Text>
    </View>
  )
}

export default LoadingNote
