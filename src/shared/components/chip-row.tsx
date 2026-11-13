import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { spacing } from '../../theme'

/** A horizontal row of chips (flat fills, no shadow to make room for). */
const ChipRow = ({ children, paddingTop = 0, paddingBottom = 0 }: { children: ReactNode; paddingTop?: number; paddingBottom?: number }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={{ flexGrow: 0 }}
    contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[5], paddingTop, paddingBottom }}
  >
    {children}
  </ScrollView>
)

export default ChipRow
