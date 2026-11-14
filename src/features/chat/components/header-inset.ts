import { spacing } from '../../../theme/tokens'

/** The boards' `.topbar.nav` (a back button on the left) pads 12 on iOS and 8 on Android; the sheet header with a close button pads 20 (PlanUltra: back chevron x28.7). */
export const headerInset = (ios: boolean, nav: boolean) => (nav ? (ios ? 12 : 8) : spacing[5])
