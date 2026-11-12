import { describe, expect, it } from 'vitest'
import {
  BLINK,
  bodyTrackOf,
  dotCycle,
  EYES,
  HELD,
  HOLD,
  MARK,
  MASCOT_STATES,
  poseTransform,
  resolveMotion,
  sampleCycle,
  settleMs,
  SPARK,
  valueAt,
  type MascotState,
} from './motion'
import { LOOK_UP } from './shapes'

const linear = (t: number) => t

const valueOn = <T>(points: readonly { at: number; value: T }[], input: number) => points.find((p) => p.at === input)?.value

// What a mascot shows while its drivers rest at HOLD, read through the same cycles push-mascot.tsx interpolates.
const held = (state: MascotState) => {
  const track = bodyTrackOf(state)
  const body = track && valueOn(sampleCycle(track, linear), HOLD.body)
  return {
    body: track && body ? { origin: track.origin, ...poseTransform(body, 100) } : null,
    eyes: EYES[state],
    lid: state === 'idle' ? valueOn(sampleCycle(BLINK, linear), HOLD.blink)?.lid : HELD.lid,
    look: EYES[state] === 'up' ? { x: LOOK_UP.x * HOLD.look, y: LOOK_UP.y * HOLD.look } : null,
    dots: MARK[state] === 'dots' ? [0, 1, 2].map((i) => valueOn(dotCycle(i, linear), HOLD.dots)) : null,
    badge: MARK[state] === 'badge',
    spark: MARK[state] === 'sparks' ? valueOn(sampleCycle(SPARK, linear, 0), HOLD.spark) : null,
  }
}

const still = { rotate: 0, translateY: 0, scaleY: 1, scale: 1 }

// The ③ frames of AgentHomeMascot (version 396), as the harness HOLD table reads the board's keyframes.
const FRAME_3: Record<MascotState, ReturnType<typeof held>> = {
  idle: { body: { origin: '50% 90%', ...still, scale: 1.03 }, eyes: 'open', lid: 1, look: null, dots: null, badge: false, spark: null },
  think: { body: null, eyes: 'up', lid: 1, look: { x: 2.5, y: -4 }, dots: [1, 1, 1], badge: false, spark: null },
  work: { body: { origin: '50% 90%', ...still, rotate: 6 }, eyes: 'open', lid: 1, look: null, dots: null, badge: false, spark: null },
  help: { body: { origin: '50% 100%', ...still }, eyes: 'open', lid: 1, look: null, dots: null, badge: true, spark: null },
  done: { body: null, eyes: 'smile', lid: 1, look: null, dots: null, badge: false, spark: { opacity: 0, scale: 1 } },
}

describe('a mascot held on keyframe ③ (Reduce Motion, off-screen rows, captures)', () => {
  it.each(MASCOT_STATES)('%s shows the ③ frame of the board', (state) => {
    expect(held(state)).toEqual(FRAME_3[state])
  })

  it.each(['idle', 'work', 'help'] as const)('%s starts its loop on the frame it holds, so a hold ends without a jump', (state) => {
    const points = sampleCycle(bodyTrackOf(state)!, linear)
    expect(points.at(-1)!.value).toEqual(points[0]!.value)
  })

  it('rests the dots outside their loop, the one place all three are full', () => {
    ;[0, 1, 2].forEach((i) => {
      const inputs = dotCycle(i, linear).map((p) => p.at)
      expect(inputs).toEqual([...inputs].sort((a, b) => a - b))
      expect(new Set(inputs).size).toBe(inputs.length)
    })
  })
})

describe('Reduce Motion', () => {
  it('holds a moving mascot on keyframe ③', () => {
    expect(resolveMotion({ mode: 'animate', delayMs: 240 }, true)).toEqual({ mode: 'frame3' })
  })

  it('leaves motion alone when it is off', () => {
    expect(resolveMotion({ mode: 'animate', delayMs: 240 }, false)).toEqual({ mode: 'animate', delayMs: 240 })
  })

  it.each([{ mode: 'still' }, { mode: 'frame3' }] as const)('does not change a $mode mascot', (motion) => {
    expect(resolveMotion(motion, true)).toEqual(motion)
  })
})

