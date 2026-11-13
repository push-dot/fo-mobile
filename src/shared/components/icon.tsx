import { SvgXml } from 'react-native-svg'
import { LINE_ICONS, type IconName } from '@push/design-system'
import { useColors, type Colors } from '../../theme'

/** Glyphs the boards draw that the shared design-system set does not carry yet (AgentHomePress 알림 끄기). */
const APP_ICONS = {
  'bell-off':
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 16.5V11a6 6 0 0 1 9.5-4.9M18 10.5v6l1.5 1.5H8M10 20.5a2.2 2.2 0 0 0 4 0M3.5 3.5l17 17"></path></svg>',
  // Settings value rows (한국어 ⌃⌄): the board's up-down selector.
  updown:
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M8 9.5l4-4 4 4M8 14.5l4 4 4-4"></path></svg>',
  // FindBar previous result: the mirror of 'down' (the board draws chevrons, not the send arrow 'up').
  'chev-up':
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M6 15l6-6 6 6"></path></svg>',
} as const

export type AppIconName = keyof typeof APP_ICONS

type Props = { name: IconName | AppIconName; size?: number; color?: keyof Colors | (string & {}); filled?: boolean }

const Icon = ({ name, size = 24, color = 't1', filled }: Props) => {
  const c = useColors()
  const resolved = (c as Record<string, string>)[color] ?? color
  const line = name in APP_ICONS ? APP_ICONS[name as AppIconName] : LINE_ICONS[name as IconName]
  const xml = filled ? line.replace('fill="none"', 'fill="currentColor"') : line
  return <SvgXml xml={xml} width={size} height={size} color={resolved} />
}

export default Icon
