import { spacing } from '../../../theme/tokens'

const AREA_GAP = spacing[2]
const BOARD_CHIP_GAP_ABOVE_BOX = 70
const BOARD_BANNER_GAP_ABOVE_BOX = 7
const BOARD_LIST_GAP_ABOVE_BOX = 2

export const quickStartMarginBottom = BOARD_CHIP_GAP_ABOVE_BOX - AREA_GAP
export const creditBannerMarginBottom = BOARD_BANNER_GAP_ABOVE_BOX
export const mentionListMarginBottom = -(AREA_GAP + BOARD_LIST_GAP_ABOVE_BOX)

export const emptyFieldHeight = (value: string, lineHeight: number, fontScale: number) => (value ? undefined : lineHeight * fontScale)

/** ChatBotStatusXL, ChatBotHeaderXL: the board draws the box text at 17 pt whatever the system size, so the XL box ignores the system scale. */
export const composerFontScale = (xl: boolean, system: number) => (xl ? 1 : system)
