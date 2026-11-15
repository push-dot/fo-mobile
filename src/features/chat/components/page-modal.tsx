import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GlassButton, Text, ToastHost } from '@/shared/components'
import { headerInset } from './header-inset'
import { sheetHeaderTop } from '@/shared/navigation'
import { iosSheetBg, spacing, useColors, useThemeMode } from '@/theme'

const GLASS_BUTTON = 44
// `.isheet.pm8.full`: 17 under the sheet's top (8 + the 5 grabber + 4), then the 52 header row, then the body's own 4.
const SHEET = { top: 17, header: 52 }

/** The 자료 modal's pages (`.bsh-h` and `.mpage`): 14 above the header, 4 under it, 16 beside it, a 52 spacer when no button sits right, a body that follows the header, and 20 around the actions. */
const MPAGE = { top: 14, below: 4, side: 16, spacer: 52, inset: 20 }

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
  scroll = true,
  sheet,
}: {
  onClose?: () => void
  title: string
  right?: ReactNode
  left?: ReactNode
  /** The header is the boards' `.topbar.nav` (PlanUltra, PlanUltraNotice): 12 on iOS. A `left` alone (usage, ChatAccountUsage: padding 20) keeps 20. */
  nav?: boolean
  children: ReactNode
  footer?: ReactNode
  tight?: boolean
  /** A full page (the plan route, owner rule 8), not a sheet: the header sits 6 under the status bar inset (PlanUltra: back button y68). */
  page?: boolean
  /** A page pushed inside the 자료 modal (MaterialDetail*, BotPick, MaterialsLinkAdd). */
  mpage?: boolean
  scroll?: boolean
  /** The chat's page-style modal (ChatPh0Input): the sheet's grey background, a 52 header row and a plain close chip (`.isheet .iconbtn` is `fill`, not glass). */
  sheet?: boolean
}) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const modalPage = !!mpage && ios
  const grey = !!sheet && ios
  const mode = useThemeMode()
  const bg = grey ? iosSheetBg[mode] : c.bg
  return (
    <View style={{ flex: 1, backgroundColor: bg, paddingTop: modalPage ? MPAGE.top : grey ? SHEET.top : ios ? (page ? insets.top + 6 : spacing[4]) : sheetHeaderTop(Platform.OS, true, insets.top, GLASS_BUTTON) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], minHeight: grey ? SHEET.header : undefined, paddingHorizontal: modalPage ? MPAGE.side : headerInset(ios, !!nav), paddingBottom: modalPage ? MPAGE.below : tight || grey ? 0 : spacing[2] }}>
        {left ?? <GlassButton filled={grey} actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} />}
        <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
          {title}
        </Text>
        <View style={{ minWidth: modalPage && !right ? MPAGE.spacer : 44, height: modalPage && !right ? MPAGE.spacer : undefined, alignItems: 'flex-end' }}>{right}</View>
      </View>
      {scroll ? (
        <ScrollView keyboardDismissMode="on-drag" style={{ marginTop: modalPage ? 0 : spacing[1] }} contentContainerStyle={{ flexGrow: 1, gap: spacing[1], paddingBottom: insets.bottom + spacing[6] + (footer ? 80 : 0) }}>{children}</ScrollView>
      ) : (
        <View style={{ flex: 1, marginTop: modalPage ? 0 : spacing[1] }}>{children}</View>
      )}
      {footer ? (
        <View
          style={[
            { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: modalPage ? MPAGE.inset : spacing[4], paddingTop: 14, paddingBottom: insets.bottom + (modalPage ? MPAGE.inset : ios ? 6 : 10) },
            // The boards' `.and .ctabar`: a solid `bg` bar with a 1px line on top, no fade.
            ios ? null : { backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.line },
          ]}
        >
          {ios ? <LinearGradient pointerEvents="none" colors={[bg, bg, `${bg}00`]} locations={[0, 0.72, 1]} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={{ position: 'absolute', inset: 0 }} /> : null}
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
