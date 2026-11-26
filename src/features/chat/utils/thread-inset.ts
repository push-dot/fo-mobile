import { spacing } from '../../../theme/tokens'

export const BUBBLE_GAP = 18
const KEYBOARD_GAP = spacing[2]
const THREAD_GAP = spacing[4]

export const threadBottomGap = (keyboard: number) => (keyboard ? KEYBOARD_GAP : THREAD_GAP)
