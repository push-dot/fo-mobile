import { useState, type ReactNode } from 'react'
import { Platform, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { sheetHeaderTop } from '../navigation/sheet-header'
import { spacing, useColors } from '../../theme'
import Blur from './blur'
import GlassButton from './glass-button'
import Text from './text'
import { useXlChrome } from './xl-chrome'

type Props = {
  title?: string
  left?: ReactNode
  onBack?: () => void
  /** The leading button's glyph and label when it is not a plain 뒤로 (the chat opened by a redirect leads to the Bot home). */
  backIcon?: 'menu'
  backLabel?: string
  /** No back button, but its space stays so a centered title does not move (the chat opened by a redirect before consent). */
  reserveBack?: boolean
  right?: ReactNode
  safeTop?: boolean
  sheet?: boolean
  /** Floats over the content below (the caller positions it): a veil and blur instead of a solid bar. */
  translucent?: boolean
  /** No fill at all: the content scrolls visibly under the bar (the caller positions it and draws any fade). */
  transparent?: boolean
  /** The chat header (.chead): 60 high, 16 edges, 10 gap; Android draws it solid with a 1 px line under it. */
  chat?: boolean
  /** The back button is the board's `.gbtn` (Android: a solid `fill` circle); the chat header always is. */
  circleBack?: boolean
  /** `right` is a `.btn` pill (the notifications 모두 읽음): the board gives it no left margin, unlike the round `.iconbtn`s. */
  pillRight?: boolean
}

const ios = Platform.OS === 'ios'
const EDGE = ios ? spacing[3] : spacing[2]
const CHAT_ROW = 60
// The boards' `.topbar` gap 2 plus `.ios .topbar .iconbtn{margin-left:8}`: 10 between the right-hand buttons (Main: search x292, bell x346).
const RIGHT_GAP = 10
// A chat header's find bar (ChatBotHeaderFind) is a `.chead` with gap 8, not a `.topbar`.
const CHAT_RIGHT_GAP = 8
// `.ios .topbar .iconbtn{margin-left:8px}`: the right-hand button keeps 8 off the title, which is why the board's title sits 4 left of the screen centre.
const RIGHT_MARGIN = 8
// Breathing room between the title and the nearest button, so a long title ends before the buttons instead of touching them.
const TITLE_MARGIN = spacing[2]

const TopBar = ({ title, left, onBack, backIcon, backLabel, reserveBack, right, safeTop = true, sheet = false, translucent = false, transparent = false, chat = false, circleBack = false, pillRight = false }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { xl, row: baseRow, button } = useXlChrome()
  const row = chat && !xl ? CHAT_ROW : baseRow
  const solidChat = chat && !ios
  const veil = translucent && !solidChat
  // The boards' `.ios .topbar` has no fill: the screen shows through, so a glass control's shadow just below the bar is not cut at the bar's edge.
  const flat = ios && !sheet && !chat
  // The title sits on the bar's exact centre however many buttons are either side: it gets the wider side's room on both sides.
  const [sides, setSides] = useState({ start: 0, end: 0 })
  const room = Math.max(sides.start, sides.end) + TITLE_MARGIN
  return (
    <View
      style={{
        paddingTop: safeTop ? sheetHeaderTop(Platform.OS, sheet, insets.top, row) : 0,
        backgroundColor: veil || transparent || flat ? undefined : c.bg,
        borderBottomWidth: solidChat ? 1 : 0,
        borderBottomColor: c.line,
        zIndex: 3,
      }}
    >
      {veil ? (
        <>
          <Blur intensity={30} style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: c.bg, opacity: 0.6 }]} />
        </>
      ) : null}
      <View style={{ minHeight: row, flexDirection: 'row', alignItems: 'center', paddingLeft: chat ? spacing[4] : onBack ? EDGE : spacing[5], paddingRight: chat ? spacing[4] : EDGE, gap: chat ? 10 : 2 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }} onLayout={(e) => setSides((cur) => ({ ...cur, start: e.nativeEvent.layout.x + e.nativeEvent.layout.width }))}>
          {onBack ? <GlassButton circle={chat || circleBack} actions={[{ icon: backIcon ?? 'back', label: backLabel ?? '뒤로', onPress: onBack }]} /> : reserveBack ? <View style={{ width: button, height: button }} /> : null}
        </View>
        {left ? <View style={{ flex: 1 }}>{left}</View> : <View style={{ flex: 1 }} />}
        <View
          onLayout={(e) => setSides((cur) => ({ ...cur, end: e.nativeEvent.layout.width + (chat ? spacing[4] : EDGE) }))}
          style={{ minWidth: onBack || reserveBack ? button : 0, marginLeft: flat && title && right && !pillRight ? RIGHT_MARGIN : 0, flexDirection: 'row', justifyContent: 'flex-end', gap: ios ? (chat ? CHAT_RIGHT_GAP : RIGHT_GAP) : 2 }}
        >
          {right}
        </View>
        {title ? (
          <View pointerEvents="none" style={{ position: 'absolute', left: room, right: room, top: 0, bottom: 0, justifyContent: 'center' }}>
            <Text v="h3" numberOfLines={1} accessibilityRole="header" style={{ textAlign: 'center' }}>
              {title}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

export default TopBar
