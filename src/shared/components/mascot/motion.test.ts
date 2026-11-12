import { describe, expect, it } from 'vitest'
import {
  BLINK,
  bodyTrackOf,
  EYES,
  HELD,
  MARK,
  poseTransform,
  resolveMotion,
  REST,
  sampleCycle,
  settleMs,
  SPARK,
  valueAt,
} from './motion'

const linear = (t: number) => t

describe('a mascot held on keyframe ③ of the AgentHomeMascot board', () => {
  it.each([
    ['idle', { ...REST, scale: 1.03 }],
    ['work', { ...REST, rotate: 6 }],
    ['help', REST],
  ] as const)('%s holds the board pose, where its loop begins and ends', (state, expected) => {
    const points = sampleCycle(bodyTrackOf(state)!, linear)
    expect(points[0]).toEqual({ at: 0, value: expected })
    expect(points.at(-1)).toEqual({ at: 1, value: expected })
  })

  it.each(['think', 'done'] as const)('%s keeps its body still', (state) => {
    expect(bodyTrackOf(state)).toBeUndefined()
  })

  it('keeps its eyes open and all three dots full, with no spark left', () => {
    expect(HELD).toEqual({ lid: 1, dot: 1, spark: 0 })
  })

  it('draws the face and the mark of its state', () => {
    expect(EYES).toEqual({ idle: 'open', think: 'up', work: 'open', help: 'open', done: 'smile' })
    expect(MARK).toEqual({ idle: null, think: 'dots', work: null, help: 'badge', done: 'sparks' })
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

  it('the lids shut for 120 ms and reopen in 160 ms at the end of each 4 s', () => {
    const at = (ms: number) => valueAt(BLINK, ms / BLINK.duration).lid
    expect([at(0), at(3720), at(3840), at(4000)]).toEqual([1, 1, 0.12, 1])
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
