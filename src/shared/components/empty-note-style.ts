import { Platform } from 'react-native'
import { initialWindowMetrics } from 'react-native-safe-area-context'

const HOME_INSET = Platform.OS === 'ios' ? (initialWindowMetrics?.insets.bottom ?? 0) : 0

export const emptyNoteStyle = (lift: number, homeInset = true) => ({ flex: 1, justifyContent: 'center', paddingBottom: lift - (homeInset ? HOME_INSET : 0) }) as const
