import { Platform } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'

const HOME_INSET = Platform.OS === 'ios' ? (initialWindowMetrics?.insets.bottom ?? 0) : 0

/**
 * Centers a StatusNote as the artboards' `padding: 0 40px <lift>px`. The artboard box runs to the screen bottom (`bottom: 0`); a list that
 * ends above the home indicator passes `homeInset` to give that window inset back, a screen whose body runs under it (a plain stack
 * screen such as 설정 › 차단한 사람, the tab-root lists) passes false. Giving it back on a full-height screen lowers the note by half the inset (17pt).
 */
export const emptyNoteStyle = (lift: number, homeInset = true) => ({ flex: 1, justifyContent: 'center', paddingBottom: lift - (homeInset ? HOME_INSET : 0) }) as const
