import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { SheetHead, Text } from '../../../shared/components'

const FilterGroup = ({ title, children }: { title?: string; children: ReactNode }) => {
  const ios = Platform.OS === 'ios'
  return (
    <View style={ios ? styles.groupIos : styles.group}>
      {title ? ios ? <SheetHead>{title}</SheetHead> : <Text v="b2" weight="700">{title}</Text> : null}
      <View style={styles.chips}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  group: { gap: theme.spacing[3] },
  groupIos: { gap: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] },
}))

export default FilterGroup
