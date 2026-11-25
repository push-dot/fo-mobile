import { isGlassEffectAPIAvailable } from 'expo-glass-effect'
import { Stack, type NativeStackHeaderItem, type NativeStackNavigationOptions } from 'expo-router'
import { useHeaderHeight } from 'expo-router/react-navigation'
import type { ReactElement, ReactNode } from 'react'
import { Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { fontFor, type, useColors, type Colors } from '../../theme'
import GlassButton, { type GlassAction } from './glass-button'
import { headerSymbol } from './header-symbols'
import { menuSections, type MenuAction } from './menu-action'
import TopBar from './top-bar'

type Props = {
  title?: string
  onBack: () => void
  right?: ReactNode
  actions?: GlassAction[]
  titleView?: ReactElement
  transparent?: boolean
}

const ios = Platform.OS === 'ios'

export const nativeBarItems = ios && isGlassEffectAPIAvailable()

const menuItem = (a: MenuAction) => ({
  type: 'action' as const,
  label: a.label,
  icon: a.systemImage ? { type: 'sfSymbol' as const, name: a.systemImage } : undefined,
  state: a.selected ? ('on' as const) : undefined,
  destructive: a.destructive,
  onPress: a.onPress,
})

const barItem = (a: GlassAction, c: Colors): NativeStackHeaderItem => {
  const shared = {
    label: a.label,
    accessibilityLabel: a.label,
    identifier: a.icon,
    icon: { type: 'sfSymbol' as const, name: headerSymbol(a)! },
    tintColor: a.active ? c.acText : a.color ? c[a.color] : undefined,
    badge: a.badge ? { value: a.badge > 99 ? '99+' : a.badge } : undefined,
  }
  if (!a.menu) return { ...shared, type: 'button', onPress: a.onPress ?? (() => undefined) }
  const sections = menuSections(a.menu)
  const items =
    sections.length === 1 && !sections[0]!.title
      ? sections[0]!.actions.map(menuItem)
      : sections.map((s) => ({ type: 'submenu' as const, label: s.title ?? '', inline: true, items: s.actions.map(menuItem) }))
  return { ...shared, type: 'menu', menu: { items } }
}

export const headerActionItems = (actions: GlassAction[], c: Colors): NativeStackHeaderItem[] | undefined =>
  nativeBarItems && actions.every(headerSymbol) ? actions.map((a) => barItem(a, c)) : undefined

export const nativeHeaderOptions = (c: Colors, transparent = false): NativeStackNavigationOptions =>
  ios
    ? {
        headerShown: true,
        title: '',
        headerTransparent: transparent,
        headerBackButtonDisplayMode: 'minimal',
        headerShadowVisible: false,
        headerTintColor: c.t1,
        headerStyle: transparent ? undefined : { backgroundColor: c.bg },
        headerTitleStyle: { ...fontFor('700'), fontSize: type.h3.fontSize, color: c.t1 },
      }
    : {}

const NativeTopBar = ({ title, onBack, right, actions, titleView, transparent = false }: Props) => {
  const c = useColors()
  const glass = actions?.length ? <GlassButton actions={actions} /> : undefined
  if (!ios) return <TopBar title={title} onBack={onBack} right={right ?? glass} left={titleView} transparent={transparent} />
  const items = actions?.length ? headerActionItems(actions, c) : undefined
  const custom = right ?? glass
  return (
    <Stack.Screen
      options={{
        ...nativeHeaderOptions(c, transparent),
        title: title ?? '',
        headerTitle: titleView ? () => titleView : undefined,
        unstable_headerRightItems: items
          ? () => items
          : custom
            ? () => [{ type: 'custom', element: <>{custom}</>, hidesSharedBackground: true }]
            : undefined,
      }}
    />
  )
}

export const useNativeTopBarInset = (fallback: number) => {
  const header = useHeaderHeight()
  const { top } = useSafeAreaInsets()
  return ios ? Math.max(header - top, 0) : fallback
}

export default NativeTopBar
