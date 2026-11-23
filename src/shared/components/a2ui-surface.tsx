import type { A2uiAnswerContext, A2uiMessage } from '@push/api-client'
import { Platform } from 'react-native'
import { A2uiSurfaceView } from '../../../modules/push-a2ui'
import { NATIVE_FONTS, radius, useColors, type Colors } from '@/theme'
import { routeA2uiAction, type A2uiLocal } from './a2ui-action'

export type { A2uiLocal } from './a2ui-action'

const THEME_COLORS = [
  'bg', 'bg2', 'card', 'fill', 'fill2', 'line', 't1', 't2', 't3', 'ac', 'acSoft', 'acText',
  'green', 'greenSoft', 'red', 'redSoft', 'orange', 'orangeSoft', 'onFill',
] as const satisfies readonly (keyof Colors)[]

/** The tokens a surface draws with. The server sends no theme: the app's colours for the current scheme, Noto Sans KR, its radii. */
const themeJson = (c: Colors) =>
  JSON.stringify({
    colors: Object.fromEntries(THEME_COLORS.map((k) => [k, c[k]])),
    fonts: NATIVE_FONTS,
    radius: {
      xs: radius.xs,
      sm: radius.sm,
      md: radius.md,
      lg: radius.lg,
      pill: radius.pill,
      // The surface itself: iOS a grouped card (radius-lg), Android a Material card (12).
      surface: Platform.OS === 'ios' ? radius.lg : radius.sm,
    },
  })

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
  const theme = themeJson(useColors())
  const json = messages.map((m) => JSON.stringify(m))
  const onAction = (message: string) => {
    const routed = routeA2uiAction(message, interactive)
    if (routed?.kind === 'answer') onAnswer(routed.surfaceId, routed.body)
    else if (routed?.kind === 'local') onLocal(routed.surfaceId, routed.action)
  }
  return <A2uiSurfaceView messages={json} theme={theme} interactive={interactive} onAction={onAction} />
}
