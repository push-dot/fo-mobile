import type { A2uiAnswerContext, A2uiMessage } from '@push/api-client'
import { Platform } from 'react-native'
import { A2uiSurfaceView } from '../../../modules/push-a2ui'
import { useColors } from '@/theme'
import { routeA2uiAction, type A2uiLocal } from './a2ui-action'
import { a2uiThemeJson } from './a2ui-theme'

export type { A2uiLocal } from './a2ui-action'

type Props = {
  /** Every message of one surface so far, in order (append-only). */
  messages: readonly A2uiMessage[]
  /** Only the newest waiting surface: elsewhere PushChoice shows its state and does not respond. */
  interactive: boolean
  onAnswer: (surfaceId: string, body: A2uiAnswerContext) => void
  onLocal: (surfaceId: string, action: A2uiLocal) => void
}

/**
 * One Bot card: an A2UI surface drawn by the platform's official renderer with the Push catalog, following dark mode.
 * Routes what it dispatches: `answer` (only while interactive) with a body rebuilt by the shared helper, the local actions
 * checked, anything else dropped.
 */
export const A2uiSurface = ({ messages, interactive, onAnswer, onLocal }: Props) => {
  const theme = a2uiThemeJson(useColors(), Platform.OS === 'ios' ? 'ios' : 'android')
  const json = messages.map((m) => JSON.stringify(m))
  const onAction = (message: string) => {
    const routed = routeA2uiAction(message, interactive)
    if (routed?.kind === 'answer') onAnswer(routed.surfaceId, routed.body)
    else if (routed?.kind === 'local') onLocal(routed.surfaceId, routed.action)
  }
  return <A2uiSurfaceView messages={json} theme={theme} interactive={interactive} onAction={onAction} />
}