describe('board keyframes', () => {
  it('work sinks the same 3 px at every size and tilts 6° each way', () => {
    const work = bodyTrackOf('work')!
    expect(poseTransform(valueAt(work, 0.25), 24)).toEqual({ rotate: 0, translateY: 3, scaleY: 1, scale: 1 })
    expect(poseTransform(valueAt(work, 0.75), 120)).toEqual({ rotate: 0, translateY: 3, scaleY: 1, scale: 1 })
    expect(valueAt(work, 0).rotate).toBe(-6)
    expect(valueAt(work, 0.5).rotate).toBe(6)
  })

  it('help crouches, then jumps 8% of its size', () => {
    const help = bodyTrackOf('help')!
    expect(poseTransform(valueAt(help, 0.72), 100)).toEqual({ rotate: 0, translateY: 0, scaleY: 0.92, scale: 1 })
    expect(poseTransform(valueAt(help, 0.84), 100)).toEqual({ rotate: 0, translateY: -8, scaleY: 1.02, scale: 1 })
  })

  it('blinks once every 4 s, for 280 ms', () => {
    const lid = (ms: number) => valueAt(BLINK, ms / BLINK.duration).lid
    const shut = Array.from({ length: BLINK.duration }, (_, ms) => ms).filter((ms) => lid(ms) < 1)
    expect(BLINK.duration).toBe(4000)
    expect([shut[0]! - 1, shut.at(-1)! + 1]).toEqual([3720, 4000])
    expect(shut).toHaveLength(4000 - 3720 - 1)
    expect(lid(3840)).toBeCloseTo(0.12)
  })

  it('jumps for about 530 ms every 2.4 s, from the deepest crouch to the landing', () => {
    const help = bodyTrackOf('help')!
    const [crouch] = help.keys.reduce((low, key) => (key[1].squash < low[1].squash ? key : low))
    const [landing] = help.keys.find(([at, p]) => at > crouch && p.lift === 0 && p.squash === 1)!
    expect(help.duration).toBe(2400)
    expect(Math.round((landing - crouch) * help.duration)).toBe(528)
  })

  it('the spark grows past its size while it shows, then fades at its size', () => {
    expect([0, 0.4, 1].map((p) => valueAt(SPARK, p))).toEqual([
      { opacity: 0, scale: 0.3 },
      { opacity: 1, scale: 1.15 },
      { opacity: 0, scale: 1 },
    ])
  })
})

describe('a sampled cycle', () => {
  it('gives inputs that only rise, as a native interpolation requires', () => {
    const inputs = sampleCycle(bodyTrackOf('help')!, linear).map((p) => p.at)
    expect(inputs).toEqual([...inputs].sort((a, b) => a - b))
    expect(new Set(inputs).size).toBe(inputs.length)
  })

  it('eases each stretch between two keyframes', () => {
    const half = (t: number) => t * t
    const idle = bodyTrackOf('idle')!
    expect(valueAt(idle, 0.25, half).scale).toBeCloseTo(1.0075)
    expect(valueAt(idle, 0.75, half).scale).toBeCloseTo(1.0225)
  })

  it('a one-shot track ends on its last keyframe', () => {
    expect(sampleCycle(SPARK, linear, 0).at(-1)).toEqual({ at: 1, value: { opacity: 0, scale: 1 } })
  })
})

describe('state flicker', () => {
  it('waits 300 ms before showing a flip between 생각 and 작업', () => {
    expect(settleMs('think', 'work')).toBe(300)
    expect(settleMs('work', 'think')).toBe(300)
  })

  it.each([
    ['think', 'help'],
    ['work', 'done'],
    ['idle', 'work'],
    ['work', 'idle'],
    ['work', 'work'],
  ] as const)('shows %s → %s at once', (from, to) => {
    expect(settleMs(from, to)).toBe(0)
  })
})
