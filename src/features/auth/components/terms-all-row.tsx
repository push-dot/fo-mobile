import { Pressable } from 'react-native'
import { Text } from '../../../shared/components'
import { useColors } from '../../../theme'
import { FIELD_RADIUS, TERMS_ALL } from '../constants'
import TermCheckbox from './term-checkbox'

const TermsAllRow = ({ checked, onPress }: { checked: boolean; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: FIELD_RADIUS, backgroundColor: c.bg2 }}
    >
      <TermCheckbox checked={checked} size={26} />
      <Text v="b1" weight="700">
        {TERMS_ALL}
      </Text>
    </Pressable>
  )
}

export default TermsAllRow
