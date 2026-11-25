import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Icon } from '@/shared/components'
import { onAccent } from '../../../theme'

const Pick = ({ on, square }: { on: boolean; square?: boolean }) => {
  if (square)
    return (
      <View style={[styles.square, on && styles.squareOn]}>
        {on ? <Icon name="check" size={13} color={onAccent} /> : null}
      </View>
    )
  return <View style={[styles.round, on && styles.roundOn]} />
}

const styles = StyleSheet.create((theme) => ({
  square: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent', borderWidth: 2, borderColor: theme.colors.t4 },
  squareOn: { backgroundColor: theme.colors.ac, borderWidth: 0 },
  round: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: theme.colors.t4 },
  roundOn: { borderWidth: 7, borderColor: theme.colors.ac },
}))

export default Pick
