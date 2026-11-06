import { platformTheme } from '../../theme'
import { toastOffsets } from './toast-store'

export const TOAST_ABOVE = toastOffsets(platformTheme.tabBarHeight - platformTheme.safeBottom)
