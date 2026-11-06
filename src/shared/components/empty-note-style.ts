import { Platform } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'

const HOME_INSET = Platform.OS === 'ios' ? (initialWindowMetrics?.insets.bottom ?? 0) : 0

/**
 * Centers a StatusNote as the artboards' `padding: 0 40px <lift>px`. An iOS stack-screen list ends above the home indicator, so
 * `homeInset` gives that window inset back; tab-root lists run to the screen bottom and pass false.
 */
export const emptyNoteStyle = (lift: number, homeInset = true) => ({ flex: 1, justifyContent: 'center', paddingBottom: lift - (homeInset ? HOME_INSET : 0) }) as const
