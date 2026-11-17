import { spacing } from '../../../theme/tokens'

const AREA_GAP = spacing[2]
const BOARD_CHIP_GAP_ABOVE_BOX = 70

export const quickStartMarginBottom = BOARD_CHIP_GAP_ABOVE_BOX - AREA_GAP
export const creditBannerMarginBottom = 7
export const mentionListMarginBottom = -(AREA_GAP + 2)

export const emptyFieldHeight = (value: string, lineHeight: number, fontScale: number) => (value ? undefined : lineHeight * fontScale)
