export const MASCOT_STATES = ['idle', 'think', 'work', 'help', 'done'] as const

export type MascotState = (typeof MASCOT_STATES)[number]

/**
 * still: the plain drawing, for a mascot that never moves (header pill, profile, logo).
 * frame3: a moving mascot held on keyframe ③ of the AgentHomeMascot board (rows off screen, scrolling, captures).
 * animate: the state's motion. `delayMs` keeps bots in one state from moving in step.
 */
export type MascotMotion = { mode: 'still' } | { mode: 'frame3' } | { mode: 'animate'; delayMs?: number }

type Numbers = Record<string, number>

export type Ease = (t: number) => number

export type CssEasing = 'ease' | 'ease-in-out' | 'ease-out'

/** One CSS animation of the board. `keys` are [share of the cycle, value] and `frame3` is where keyframe ③ sits in the cycle. */
export type Track<T extends Numbers> = { duration: number; easing: CssEasing; frame3: number; keys: readonly (readonly [number, T])[] }

/** rotate is in degrees, sink in px, lift a share of the mascot's size, squash a scaleY. */
export type Pose = { scale: number; rotate: number; sink: number; lift: number; squash: number }

export const REST: Pose = { scale: 1, rotate: 0, sink: 0, lift: 0, squash: 1 }

type BodyTrack = Track<Pose> & { origin: string }

const pose = (change: Partial<Pose>): Pose => ({ ...REST, ...change })

const BODY_TRACKS: Partial<Record<MascotState, BodyTrack>> = {
  idle: {
    duration: 3200,
    easing: 'ease-in-out',
    origin: '50% 90%',
    frame3: 0.5,
    keys: [
      [0, REST],
      [0.5, pose({ scale: 1.03 })],
      [1, REST],
    ],
  },
  work: {
    duration: 900,
    easing: 'ease-in-out',
    origin: '50% 90%',
    frame3: 0.5,
    keys: [
      [0, pose({ rotate: -6 })],
      [0.25, pose({ sink: 3 })],
      [0.5, pose({ rotate: 6 })],
      [0.75, pose({ sink: 3 })],
      [1, pose({ rotate: -6 })],
    ],
  },
  // A crouch, then a 530 ms jump from the deepest crouch to the landing, every 2.4 s.
  help: {
    duration: 2400,
    easing: 'ease-out',
    origin: '50% 100%',
    // Keyframe ③ is the landing, after the last keyframe that moves.
    frame3: 0.97,
    keys: [
      [0, REST],
      [0.64, REST],
      [0.72, pose({ squash: 0.92 })],
      [0.84, pose({ lift: -0.08, squash: 1.02 })],
      [0.94, REST],
      [1, REST],
    ],
  },
}

export const bodyTrackOf = (state: MascotState) => BODY_TRACKS[state]

/** One blink of 280 ms every 4 s, from 93 % of the cycle to its end. */
export const BLINK: Track<{ lid: number }> = {
  duration: 4000,
  easing: 'ease',
  frame3: 0.4,
  keys: [
    [0, { lid: 1 }],
    [0.93, { lid: 1 }],
    [0.96, { lid: 0.12 }],
    [1, { lid: 1 }],
  ],
}

/** Every dot runs this cycle, each DOT_STAGGER_MS after the one before. */
export const DOT: Track<{ opacity: number }> = {
  duration: 1400,
  easing: 'ease',
  frame3: 0.4,
  keys: [
    [0, { opacity: 0.15 }],
    [0.4, { opacity: 1 }],
    [1, { opacity: 0.15 }],
  ],
}

export const DOT_STAGGER_MS = 200

/** Plays once, SPARK_DELAY_MS after the state begins. It ends invisible, so a held mascot has no spark. */
export const SPARK: Track<{ opacity: number; scale: number }> = {
  duration: 600,
  easing: 'ease-out',
  frame3: 1,
  keys: [
    [0, { opacity: 0, scale: 0.3 }],
    [0.4, { opacity: 1, scale: 1.15 }],
    [1, { opacity: 0, scale: 1 }],
  ],
}

