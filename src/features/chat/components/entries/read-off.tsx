import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Button } from '@/shared/components'
import { READ_OFF_ATTACH, READ_OFF_SETTINGS } from '../../constants'
import { Bubble } from './bot'
import Rich from './rich'

const ReadOff = ({ text, onAction }: { text: string; onAction: (action: 'attach' | 'settings') => void }) => {
  return (
    <Bubble>
      <Rich v="b1" text={text} markId="read-off" />
      <View style={styles.row}>
        <Button label={READ_OFF_ATTACH} size="sm" variant="secondary" style={styles.plain} onPress={() => onAction('attach')} />
        <Button label={READ_OFF_SETTINGS} size="sm" variant="secondary" style={styles.plain} onPress={() => onAction('settings')} />
      </View>
    </Bubble>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[3] },
  plain: { backgroundColor: theme.colors.bg },
}))

export default ReadOff
