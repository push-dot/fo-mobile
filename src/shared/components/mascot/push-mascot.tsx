import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Animated, Easing, PixelRatio, View, type ViewStyle } from 'react-native'
import Svg, { Circle, Ellipse, Path } from 'react-native-svg'
import { useColors, useThemeMode } from '../../../theme'
import { MASCOT_FACE, mascotAccent, mascotPalette, type MascotColor } from '../../../theme/mascot'
import { useReduceMotion } from '../use-reduce-motion'
import {
  BLINK,
  bodyTrackOf,
  DOT,
  DOT_STAGGER_MS,
  EYES,
  HELD,
  LOOK_UP_MS,
  MARK,
  poseTransform,
  resolveMotion,
  sampleCycle,
  settleMs,
  SPARK,
  SPARK_DELAY_MS,
  type CssEasing,
  type MascotMotion,
  type MascotState,
  type Track,
} from './motion'
import { BADGE, BODY, DOTS, EYE, EYE_REACH, EYES_AT, FOLD_IN, FOLD_OUT, LOOK_UP, MOUTH, SMILE_WIDTH, SMILES, SPARKS, UNREAD } from './shapes'

export type MascotProps = {
  size?: number
  state?: MascotState
  color?: MascotColor
  motion?: MascotMotion
  unread?: boolean
  /** The state has no visible label, so a mascot that shows one names it here. Without a label the mascot is decoration. */
  accessibilityLabel?: string
}

type AnimatedStyle = Animated.WithAnimatedValue<ViewStyle>
type Drivers = { body: Animated.Value; blink: Animated.Value; dots: Animated.Value; look: Animated.Value; spark: Animated.Value }

const STILL: MascotMotion = { mode: 'still' }

// react-native-svg cuts a numeric width or height down to a whole number, which squeezes a layer that is a fraction of a
// point wide. Every Svg fills a view that carries the exact size.
const FILL = { width: '100%', height: '100%' } as const

const EASE: Record<CssEasing, (t: number) => number> = {
  ease: Easing.bezier(0.25, 0.1, 0.25, 1),
  'ease-in-out': Easing.bezier(0.42, 0, 0.58, 1),
  'ease-out': Easing.bezier(0, 0, 0.58, 1),
}

// Where each driver rests while a mascot holds keyframe ③. A loop begins at 0, the frame it holds. The dots rest below 0,
// because no moment of their staggered loop shows all three full. The eyes have risen and the spark has gone.
const HOLD: Record<keyof Drivers, number> = { body: 0, blink: 0, dots: -1, look: 1, spark: 1 }

const DRIVERS = Object.keys(HOLD) as (keyof Drivers)[]

const newDrivers = (): Drivers => ({
  body: new Animated.Value(HOLD.body),
  blink: new Animated.Value(HOLD.blink),
  dots: new Animated.Value(HOLD.dots),
  look: new Animated.Value(HOLD.look),
  spark: new Animated.Value(HOLD.spark),
})

// Every run is one linear native timing, so a loop never returns to JS. The easing lives in the sampled interpolation.
const loop = (driver: Animated.Value, duration: number) =>
  Animated.loop(Animated.timing(driver, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: true }))

const once = (driver: Animated.Value, duration: number, delay = 0, easing = Easing.linear) =>
  Animated.timing(driver, { toValue: 1, duration, delay, easing, useNativeDriver: true })

const cycle = <T extends Record<string, number>>(driver: Animated.Value, track: Track<T>, start?: number) => {
  const points = sampleCycle(track, EASE[track.easing], start)
  const inputRange = points.map((p) => p.at)
  return (pick: (value: T) => number | string) => driver.interpolate({ inputRange, outputRange: points.map((p) => pick(p.value)) as number[] })
}

const dotOpacity = (d: Drivers, index: number) => {
  const points = sampleCycle(DOT, EASE[DOT.easing], (1 - (index * DOT_STAGGER_MS) / DOT.duration) % 1)
  return d.dots.interpolate({ inputRange: [HOLD.dots, ...points.map((p) => p.at)], outputRange: [HELD.dot, ...points.map((p) => p.value.opacity)] })
}

