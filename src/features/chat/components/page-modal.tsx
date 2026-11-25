import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GlassButton, Text, ToastHost } from '@/shared/components'
import { COMPOSE } from '../constants'
import { headerInset } from './header-inset'
import { sheetHeaderTop } from '@/shared/navigation'
import { iosSheetFill, spacing, useColors, useThemeMode } from '@/theme'

const GLASS_BUTTON = 44

const MPAGE = { top: 14, below: 4, side: 16, spacer: 52, inset: 20 }

const SHEET = { top: 17, header: 52, side: 16, bottom: 4 }

const PageModal = ({
  onClose = () => router.back(),
  title,
  right,
  left,
  nav,
  children,
  footer,
  tight,
  page,
  mpage,
  sheet,
  white,
  closeFilled,
  fadeAbove = 0,
  scroll = true,
}: {
  onClose?: () => void
  title: string
  right?: ReactNode
  left?: ReactNode
  nav?: boolean
  children: ReactNode
  footer?: ReactNode
  tight?: boolean
  page?: boolean
  mpage?: boolean
  sheet?: boolean
  white?: boolean
  closeFilled?: boolean
  fadeAbove?: number
  scroll?: boolean
}) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const modalPage = !!mpage && ios
  const iosSheet = !!sheet && ios
  const geo = white ? COMPOSE : SHEET
  const mode = useThemeMode()
  const fill = iosSheet && !white ? iosSheetFill[mode] : c.bg
  return (
    <View style={{ flex: 1, backgroundColor: fill, paddingTop: iosSheet ? geo.top : modalPage ? MPAGE.top : ios ? (page ? insets.top + 6 : spacing[4]) : sheetHeaderTop(Platform.OS, true, insets.top, GLASS_BUTTON) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], minHeight: iosSheet ? geo.header : undefined, paddingHorizontal: iosSheet ? geo.side : modalPage ? MPAGE.side : headerInset(ios, !!nav), paddingBottom: iosSheet ? 0 : modalPage ? MPAGE.below : tight ? 0 : spacing[2] }}>
        {left ?? <GlassButton filled={iosSheet && !!closeFilled} actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} />}
        <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
          {title}
        </Text>
        <View style={{ minWidth: modalPage && !right ? MPAGE.spacer : 44, height: modalPage && !right ? MPAGE.spacer : undefined, alignItems: 'flex-end' }}>{right}</View>
      </View>
      {scroll ? (
        <ScrollView keyboardDismissMode="on-drag" style={{ marginTop: modalPage || iosSheet ? 0 : spacing[1] }} contentContainerStyle={{ flexGrow: 1, gap: spacing[1], paddingBottom: insets.bottom + spacing[6] + (footer ? 80 : 0) }}>{children}</ScrollView>
      ) : (
        <View style={{ flex: 1, marginTop: modalPage || iosSheet ? 0 : spacing[1] }}>{children}</View>
      )}
      {footer ? (
        <View
          style={[
            { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: modalPage ? MPAGE.inset : iosSheet ? geo.side : spacing[4], paddingTop: 14, paddingBottom: insets.bottom + (iosSheet ? geo.bottom : modalPage ? MPAGE.inset : ios ? 6 : 10) },
            ios ? null : { backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.line },
          ]}
        >
          {ios && fadeAbove ? (
            <>
              <View pointerEvents="none" style={{ position: 'absolute', inset: 0, backgroundColor: fill }} />
              <LinearGradient pointerEvents="none" colors={[`${fill}00`, fill]} style={{ position: 'absolute', left: 0, right: 0, top: -fadeAbove, height: fadeAbove }} />
            </>
          ) : ios ? (
            <LinearGradient pointerEvents="none" colors={[fill, fill, `${fill}00`]} locations={[0, 0.72, 1]} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={{ position: 'absolute', inset: 0 }} />
          ) : null}
          {footer}
        </View>
      ) : null}
      {ios ? <ToastHost /> : null}
    </View>
  )
}

const EMPTY_INSET = 40
export const EMPTY_RESERVE = 140

export const PageEmpty = ({ children, reserve = EMPTY_RESERVE }: { children: ReactNode; reserve?: number }) => {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingHorizontal: EMPTY_INSET, paddingBottom: Math.max(reserve - spacing[6] - insets.bottom, 0) }}>
      {children}
    </View>
  )
}

export default PageModal
