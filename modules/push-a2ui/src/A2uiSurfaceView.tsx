import { Host } from '@expo/ui'
import { requireNativeView } from 'expo'
import type { NativeSyntheticEvent, StyleProp, ViewStyle } from 'react-native'

export type A2uiSurfaceViewProps = {
  /** A2UI agent-to-renderer messages for one surface, as JSON strings. Append-only. */
  messages: string[]
  /** Design tokens as JSON: `{colors, fonts, radius}` for the current scheme. The server sends no theme. */
  theme: string
  /** False: the surface's PushChoice does not respond. */
  interactive: boolean
  /** The renderer-to-agent message (`{ version, action }`) as a JSON string. */
  onAction?: (message: string) => void
  style?: StyleProp<ViewStyle>
}

type NativeProps = Omit<A2uiSurfaceViewProps, 'onAction' | 'style'> & {
  onAction?: (event: NativeSyntheticEvent<{ message: string }>) => void
}

const NativeA2uiSurfaceView = requireNativeView<NativeProps>('PushA2ui', 'A2uiSurfaceView')

/** One A2UI surface, drawn by the platform's official renderer with the Push catalog, as tall as its content. */
export const A2uiSurfaceView = ({ onAction, style, ...props }: A2uiSurfaceViewProps) => (
  <Host matchContents={{ vertical: true }} style={style}>
    <NativeA2uiSurfaceView {...props} onAction={onAction && ((e) => onAction(e.nativeEvent.message))} />
  </Host>
)