// A mascot that can move is always drawn from its drivers, also while it holds. A native animation changes a view behind
// React's back, so a plain style equal to the last rendered one would leave the view wherever the animation stopped.
const layersOf = (state: MascotState, moves: boolean, size: number, d: Drivers) => {
  const unit = size / 100
  const track = bodyTrackOf(state)
  const up = EYES[state] === 'up'
  if (!moves) {
    return {
      body: {} as AnimatedStyle,
      eyes: { transform: [{ translateX: up ? LOOK_UP.x * unit : 0 }, { translateY: up ? LOOK_UP.y * unit : 0 }] } as AnimatedStyle,
      dots: DOTS.xs.map(() => ({ opacity: HELD.dot }) as AnimatedStyle),
      spark: null,
      loops: [],
      entry: [],
    }
  }
  const body = track && cycle(d.body, track)
  const spark = MARK[state] === 'sparks' ? cycle(d.spark, SPARK, 0) : null
  const lift = (to: number) => d.look.interpolate({ inputRange: [0, 1], outputRange: [0, to * unit] })
  return {
    body: (body
      ? {
          transformOrigin: track.origin,
          transform: [
            { rotate: body((p) => `${p.rotate}deg`) },
            { translateY: body((p) => poseTransform(p, size).translateY) },
            { scaleY: body((p) => p.squash) },
            { scale: body((p) => p.scale) },
          ],
        }
      : {}) as AnimatedStyle,
    eyes: {
      transform: [
        { translateX: up ? lift(LOOK_UP.x) : 0 },
        { translateY: up ? lift(LOOK_UP.y) : 0 },
        { scaleY: state === 'idle' ? cycle(d.blink, BLINK)((v) => v.lid) : 1 },
      ],
    } as AnimatedStyle,
    dots: MARK[state] === 'dots' ? DOTS.xs.map((_, i) => ({ opacity: dotOpacity(d, i) }) as AnimatedStyle) : [],
    spark: spark && ({ opacity: spark((v) => v.opacity), transform: [{ scale: spark((v) => v.scale) }] } as AnimatedStyle),
    loops: [
      ...(track ? [loop(d.body, track.duration)] : []),
      ...(state === 'idle' ? [loop(d.blink, BLINK.duration)] : []),
      ...(MARK[state] === 'dots' ? [loop(d.dots, DOT.duration)] : []),
    ],
    entry: [...(up ? [once(d.look, LOOK_UP_MS, 0, EASE.ease)] : []), ...(spark ? [once(d.spark, SPARK.duration, SPARK_DELAY_MS)] : [])],
  }
}

const useSettledState = (state: MascotState) => {
  const [shown, setShown] = useState(state)
  const wait = settleMs(shown, state)
  useEffect(() => {
    if (shown === state) return
    const timer = setTimeout(() => setShown(state), wait)
    return () => clearTimeout(timer)
  }, [shown, state, wait])
  return wait ? shown : state
}

type LayerProps = { x: number; y: number; reach: number; unit: number; style?: AnimatedStyle | null; children: ReactNode }

// A part that moves on its own, or that reaches outside the body's box, is drawn in a small layer around (x, y). The
// layer's edges sit on device pixels and its viewBox is those same edges in drawing units, so the part lands where one
// whole drawing would have put it.
const Layer = ({ x, y, reach, unit, style, children }: LayerProps) => {
  const ratio = PixelRatio.get()
  const px = unit * ratio
  const left = Math.floor((x - reach) * px)
  const top = Math.floor((y - reach) * px)
  const width = Math.ceil((x + reach) * px) - left
  const height = Math.ceil((y + reach) * px) - top
  return (
    <Animated.View style={[{ position: 'absolute', left: left / ratio, top: top / ratio, width: width / ratio, height: height / ratio }, style]}>
      <Svg {...FILL} viewBox={`${left / px} ${top / px} ${width / px} ${height / px}`}>
        {children}
      </Svg>
    </Animated.View>
  )
}

