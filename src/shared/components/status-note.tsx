import { View, type StyleProp, type ViewStyle } from 'react-native'
import Button from './button'
import Text from './text'

type Props = {
  lines: readonly string[]
  action?: { label: string; onPress: () => void }
  style?: StyleProp<ViewStyle>
}

const StatusNote = ({ lines, action, style }: Props) => {
  return (
    <View style={[{ alignItems: 'center', paddingHorizontal: 20, gap: 6 }, style]}>
      {lines.map((line) => (
        <Text key={line} v="b2" color="t3" style={{ textAlign: 'center' }}>
          {line}
        </Text>
      ))}
      {action ? (
        <Button label={action.label} variant="secondary" size="sm" onPress={action.onPress} />
      ) : null}
    </View>
  )
}

export default StatusNote
