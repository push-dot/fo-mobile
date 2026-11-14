import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { GlassButton, Text, ToastHost } from '@/shared/components'
import { headerInset } from './header-inset'
import { sheetHeaderTop } from '@/shared/navigation'
import { spacing, useColors } from '@/theme'

const GLASS_BUTTON = 44

const PageModal = ({
  onClose = () => router.back(),
  title,
  right,
  left,
  children,
  footer,
  tight,
  page,
  scroll = true,
}: {
  onClose?: () => void
  title: string
  right?: ReactNode
  left?: ReactNode
  children: ReactNode
  footer?: ReactNode
  tight?: boolean
  /** A full page (the plan route, owner rule 8), not a sheet: the header sits 6 under the status bar inset (PlanUltra: back button y68). */
  page?: boolean
  scroll?: boolean
}) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: ios ? (page ? insets.top + 6 : spacing[4]) : sheetHeaderTop(Platform.OS, true, insets.top, GLASS_BUTTON) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: headerInset(ios, left != null), paddingBottom: tight ? 0 : spacing[2] }}>
        {left ?? <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} />}
        <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
          {title}
        </Text>
        <View style={{ minWidth: 44, alignItems: 'flex-end' }}>{right}</View>
      </View>
      {scroll ? (
        <ScrollView keyboardDismissMode="on-drag" style={{ marginTop: spacing[1] }} contentContainerStyle={{ flexGrow: 1, gap: spacing[1], paddingBottom: insets.bottom + spacing[6] + (footer ? 80 : 0) }}>{children}</ScrollView>
      ) : (
        <View style={{ flex: 1, marginTop: spacing[1] }}>{children}</View>
      )}
      {footer ? (
        <View
          style={[
            { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing[4], paddingTop: 14, paddingBottom: insets.bottom + (ios ? 6 : 10) },
            // The boards' `.and .ctabar`: a solid `bg` bar with a 1px line on top, no fade.
            ios ? null : { backgroundColor: c.bg, borderTopWidth: 1, borderTopColor: c.line },
          ]}
        >
          {ios ? <LinearGradient pointerEvents="none" colors={[c.bg, c.bg, `${c.bg}00`]} locations={[0, 0.72, 1]} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={{ position: 'absolute', inset: 0 }} /> : null}
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
