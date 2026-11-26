import { Pressable, View } from 'react-native'
import { Text } from '../../../shared/components'
import { displayName } from '../../../shared/utility/display-name'
import { StyleSheet } from 'react-native-unistyles'
import type { ApplyDoc } from '../types'

const DocRow = ({ doc, on, multi, onPress }: { doc: ApplyDoc; on: boolean; multi?: boolean; onPress: () => void }) => (
  <Pressable accessibilityRole={multi ? 'checkbox' : 'radio'} accessibilityState={{ checked: on }} onPress={onPress} style={styles.row}>
    <View style={[styles.radio, on ? styles.radioOn : styles.radioOff]} />
    <View style={styles.text}>
      <Text v="b1" weight="600" numberOfLines={1}>
        {displayName(doc.name)}
      </Text>
      {doc.note ? (
        <Text v="c1" color="t3">
          {doc.note}
        </Text>
      ) : null}
    </View>
  </Pressable>
)

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], minHeight: 56 },
  radio: { width: 22, height: 22, borderRadius: 11 },
  radioOn: { borderWidth: 7, borderColor: theme.colors.ac },
  radioOff: { borderWidth: 2, borderColor: theme.colors.t4 },
  text: { flex: 1, minWidth: 0 },
}))

export default DocRow
