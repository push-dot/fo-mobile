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
  backIcon?: 'menu'
  backLabel?: string
  reserveBack?: boolean
  right?: ReactNode
  safeTop?: boolean
  sheet?: boolean
  translucent?: boolean
  transparent?: boolean
  chat?: boolean
  circleBack?: boolean
  pillRight?: boolean
}

const ios = Platform.OS === 'ios'
const EDGE = ios ? spacing[3] : spacing[2]
const CHAT_ROW = 60
const RIGHT_GAP = 10
const CHAT_RIGHT_GAP = 8
const RIGHT_MARGIN = 8
const TITLE_MARGIN = spacing[2]

const TopBar = ({ title, left, onBack, backIcon, backLabel, reserveBack, right, safeTop = true, sheet = false, translucent = false, transparent = false, chat = false, circleBack = false, pillRight = false }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { xl, row: baseRow, button } = useXlChrome()
  const row = chat && !xl ? CHAT_ROW : baseRow
  const solidChat = chat && !ios
  const veil = translucent && !solidChat
  const flat = ios && !sheet && !chat
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
