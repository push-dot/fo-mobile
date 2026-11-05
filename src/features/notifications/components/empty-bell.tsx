import { View } from 'react-native'
import { Icon } from '../../../shared/components'
import { useColors } from '../../../theme'

const EmptyBell = () => {
  const c = useColors()
  return (
    <View style={{ width: 64, height: 64, borderRadius: 22, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
      <Icon name="bell" size={28} color="t3" />
    </View>
  )
}

export default EmptyBell
