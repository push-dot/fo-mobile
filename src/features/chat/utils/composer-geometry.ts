import { spacing } from '../../../theme/tokens'

const AREA_GAP = spacing[2]
const CHIP_GAP_ABOVE_BOX = 8
export const quickStartShadowRoom = 16
const BOARD_BANNER_GAP_ABOVE_BOX = 7

export const quickStartMarginBottom = CHIP_GAP_ABOVE_BOX - AREA_GAP - quickStartShadowRoom
export const creditBannerMarginBottom = BOARD_BANNER_GAP_ABOVE_BOX
export const mentionListMarginBottom = CHIP_GAP_ABOVE_BOX - AREA_GAP

export const emptyFieldHeight = (value: string, lineHeight: number, fontScale: number) => (value ? undefined : lineHeight * fontScale)

export const composerFontScale = (xl: boolean, system: number) => (xl ? 1 : system)
