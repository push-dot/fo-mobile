import { View } from 'react-native'
import { Icon } from '../../../shared/components'
import { onAccent, useColors } from '../../../theme'

const TermCheckbox = ({ checked, size }: { checked: boolean; size: number }) => {
  const c = useColors()
  return (
    <View
      style={{ width: size, height: size, borderRadius: 8, borderWidth: checked ? 0 : 2, borderColor: c.t3, backgroundColor: checked ? c.ac : 'transparent', alignItems: 'center', justifyContent: 'center' }}
    >
      {checked ? <Icon name="check" size={size - 10} color={onAccent} /> : null}
    </View>
  )
}

export default TermCheckbox
