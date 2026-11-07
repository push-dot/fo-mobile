import { Platform } from 'react-native'
import { StatusNote, emptyNoteStyle } from '@/shared/components'
import { platformTheme } from '../../../theme'

// The boards centre 마이 empties over the whole screen; Android's tab bar is a real inset (iOS floats over the list).
const EMPTY_LIFT = 140

export const TAB_EMPTY_LIFT = EMPTY_LIFT - (Platform.OS === 'android' ? platformTheme.tabBarHeight : 0)

type Props = { text: string; action?: string; onAction?: () => void; lift?: number }

const Empty = ({ text, action, onAction, lift = EMPTY_LIFT }: Props) => (
  <StatusNote
    lines={[text]}
    action={action && onAction ? { label: action, onPress: onAction } : undefined}
    style={emptyNoteStyle(lift, false)}
  />
)

export default Empty
