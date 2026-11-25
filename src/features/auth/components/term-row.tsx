import { Pressable, View } from 'react-native'
import { Icon, Text } from '../../../shared/components'
import TermCheckbox from './term-checkbox'
import { StyleSheet } from 'react-native-unistyles'
import { hitSlopTo } from '../../../theme'
import { TERMS_DETAIL_SUFFIX } from '../constants'

const CHEVRON_SIZE = 44

type Props = { label: string; badge: string; required: boolean; checked: boolean; onPress: () => void; onOpen?: () => void }

const TermRow = ({ label, badge, required, checked, onPress, onOpen }: Props) => (
  <View style={styles.row}>
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={`${badge} ${label}`}
      accessibilityState={{ checked }}
      onPress={onPress}
      style={styles.check}
    >
      <TermCheckbox checked={checked} size={24} />
      <View style={styles.labels}>
        <Text v="c1" weight="700" color={required ? 't1' : 't3'} style={styles.badge}>
          {badge}
        </Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Pressable>
    {onOpen ? (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label} ${TERMS_DETAIL_SUFFIX}`}
        onPress={onOpen}
        hitSlop={hitSlopTo(CHEVRON_SIZE, CHEVRON_SIZE)}
        style={styles.chevron}
      >
        <Icon name="chev" size={18} color="t3" />
      </Pressable>
    ) : null}
  </View>
)

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center' },
  check: { flex: 1, minHeight: 48, paddingVertical: theme.spacing[3], flexDirection: 'row', alignItems: 'flex-start', gap: theme.spacing[3] },
  labels: { flex: 1, minHeight: 24, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  badge: { lineHeight: theme.type.b1.lineHeight },
  label: { flex: 1, lineHeight: theme.type.b1.lineHeight },
  chevron: { width: CHEVRON_SIZE, height: CHEVRON_SIZE, marginRight: -theme.spacing[3], alignItems: 'center', justifyContent: 'center' },
}))

export default TermRow
