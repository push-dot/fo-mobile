import { View, type StyleProp, type ViewStyle } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Button from './button'
import Text from './text'

type Props = {
  lines: readonly string[]
  action?: { label: string; onPress: () => void }
  style?: StyleProp<ViewStyle>
}

const StatusNote = ({ lines, action, style }: Props) => {
  return (
    <View style={[styles.note, style]}>
      <Text v="b1" color="t2" style={styles.text}>
        {lines.join('\n')}
      </Text>
      {action ? (
        <View style={styles.action}>
          <Button label={action.label} variant="secondary" size="pill" onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  note: { alignItems: 'center', paddingHorizontal: 40, gap: theme.spacing[2] },
  text: { textAlign: 'center' },
  action: { marginTop: theme.spacing[3] },
}))

export default StatusNote
