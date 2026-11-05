import { View } from 'react-native'
import { Icon } from '@/shared/components'
import { onAccent, useColors } from '../../../theme'

const Pick = ({ on, square }: { on: boolean; square?: boolean }) => {
  const c = useColors()
  if (square)
    return (
      <View style={{ width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.ac : 'transparent', borderWidth: on ? 0 : 2, borderColor: c.t4 }}>
        {on ? <Icon name="check" size={14} color={onAccent} /> : null}
      </View>
    )
  return (
    <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.ac : 'transparent', borderWidth: on ? 0 : 2, borderColor: c.t4 }}>
      {on ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: onAccent }} /> : null}
    </View>
  )
}

export default Pick
