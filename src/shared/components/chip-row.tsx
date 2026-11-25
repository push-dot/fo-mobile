import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'

const ChipRow = ({ children, paddingTop = 0, paddingBottom = 0 }: { children: ReactNode; paddingTop?: number; paddingBottom?: number }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={styles.scroll}
    contentContainerStyle={styles.content(paddingTop, paddingBottom)}
  >
    {children}
  </ScrollView>
)

const styles = StyleSheet.create((theme) => ({
  scroll: { flexGrow: 0 },
  content: (paddingTop: number, paddingBottom: number) => ({ gap: theme.spacing[2], paddingHorizontal: theme.spacing[5], paddingTop, paddingBottom }),
}))

export default ChipRow
