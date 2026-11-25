import { useState, type ReactNode } from 'react'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { sheetHeaderTop } from '../navigation/sheet-header'
import { spacing } from '../../theme'
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
      style={[styles.bar(safeTop ? sheetHeaderTop(Platform.OS, sheet, insets.top, row) : 0), !(veil || transparent || flat) && styles.solid, solidChat && styles.divided]}
    >
      {veil ? (
        <>
          <Blur intensity={30} style={StyleSheet.absoluteFill} />
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.veil]} />
        </>
      ) : null}
      <View style={[styles.row(row, onBack ? EDGE : spacing[5]), chat && styles.rowChat]}>
        <View style={styles.start} onLayout={(e) => setSides((cur) => ({ ...cur, start: e.nativeEvent.layout.x + e.nativeEvent.layout.width }))}>
          {onBack ? <GlassButton circle={chat || circleBack} actions={[{ icon: backIcon ?? 'back', label: backLabel ?? '뒤로', onPress: onBack }]} /> : reserveBack ? <View style={styles.square(button)} /> : null}
        </View>
        {left ? <View style={styles.fill}>{left}</View> : <View style={styles.fill} />}
        <View
          onLayout={(e) => setSides((cur) => ({ ...cur, end: e.nativeEvent.layout.width + (chat ? spacing[4] : EDGE) }))}
          style={[styles.end(onBack || reserveBack ? button : 0, ios ? (chat ? CHAT_RIGHT_GAP : RIGHT_GAP) : 2), !!(flat && title && right && !pillRight) && styles.endMargin]}
        >
          {right}
        </View>
        {title ? (
          <View pointerEvents="none" style={styles.title(room)}>
            <Text v="h3" numberOfLines={1} accessibilityRole="header" style={styles.titleText}>
              {title}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  bar: (paddingTop: number) => ({ paddingTop, borderBottomWidth: 0, borderBottomColor: theme.colors.line, zIndex: 3 }),
  solid: { backgroundColor: theme.colors.bg },
  divided: { borderBottomWidth: 1 },
  veil: { backgroundColor: theme.colors.bg, opacity: 0.6 },
  row: (minHeight: number, paddingLeft: number) => ({ minHeight, flexDirection: 'row', alignItems: 'center', paddingLeft, paddingRight: EDGE, gap: 2 }),
  rowChat: { paddingLeft: theme.spacing[4], paddingRight: theme.spacing[4], gap: 10 },
  start: { flexDirection: 'row', alignItems: 'center' },
  square: (size: number) => ({ width: size, height: size }),
  fill: { flex: 1 },
  end: (minWidth: number, gap: number) => ({ minWidth, marginLeft: 0, flexDirection: 'row', justifyContent: 'flex-end', gap }),
  endMargin: { marginLeft: RIGHT_MARGIN },
  title: (room: number) => ({ position: 'absolute', left: room, right: room, top: 0, bottom: 0, justifyContent: 'center' }),
  titleText: { textAlign: 'center' },
}))

export default TopBar
