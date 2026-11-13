import type { ReactNode } from 'react'
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
  right?: ReactNode
  safeTop?: boolean
  sheet?: boolean
  /** Floats over the content below (the caller positions it): a veil and blur instead of a solid bar. */
  translucent?: boolean
  /** The chat header (.chead): 60 high, 16 edges, 10 gap; Android draws it solid with a 1 px line under it. */
  chat?: boolean
}

const ios = Platform.OS === 'ios'
const EDGE = ios ? spacing[3] : spacing[2]
const CHAT_ROW = 60

const TopBar = ({ title, left, onBack, right, safeTop = true, sheet = false, translucent = false, chat = false }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { xl, row: baseRow, button } = useXlChrome()
  const row = chat && !xl ? CHAT_ROW : baseRow
  const solidChat = chat && !ios
  const veil = translucent && !solidChat
  return (
    <View
      style={{
        paddingTop: safeTop ? sheetHeaderTop(Platform.OS, sheet, insets.top, row) : 0,
        backgroundColor: veil ? undefined : c.bg,
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
        {onBack ? <GlassButton actions={[{ icon: 'back', label: '뒤로', onPress: onBack }]} /> : null}
        {left ? <View style={{ flex: 1 }}>{left}</View> : null}
        {title ? (
          <Text v="h3" numberOfLines={1} accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
            {title}
          </Text>
        ) : null}
        {!left && !title ? <View style={{ flex: 1 }} /> : null}
        <View style={{ minWidth: onBack ? button : 0, flexDirection: 'row', justifyContent: 'flex-end', gap: ios ? spacing[2] : 2 }}>{right}</View>
      </View>
    </View>
  )
}

export default TopBar
