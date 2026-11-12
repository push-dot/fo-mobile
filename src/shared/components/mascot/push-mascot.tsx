import { useEffect, useMemo, useState } from 'react'
import { Animated, Easing, View, type ViewStyle } from 'react-native'
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
  heldPose,
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
import { BADGE, BODY, DOTS, EYE, EYE_REACH, EYES_AT, FOLD_IN, FOLD_OUT, LOOK_UP, MOUTH, PAD, SMILE_WIDTH, SMILES, SPARKS, UNREAD } from './shapes'

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
type Drivers = { body: Animated.Value; blink: Animated.Value; marks: Animated.Value; look: Animated.Value }

const STILL: MascotMotion = { mode: 'still' }
const BOX = 100 + PAD * 2

const EASE: Record<CssEasing, (t: number) => number> = {
  ease: Easing.bezier(0.25, 0.1, 0.25, 1),
  'ease-in-out': Easing.bezier(0.42, 0, 0.58, 1),
  'ease-out': Easing.bezier(0, 0, 0.58, 1),
}

const newDrivers = (): Drivers => ({
  body: new Animated.Value(0),
  blink: new Animated.Value(0),
  marks: new Animated.Value(0),
  look: new Animated.Value(0),
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

const square = (x: number, y: number, reach: number, unit: number): ViewStyle => ({
  position: 'absolute',
  left: (x - reach) * unit,
  top: (y - reach) * unit,
  width: reach * 2 * unit,
  height: reach * 2 * unit,
})

const viewBoxAround = (x: number, y: number, reach: number) => `${x - reach} ${y - reach} ${reach * 2} ${reach * 2}`

const layersOf = (state: MascotState, mode: MascotMotion['mode'], size: number, d: Drivers) => {
  const unit = size / 100
  const track = bodyTrackOf(state)
  const up = EYES[state] === 'up'
  if (mode !== 'animate') {
    const t = poseTransform(heldPose(state, mode), size)
    return {
      body: { transformOrigin: track?.origin, transform: [{ rotate: `${t.rotate}deg` }, { translateY: t.translateY }, { scaleY: t.scaleY }, { scale: t.scale }] } as AnimatedStyle,
      eyes: { transform: [{ translateX: up ? LOOK_UP.x * unit : 0 }, { translateY: up ? LOOK_UP.y * unit : 0 }, { scaleY: HELD.lid }] } as AnimatedStyle,
      dots: DOTS.xs.map(() => HELD.dot as number | Animated.AnimatedInterpolation<number>),
      spark: null,
      runs: [],
    }
  }
  const body = track && cycle(d.body, track)
  const spark = MARK[state] === 'sparks' ? cycle(d.marks, SPARK, 0) : null
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
        { scaleY: state === 'idle' ? cycle(d.blink, BLINK)((v) => v.lid) : HELD.lid },
      ],
    } as AnimatedStyle,
    dots: MARK[state] === 'dots' ? DOTS.xs.map((_, i) => cycle(d.marks, DOT, (1 - (i * DOT_STAGGER_MS) / DOT.duration) % 1)((v) => v.opacity)) : [],
    spark: spark && ({ opacity: spark((v) => v.opacity), transform: [{ scale: spark((v) => v.scale) }] } as AnimatedStyle),
    runs: [
      ...(track ? [loop(d.body, track.duration)] : []),
      ...(state === 'idle' ? [loop(d.blink, BLINK.duration)] : []),
      ...(up ? [once(d.look, LOOK_UP_MS, 0, EASE.ease)] : []),
      ...(MARK[state] === 'dots' ? [loop(d.marks, DOT.duration)] : []),
      ...(MARK[state] === 'sparks' ? [once(d.marks, SPARK.duration, SPARK_DELAY_MS)] : []),
    ],
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

const Mascot = ({ size = 36, state = 'idle', color = 'push', motion = STILL, unread = false, accessibilityLabel }: MascotProps) => {
  const accent = mascotAccent(useColors())
  const pal = mascotPalette(color, useThemeMode())
  const shown = useSettledState(state)
  const resolved = resolveMotion(motion, useReduceMotion())
  const delayMs = resolved.mode === 'animate' ? (resolved.delayMs ?? 0) : 0
  const [drivers] = useState(newDrivers)
  const layers = useMemo(() => layersOf(shown, resolved.mode, size, drivers), [shown, resolved.mode, size, drivers])

  useEffect(() => {
    if (!layers.runs.length) return
    Object.values(drivers).forEach((driver) => driver.setValue(0))
    const timer = setTimeout(() => layers.runs.forEach((run) => run.start()), delayMs)
    return () => {
      clearTimeout(timer)
      layers.runs.forEach((run) => run.stop())
    }
  }, [layers, drivers, delayMs])

  const unit = size / 100
  const eyes = EYES[shown]
  const mark = MARK[shown]
  const labelled = accessibilityLabel != null
  const dot = UNREAD.dot * size
  const ring = UNREAD.ring * size

  return (
    <View
      accessible={labelled}
      accessibilityRole={labelled ? 'image' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityElementsHidden={!labelled}
      importantForAccessibility={labelled ? 'yes' : 'no-hide-descendants'}
      style={{ width: size, height: size, pointerEvents: 'none' }}
    >
      <Animated.View style={[{ width: size, height: size }, layers.body]}>
        <Svg width={BOX * unit} height={BOX * unit} viewBox={`${-PAD} ${-PAD} ${BOX} ${BOX}`} style={{ position: 'absolute', left: -PAD * unit, top: -PAD * unit }}>
          <Path d={BODY} fill={pal.body} />
          <Path d={FOLD_OUT} fill={pal.foldDark} />
          <Path d={FOLD_IN} fill={pal.foldLight} />
          {eyes === 'smile'
            ? SMILES.map((d) => <Path key={d} d={d} fill="none" stroke={MASCOT_FACE.eye} strokeWidth={SMILE_WIDTH} strokeLinecap="round" />)
            : null}
          <Path d={MOUTH.d} transform={MOUTH.transform} fill={MASCOT_FACE.mouth} />
          {mark === 'badge' ? (
            <>
              <Circle cx={BADGE.x} cy={BADGE.y} r={BADGE.r} fill={accent.helpBadge} />
              <Path d={BADGE.bar} stroke={accent.helpMark} strokeWidth={BADGE.barWidth} strokeLinecap="round" />
              <Circle cx={BADGE.x} cy={BADGE.dotY} r={BADGE.dotR} fill={accent.helpMark} />
            </>
          ) : null}
        </Svg>
        {eyes === 'smile'
          ? null
          : EYES_AT.map((eye) => (
              <Animated.View key={eye.x} style={[square(eye.x, eye.y, EYE_REACH, unit), layers.eyes]}>
                <Svg width={EYE_REACH * 2 * unit} height={EYE_REACH * 2 * unit} viewBox={viewBoxAround(eye.x, eye.y, EYE_REACH)}>
                  <Ellipse cx={eye.x} cy={eye.y} rx={EYE.rx} ry={EYE.ry} transform={`rotate(${EYE.tilt} ${eye.x} ${eye.y})`} fill={MASCOT_FACE.eye} />
                  <Ellipse
                    cx={eye[eyes].x}
                    cy={eye[eyes].y}
                    rx={EYE.pupilRx}
                    ry={EYE.pupilRy}
                    transform={`rotate(${EYE.tilt} ${eye[eyes].x} ${eye[eyes].y})`}
                    fill={MASCOT_FACE.pupil}
                  />
                </Svg>
              </Animated.View>
            ))}
        {mark === 'dots'
          ? DOTS.xs.map((x, i) => (
              <Animated.View
                key={x}
                style={[square(x, DOTS.y, DOTS.r, unit), { borderRadius: DOTS.r * unit, backgroundColor: accent.thinkDot, opacity: layers.dots[i] }]}
              />
            ))
          : null}
        {mark === 'sparks' && layers.spark
          ? SPARKS.map((s) => (
              <Animated.View key={s.d} style={[square(s.x, s.y, s.reach, unit), layers.spark]}>
                <Svg width={s.reach * 2 * unit} height={s.reach * 2 * unit} viewBox={viewBoxAround(s.x, s.y, s.reach)}>
                  <Path d={s.d} fill={accent.doneSpark} />
                </Svg>
              </Animated.View>
            ))
          : null}
      </Animated.View>
      {unread ? (
        <View
          style={{
            position: 'absolute',
            top: -(UNREAD.out * size + ring),
            right: -(UNREAD.out * size + ring),
            width: dot + ring * 2,
            height: dot + ring * 2,
            borderRadius: dot / 2 + ring,
            backgroundColor: accent.ring,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ width: dot, height: dot, borderRadius: dot / 2, backgroundColor: accent.unread }} />
        </View>
      ) : null}
    </View>
  )
}

export default Mascot
