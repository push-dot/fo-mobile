import { Pressable, View } from 'react-native'
import { Icon, Text } from '../../../shared/components'
import TermCheckbox from './term-checkbox'
import { hitSlopTo, spacing, type } from '../../../theme'
import { TERMS_DETAIL_SUFFIX } from '../constants'

const CHEVRON_SIZE = 44

type Props = { label: string; badge: string; required: boolean; checked: boolean; onPress: () => void; onOpen?: () => void }

const TermRow = ({ label, badge, required, checked, onPress, onOpen }: Props) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`${badge} ${label}`}
      accessibilityState={{ checked }}
      onPress={onPress}
      style={{ flex: 1, minHeight: 48, paddingVertical: spacing[3], flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}
    >
      <TermCheckbox checked={checked} size={24} />
      <View style={{ flex: 1, minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
        <Text v="c1" weight="700" color={required ? 'acText' : 't3'} style={{ lineHeight: type.b1.lineHeight }}>
          {badge}
        </Text>
        <Text style={{ flex: 1, lineHeight: type.b1.lineHeight }}>{label}</Text>
      </View>
    </Pressable>
    {onOpen ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${TERMS_DETAIL_SUFFIX}`}
        onPress={onOpen}
        hitSlop={hitSlopTo(CHEVRON_SIZE, CHEVRON_SIZE)}
        style={{ width: CHEVRON_SIZE, height: CHEVRON_SIZE, marginRight: -spacing[3], alignItems: 'center', justifyContent: 'center' }}
      >
        <Icon name="chev" size={18} color="t3" />
      </Pressable>
    ) : null}
  </View>
)

export default TermRow
