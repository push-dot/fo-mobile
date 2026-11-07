import { View, type StyleProp, type ViewStyle } from 'react-native'
import { useColors } from '../../theme'

// Android blurs the content itself (RN `filter`), so the wrapper only lays a veil over it.
const Blur = ({ style }: { intensity: number; style?: StyleProp<ViewStyle> }) => <View style={[{ backgroundColor: useColors().bg, opacity: 0.2 }, style]} />

export default Blur