const Mascot = ({ size = 36, state = 'idle', color = 'push', motion = STILL, unread = false, accessibilityLabel }: MascotProps) => {
  const accent = mascotAccent(useColors())
  const pal = mascotPalette(color, useThemeMode())
  const shown = useSettledState(state)
  const resolved = resolveMotion(motion, useReduceMotion())
  const delayMs = resolved.mode === 'animate' ? (resolved.delayMs ?? 0) : 0
  const [drivers] = useState(newDrivers)
  const moves = resolved.mode !== 'still'
  const layers = useMemo(() => layersOf(shown, moves, size, drivers), [shown, moves, size, drivers])

  // The eyes rise and the spark plays once when a state begins, not each time a hold ends.
  const entered = useRef(false)
  useEffect(() => {
    entered.current = false
  }, [shown])
  useEffect(() => {
    if (resolved.mode === 'still') return
    if (resolved.mode === 'frame3') {
      // A stopped native animation reports its last value to JS a moment later. Parking each driver after that report
      // leaves JS and native agreeing on the held frame.
      let holding = true
      DRIVERS.forEach((name) => drivers[name].stopAnimation(() => holding && drivers[name].setValue(HOLD[name])))
      return () => {
        holding = false
      }
    }
    const runs = entered.current ? layers.loops : [...layers.loops, ...layers.entry]
    ;[drivers.body, drivers.blink, drivers.dots].forEach((driver) => driver.setValue(0))
    ;[drivers.look, drivers.spark].forEach((driver) => driver.setValue(entered.current ? 1 : 0))
    entered.current = true
    const timer = setTimeout(() => runs.forEach((run) => run.start()), delayMs)
    return () => {
      clearTimeout(timer)
      runs.forEach((run) => run.stop())
    }
  }, [layers, drivers, delayMs, resolved.mode])

  const unit = size / 100
  const eyes = EYES[shown]
  const mark = MARK[shown]
  const labelled = accessibilityLabel != null

  return (
    <View
      accessible={labelled}
      accessibilityRole={labelled ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!labelled}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
      style={{ width: size, height: size, pointerEvents: 'none' }}
    >
      <Animated.View key={moves ? 'moves' : 'still'} style={[{ width: size, height: size }, layers.body]}>
        <Svg {...FILL} viewBox="0 0 100 100">
          <Path d={BODY} fill={pal.body} />
          <Path d={FOLD_OUT} fill={pal.foldDark} />
          <Path d={FOLD_IN} fill={pal.foldLight} />
          {eyes === 'smile'
            ? SMILES.map((d) => <Path key={d} d={d} fill="none" stroke={MASCOT_FACE.eye} strokeWidth={SMILE_WIDTH} strokeLinecap="round" />)
            : null}
          <Path d={MOUTH.d} transform={MOUTH.transform} fill={MASCOT_FACE.mouth} />
        </Svg>
        {eyes === 'smile'
          ? null
          : EYES_AT.map((eye) => (
              <Layer key={eye.x} x={eye.x} y={eye.y} reach={EYE_REACH} unit={unit} style={layers.eyes}>
                <Ellipse cx={eye.x} cy={eye.y} rx={EYE.rx} ry={EYE.ry} transform={`rotate(${EYE.tilt} ${eye.x} ${eye.y})`} fill={MASCOT_FACE.eye} />
                <Ellipse
                  cx={eye[eyes].x}
                  cy={eye[eyes].y}
                  rx={EYE.pupilRx}
                  ry={EYE.pupilRy}
                  transform={`rotate(${EYE.tilt} ${eye[eyes].x} ${eye[eyes].y})`}
                  fill={MASCOT_FACE.pupil}
                />
              </Layer>
            ))}
        {mark === 'dots'
          ? DOTS.xs.map((x, i) => (
              <Layer key={x} x={x} y={DOTS.y} reach={DOTS.r} unit={unit} style={layers.dots[i]}>
                <Circle cx={x} cy={DOTS.y} r={DOTS.r} fill={accent.thinkDot} />
              </Layer>
            ))
          : null}
        {mark === 'badge' ? (
          <Layer x={BADGE.x} y={BADGE.y} reach={BADGE.r} unit={unit}>
            <Circle cx={BADGE.x} cy={BADGE.y} r={BADGE.r} fill={accent.helpBadge} />
            <Path d={BADGE.bar} stroke={accent.helpMark} strokeWidth={BADGE.barWidth} strokeLinecap="round" />
            <Circle cx={BADGE.x} cy={BADGE.dotY} r={BADGE.dotR} fill={accent.helpMark} />
          </Layer>
        ) : null}
        {mark === 'sparks' && layers.spark
          ? SPARKS.map((s) => (
              <Layer key={s.d} x={s.x} y={s.y} reach={s.reach} unit={unit} style={layers.spark}>
                <Path d={s.d} fill={accent.doneSpark} />
              </Layer>
            ))
          : null}
      </Animated.View>
      {unread ? (
        <Layer x={UNREAD.x} y={UNREAD.y} reach={UNREAD.ring} unit={unit}>
          <Circle cx={UNREAD.x} cy={UNREAD.y} r={UNREAD.ring} fill={accent.ring} />
          <Circle cx={UNREAD.x} cy={UNREAD.y} r={UNREAD.r} fill={accent.unread} />
        </Layer>
      ) : null}
    </View>
  )
}

export default Mascot