export const SPARK_DELAY_MS = 400

export const LOOK_UP_MS = 300

export type Eyes = 'open' | 'up' | 'smile'

export const EYES: Record<MascotState, Eyes> = { idle: 'open', think: 'up', work: 'open', help: 'open', done: 'smile' }

export const MARK: Record<MascotState, 'dots' | 'badge' | 'sparks' | null> = { idle: null, think: 'dots', work: null, help: 'badge', done: 'sparks' }

const mix = <T extends Numbers>(a: T, b: T, t: number) => Object.fromEntries(Object.keys(a).map((k) => [k, a[k]! + (b[k]! - a[k]!) * t])) as T

/** The track's value at `progress` (0 to 1). `ease` shapes each stretch between two keyframes, as a CSS timing function does. */
export const valueAt = <T extends Numbers>(track: Track<T>, progress: number, ease: Ease = (t) => t): T => {
  const i = Math.max(1, track.keys.findIndex(([at]) => at >= progress))
  const [from, a] = track.keys[i - 1]!
  const [to, b] = track.keys[i]!
  return mix(a, b, ease((progress - from) / (to - from)))
}

/**
 * One cycle as points for a native interpolation, which cannot ease. Input 0 is the cycle at `start`, keyframe ③ unless
 * told otherwise: a loop that begins on the frame a hold shows does not jump when the hold ends.
 */
export const sampleCycle = <T extends Numbers>(track: Track<T>, ease: Ease, start = track.frame3, steps = 8) => {
  const stops = track.keys.slice(1).flatMap(([to], i) => {
    const from = track.keys[i]![0]
    return Array.from({ length: steps }, (_, k) => from + ((to - from) * k) / steps)
  })
  const inputs = [...new Set([0, ...stops.map((p) => (p - start + 1) % 1)])].sort((a, b) => a - b)
  return [...inputs, 1].map((at) => ({ at, value: valueAt(track, start + at > 1 ? start + at - 1 : start + at, ease) }))
}

/** What the lids, the dots, and the spark show on keyframe ③. */
export const HELD = { lid: valueAt(BLINK, BLINK.frame3).lid, dot: valueAt(DOT, DOT.frame3).opacity, spark: valueAt(SPARK, SPARK.frame3).opacity }

/**
 * Where each driver of a moving mascot rests while it holds keyframe ③. A loop begins at 0, the frame it holds. The dots
 * rest below 0, because no moment of their staggered loop shows all three full. The eyes have risen and the spark has gone.
 */
export const HOLD = { body: 0, blink: 0, dots: -1, look: 1, spark: 1 } as const

/** Dot `index` of 생각 over one loop of the dots driver, each dot DOT_STAGGER_MS behind the one before, and its rest at HOLD. */
export const dotCycle = (index: number, ease: Ease) => [
  { at: HOLD.dots, value: HELD.dot },
  ...sampleCycle(DOT, ease, (1 - (index * DOT_STAGGER_MS) / DOT.duration) % 1).map((p) => ({ at: p.at, value: p.value.opacity })),
]

/** The transform a pose puts on a mascot of `size`. The sink is the same 3 px at every size and the lift grows with it. */
export const poseTransform = (p: Pose, size: number) => ({ rotate: p.rotate, translateY: p.sink + p.lift * size, scaleY: p.squash, scale: p.scale })

/** With Reduce Motion on, a moving mascot holds keyframe ③. */
export const resolveMotion = (motion: MascotMotion, reduceMotion: boolean): MascotMotion =>
  motion.mode === 'animate' && reduceMotion ? { mode: 'frame3' } : motion

const FLICKER: readonly MascotState[] = ['think', 'work']

/** A flip between 생각 and 작업 shows only after it has lasted this long, so short tool calls do not flicker. Any other change shows at once. */
export const settleMs = (from: MascotState, to: MascotState) => (from !== to && FLICKER.includes(from) && FLICKER.includes(to) ? 300 : 0)
