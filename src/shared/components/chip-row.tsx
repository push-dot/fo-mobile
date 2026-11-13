import type { ReactNode } from 'react'
import { ScrollView } from 'react-native'
import { spacing } from '../../theme'

/** The chips' glass shadow reaches this far past the chip; a scroll view clips at its edge, which drew a grey band (the two-tone background of the job list, hub, and 내 활동 chip rows). */
const SHADOW_ROOM = 12

/** A horizontal row of chips whose shadow has room: the padding gives it space and the negative margin keeps the layout the boards draw. */
const ChipRow = ({ children, paddingTop = 0, paddingBottom = 0 }: { children: ReactNode; paddingTop?: number; paddingBottom?: number }) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    style={{ flexGrow: 0, marginVertical: -SHADOW_ROOM }}
    contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: paddingTop + SHADOW_ROOM, paddingBottom: paddingBottom + SHADOW_ROOM }}
  >
    {children}
  </ScrollView>
)

export default ChipRow
