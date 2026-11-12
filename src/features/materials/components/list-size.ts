import { useWindowDimensions } from 'react-native'
import { radius, spacing } from '@/theme'

/** Past this system text size the list draws MaterialsXL. */
const LARGE_TEXT_SCALE = 1.3

/**
 * The boxes of `.mrow`, `.usep`, `.cntp` and `.spill` as Materials draws them, and under `.xl` (MaterialsXL). The text in
 * them grows with the system size by itself.
 */
const SIZES = {
  normal: {
    row: { alignItems: 'center', paddingVertical: 10, paddingLeft: spacing[5], paddingRight: spacing[4] },
    titleLines: 1,
    subLines: 1,
    send: { minHeight: 34, borderRadius: radius.chip, paddingHorizontal: 13 },
    count: { height: 36, borderRadius: 18 },
    field: { height: 44, borderRadius: 22 },
  },
  large: {
    row: { alignItems: 'flex-start', paddingVertical: spacing[3], paddingLeft: spacing[4], paddingRight: spacing[4] },
    titleLines: 2,
    subLines: undefined,
    send: { minHeight: 44, borderRadius: 22, paddingHorizontal: spacing[4], marginLeft: 56 },
    count: { height: 44, borderRadius: 22 },
    field: { height: 52, borderRadius: 26 },
  },
} as const

export const useListSize = () => SIZES[useWindowDimensions().fontScale > LARGE_TEXT_SCALE ? 'large' : 'normal']
