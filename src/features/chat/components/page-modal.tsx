import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GlassButton, Text, ToastHost } from '@/shared/components'
import { headerInset } from './header-inset'
import { sheetHeaderTop } from '@/shared/navigation'
import { iosSheetFill, spacing, useColors, useThemeMode } from '@/theme'

const GLASS_BUTTON = 44

/** The 자료 modal's pages (`.bsh-h` and `.mpage`): 14 above the header, 4 under it, 16 beside it, a 52 spacer when no button sits right, a body that follows the header, and 20 around the actions. */
const MPAGE = { top: 14, below: 4, side: 16, spacer: 52, inset: 20 }

/** A pageSheet drawn as the boards' `.isheet.pm8` (ChatPh0Picker): 17 above the 52 high header (8 + the 5 grabber + 4), 16 beside it, 4 under the foot button. */
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
  /** A full page (the plan route, owner rule 8), not a sheet: the header sits 6 under the status bar inset (PlanUltra: back button y68). */
  page?: boolean
  /** A page pushed inside the 자료 modal (MaterialDetail*, BotPick, MaterialsLinkAdd). */
  mpage?: boolean
  /** An iOS pageSheet on the system sheet fill (`--iSheet`), not the page background. */
  sheet?: boolean
  white?: boolean
  fadeAbove?: number
  scroll?: boolean
}) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const modalPage = !!mpage && ios
  const iosSheet = !!sheet && ios
  const mode = useThemeMode()
  const fill = iosSheet && !white ? iosSheetFill[mode] : c.bg
  return (
    <View style={{ flex: 1, backgroundColor: fill, paddingTop: iosSheet ? SHEET.top : modalPage ? MPAGE.top : ios ? (page ? insets.top + 6 : spacing[4]) : sheetHeaderTop(Platform.OS, true, insets.top, GLASS_BUTTON) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], minHeight: iosSheet ? SHEET.header : undefined, paddingHorizontal: iosSheet ? SHEET.side : modalPage ? MPAGE.side : headerInset(ios, !!nav), paddingBottom: iosSheet ? 0 : modalPage ? MPAGE.below : tight ? 0 : spacing[2] }}>
        {left ?? <GlassButton filled={iosSheet && !white} actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} />}
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
            { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: modalPage ? MPAGE.inset : spacing[4], paddingTop: 14, paddingBottom: insets.bottom + (iosSheet ? SHEET.bottom : modalPage ? MPAGE.inset : ios ? 6 : 10) },
            // The boards' `.and .ctabar`: a solid `bg` bar with a 1px line on top, no fade.
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
      {/* iOS: the root ToastHost sits under this sheet; Android shows the root one. */}
      {ios ? <ToastHost /> : null}
    </View>
  )
}

const EMPTY_INSET = 40
// The boards centre the note in the body and keep this much clear under it (140 on pages, 160 under the search of a list).
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
