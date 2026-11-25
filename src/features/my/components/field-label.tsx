import { type ReactNode } from 'react'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'

const FieldLabel = ({ children }: { children: ReactNode }) => {
  return (
    <Text v="c1" weight="700" color="t3" style={styles.label}>
      {children}
    </Text>
  )
}

const styles = StyleSheet.create((theme) => ({
  label: { paddingLeft: theme.spacing[1] },
}))

export default FieldLabel
