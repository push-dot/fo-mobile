import type { ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { SheetHead, Text } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'

const HubFilterGroup = ({ title, children }: { title: string; children: ReactNode }) => {
  const ios = Platform.OS === 'ios'
  return (
    <View style={ios ? styles.groupIos : styles.group}>
      {ios ? (
        <SheetHead>{title}</SheetHead>
      ) : (
        <Text v="c1" color="t3">
          {title}
        </Text>
      )}
      <View style={styles.chips}>{children}</View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  group: { gap: theme.spacing[2] },
  groupIos: { gap: 0 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: theme.spacing[2] },
}))

export default HubFilterGroup
