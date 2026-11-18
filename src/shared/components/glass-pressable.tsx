import type { ReactNode } from 'react'
import { useRef } from 'react'
import { Pressable, TextInput, View, type ColorValue, type PressableProps, type StyleProp, type ViewStyle } from 'react-native'
import { useColors, useShadow, type Colors } from '../../theme'
import { toBoxShadow } from '../utility'
import { DISABLED_OPACITY, PRESS_SCALE } from './constants'
import Glass, { useGlassSurface, useSheetGlassFill } from './glass'

type Props = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  contentStyle?: StyleProp<ViewStyle>
  glass?: boolean
  tint?: ColorValue
  fill?: keyof Colors | null
  pressedFill?: keyof Colors
  dimOpacity?: number
}

export const dbgLog: string[] = []
export const dbgSubs = new Set<() => void>()
export const dbg = (m: string) => { dbgLog.push(`${Date.now() % 100000}:${m}`); dbgSubs.forEach((f) => f()) }
let hbLast = Date.now()
setInterval(() => { const n = Date.now(); if (n - hbLast > 350) dbg(`stall${n - hbLast}`); hbLast = n }, 100)
const CONTENT: ViewStyle = { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }

// iOS glass answers presses natively (isInteractive); a JS scale around it would move the shape apart from its glass.
const GlassPressable = ({ children, style, contentStyle, glass = true, tint, fill = 'fill', pressedFill, disabled, dimOpacity = DISABLED_OPACITY, ...press }: Props) => {
  const c = useColors()
  const box = useRef<View>(null)
  const native = useGlassSurface() && glass
  const sheetFill = useSheetGlassFill()
  const sheetGlass = glass ? sheetFill : null
  const boxShadow = toBoxShadow(useShadow().glass)
  const dim = disabled ? { opacity: dimOpacity } : null
  if (native) {
    return (
      <Glass interactive tint={tint} style={style}>
        <Pressable {...press} onPressIn={(e) => { dbg(`pin:${disabled ? 'dis' : 'en'}`); press.onPressIn?.(e) }} onTouchStart={() => dbg('ts')} disabled={disabled} style={[CONTENT, { flexGrow: 1 }, contentStyle, dim]}>
          {children}
        </Pressable>
      </Glass>
    )
  }
  return (
    <Pressable
      {...press}
      onPressIn={(e) => { dbg(`pin2:${disabled ? 'dis' : 'en'}`); press.onPressIn?.(e) }}
      ref={box}
      onTouchStart={(e) => {
        const t = e.nativeEvent
        dbg(`ts2 n=${(e as unknown as { touchHistory?: { numberActiveTouches: number } }).touchHistory?.numberActiveTouches} t=${e.nativeEvent.touches?.length} p=${Math.round(t.pageX)},${Math.round(t.pageY)} f=${TextInput.State.currentlyFocusedInput() ? 1 : 0}`)
        box.current?.measureInWindow((x, y, w, h) => dbg(`box ${Math.round(x)},${Math.round(y)},${Math.round(w)}x${Math.round(h)}`))
      }}
      onTouchEnd={() => { dbg('te'); box.current?.measureInWindow((x, y, w, h) => dbg(`boxE ${Math.round(x)},${Math.round(y)},${Math.round(w)}x${Math.round(h)}`)) }}
      onTouchCancel={() => dbg('tc')}
      onResponderReject={() => dbg('rej')}
      disabled={disabled}
      android_ripple={{ color: c[pressedFill ?? 'fill2'], foreground: true }}
      style={({ pressed }) => [
        {
          overflow: 'hidden',
          backgroundColor: sheetGlass ?? (fill ? c[pressed && pressedFill ? pressedFill : fill] : undefined),
          boxShadow: sheetGlass ? boxShadow : undefined,
          transform: [{ scale: pressed ? PRESS_SCALE : 1 }],
        },
        style,
        dim,
      ]}
    >
      <View style={[CONTENT, { flexGrow: 1 }, contentStyle]}>{children}</View>
    </Pressable>
  )
}

export default GlassPressable
