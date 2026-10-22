import { View } from 'react-native'
import { Icon } from '@/shared/components'
import { useColors } from '../../../theme'

const Pick = ({ on, square }: { on: boolean; square?: boolean }) => {
  const c = useColors()
  if (square)
    return (
      <View style={{ width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.ac : 'transparent', borderWidth: on ? 0 : 2, borderColor: c.t4 }}>
        {on ? <Icon name="check" size={14} color="#FFFFFF" /> : null}
      </View>
    )
  return <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: on ? 7 : 2, borderColor: on ? c.ac : c.t4 }} />
}

export default Pick
