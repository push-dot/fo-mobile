import { describe, expect, it, vi } from 'vitest'
import { createTokenBatch } from '../utils/token-batch'

describe('createTokenBatch', () => {
  it('concatenates pushes into one flush per scheduled frame', () => {
    const flushed: [string, string][] = []
    const scheduled: (() => void)[] = []
    const batch = createTokenBatch(
      (id, text) => flushed.push([id, text]),
      (run) => scheduled.push(run),
    )
    batch.push('c1', 'a')
    batch.push('c1', 'b')
    batch.push('c1', 'c')
    expect(flushed).toEqual([])
    expect(scheduled).toHaveLength(1)
    scheduled[0]!()
    expect(flushed).toEqual([['c1', 'abc']])
  })

  it('splits flushed text when flushNow runs between pushes', () => {
    const flushed: [string, string][] = []
    const scheduled: (() => void)[] = []
    const batch = createTokenBatch(
      (id, text) => flushed.push([id, text]),
      (run) => scheduled.push(run),
    )
    batch.push('c1', 'one')
    batch.flushNow('c1')
    batch.push('c1', 'two')
    scheduled[0]!()
    expect(flushed).toEqual([
      ['c1', 'one'],
      ['c1', 'two'],
    ])
  })

  it('keeps pending buffers separate per conversation id', () => {
    const flushed: [string, string][] = []
    const scheduled: (() => void)[] = []
    const batch = createTokenBatch(
      (id, text) => flushed.push([id, text]),
      (run) => scheduled.push(run),
    )
    batch.push('a', '1')
    batch.push('b', '2')
    scheduled[0]!()
    scheduled[1]!()
    expect(flushed).toEqual([
      ['a', '1'],
      ['b', '2'],
    ])
  })

  it('does not double-flush after flushNow when the scheduled callback runs', () => {
    const flushed: [string, string][] = []
    const scheduled: (() => void)[] = []
    const batch = createTokenBatch(
      (id, text) => flushed.push([id, text]),
      (run) => scheduled.push(run),
    )
    batch.push('c1', 'x')
    batch.flushNow('c1')
    scheduled[0]!()
    expect(flushed).toEqual([['c1', 'x']])
  })
})
