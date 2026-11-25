import { View } from 'react-native'
import { Button } from '@/shared/components'
import { spacing, useColors } from '@/theme'
import { READ_OFF_ATTACH, READ_OFF_SETTINGS } from '../../constants'
import { Bubble } from './bot'
import Rich from './rich'

const ReadOff = ({ text, onAction }: { text: string; onAction: (action: 'attach' | 'settings') => void }) => {
  const c = useColors()
  const plain = { backgroundColor: c.bg }
  return (
    <Bubble>
      <Rich v="b1" text={text} markId="read-off" />
      <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] }}>
        <Button label={READ_OFF_ATTACH} size="sm" variant="secondary" style={plain} onPress={() => onAction('attach')} />
        <Button label={READ_OFF_SETTINGS} size="sm" variant="secondary" style={plain} onPress={() => onAction('settings')} />
      </View>
    </Bubble>
  )
}

export default ReadOff
