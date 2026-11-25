import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { GlassButton, Text, ToastHost } from '@/shared/components'
import { COMPOSE } from '../constants'
import { headerInset } from './header-inset'
import { sheetHeaderTop } from '@/shared/navigation'
import { iosSheetFill, useColors, useThemeMode } from '@/theme'

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
  const ios = Platform.OS === 'ios'
  const modalPage = !!mpage && ios
  const iosSheet = !!sheet && ios
  const geo = white ? COMPOSE : SHEET
  const mode = useThemeMode()
  const fill = iosSheet && !white ? iosSheetFill[mode] : c.bg
  const insets = useSafeAreaInsets()
  return (
    <View style={styles.root(fill, iosSheet ? geo.top : modalPage ? MPAGE.top : undefined, !!page, insets.top)}>
      <View style={styles.header(iosSheet ? geo.header : undefined, iosSheet ? geo.side : modalPage ? MPAGE.side : headerInset(ios, !!nav), iosSheet ? 0 : modalPage ? MPAGE.below : tight ? 0 : undefined)}>
        {left ?? <GlassButton filled={iosSheet && !!closeFilled} actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} />}
        <Text v="h3" accessibilityRole="header" style={styles.title}>
          {title}
        </Text>
        <View style={[styles.right, modalPage && !right && styles.rightSpacer]}>{right}</View>
      </View>
      {scroll ? (
        <ScrollView keyboardDismissMode="on-drag" style={[styles.below, (modalPage || iosSheet) && styles.flush]} contentContainerStyle={[styles.content(insets.bottom), !!footer && styles.contentFooter(insets.bottom)]}>{children}</ScrollView>
      ) : (
        <View style={[styles.body, (modalPage || iosSheet) && styles.flush]}>{children}</View>
      )}
      {footer ? (
        <View
          style={[styles.footer(modalPage ? MPAGE.inset : iosSheet ? geo.side : undefined, insets.bottom + (iosSheet ? geo.bottom : modalPage ? MPAGE.inset : ios ? 6 : 10)), !ios && styles.footerBar]}
        >
          {ios && fadeAbove ? (
            <>
              <View pointerEvents="none" style={styles.cover(fill)} />
              <LinearGradient pointerEvents="none" colors={[`${fill}00`, fill]} style={styles.fade(fadeAbove)} />
            </>
          ) : ios ? (
            <LinearGradient pointerEvents="none" colors={[fill, fill, `${fill}00`]} locations={[0, 0.72, 1]} start={{ x: 0, y: 1 }} end={{ x: 0, y: 0 }} style={styles.inset} />
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
  return <View style={styles.empty(reserve, insets.bottom)}>{children}</View>
}

const styles = StyleSheet.create((theme) => ({
  root: (fill: string, top: number | undefined, page: boolean, insetTop: number) => ({
    flex: 1,
    backgroundColor: fill,
    paddingTop: top ?? (Platform.OS === 'ios' ? (page ? insetTop + 6 : theme.spacing[4]) : sheetHeaderTop(Platform.OS, true, insetTop, GLASS_BUTTON)),
  }),
  header: (minHeight: number | undefined, paddingHorizontal: number, paddingBottom: number | undefined) => ({
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
    minHeight,
    paddingHorizontal,
    paddingBottom: paddingBottom ?? theme.spacing[2],
  }),
  title: { flex: 1, textAlign: 'center' },
  right: { minWidth: 44, alignItems: 'flex-end' },
  rightSpacer: { minWidth: MPAGE.spacer, height: MPAGE.spacer },
  below: { marginTop: theme.spacing[1] },
  body: { flex: 1, marginTop: theme.spacing[1] },
  flush: { marginTop: 0 },
  content: (bottom: number) => ({ flexGrow: 1, gap: theme.spacing[1], paddingBottom: bottom + theme.spacing[6] }),
  contentFooter: (bottom: number) => ({ paddingBottom: bottom + theme.spacing[6] + 80 }),
  footer: (paddingHorizontal: number | undefined, bottom: number) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: paddingHorizontal ?? theme.spacing[4],
    paddingTop: 14,
    paddingBottom: bottom,
  }),
  footerBar: { backgroundColor: theme.colors.bg, borderTopWidth: 1, borderTopColor: theme.colors.line },
  cover: (fill: string) => ({ position: 'absolute', inset: 0, backgroundColor: fill }),
  fade: (height: number) => ({ position: 'absolute', left: 0, right: 0, top: -height, height }),
  inset: { position: 'absolute', inset: 0 },
  empty: (reserve: number, bottom: number) => ({
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    paddingHorizontal: EMPTY_INSET,
    paddingBottom: Math.max(reserve - theme.spacing[6] - bottom, 0),
  }),
}))

export default PageModal
