import { useWindowDimensions } from 'react-native'
import { radius, spacing } from '@/theme'
import { isXlBoardText } from '@/shared/components/xl-chrome'

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

export const listSizeFor = (fontScale: number) => SIZES[isXlBoardText(fontScale) ? 'large' : 'normal']

export const useListSize = () => listSizeFor(useWindowDimensions().fontScale)
