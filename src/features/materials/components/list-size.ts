import { useWindowDimensions } from 'react-native'
import { isXlScale } from '@/shared/components/xl-chrome'
import { radius, spacing } from '@/theme'

/**
 * From the shared XL size (MaterialsXL) the list draws the large boxes. The boxes of `.mrow`, `.usep` and `.spill` as Materials draws them, and under `.xl` (MaterialsXL). The text in
 * them grows with the system size by itself.
 */
const SIZES = {
  normal: {
    row: { alignItems: 'center', paddingVertical: 10, paddingLeft: spacing[5], paddingRight: spacing[4] },
    titleLines: 1,
    subLines: 1,
    send: { minHeight: 34, borderRadius: radius.chip, paddingHorizontal: 13 },
    field: { height: 44, borderRadius: 22 },
  },
  large: {
    row: { alignItems: 'flex-start', paddingVertical: spacing[3], paddingLeft: spacing[4], paddingRight: spacing[4] },
    titleLines: 2,
    subLines: undefined,
    send: { minHeight: 44, borderRadius: 22, paddingHorizontal: spacing[4], marginLeft: 56 },
    field: { height: 52, borderRadius: 26 },
  },
} as const

export const useListSize = () => SIZES[isXlScale(useWindowDimensions().fontScale) ? 'large' : 'normal']
