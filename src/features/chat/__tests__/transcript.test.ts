import { describe, expect, it } from 'vitest'
import { applyTranscript, emptyTranscript, projectTranscript, type TranscriptEvent, type TranscriptState } from '../utils/reducer'
import { statusLineView } from '../utils/status-line'

const turn = (turnId: string): TranscriptEvent => ({ type: 'turn', turnId })
const bots = (state: TranscriptState) => state.entries.filter((entry) => entry.type === 'bot')
const noticeOf = (state: TranscriptState) => {
  const entry = state.entries.find((item) => item.type === 'notice')
  if (entry?.type !== 'notice') throw new Error('missing notice')
  return entry.notice
}
const thinking = { kind: 'run' as const, phase: 'thinking' as const, since: new Date(0), text: '생각 중' }
const working = { kind: 'run' as const, phase: 'working' as const, since: new Date(0), text: '공고 요건을 읽는 중' }
const waiting = { kind: 'waiting' as const, since: new Date(0), for: 'answer' as const, cardId: 'c1', text: '답을 기다리고 있어요' }

describe('applyTranscript', () => {
  it('keeps text around a tool call as two bot entries, live and stored', () => {
    const live: TranscriptEvent[] = [
      turn('t1'),
      { type: 'token', text: '좋아' },
      { type: 'token', text: '요.' },
      { type: 'status', line: thinking },
      { type: 'boundary' },
      { type: 'token', text: '다음' },
      { type: 'end', outcome: 'done', sources: [{ id: 's', title: '공고' }] },
    ]
    const stored = live.filter((event) => event.type !== 'status')
    const fromLive = projectTranscript(live)
    const fromStored = projectTranscript(stored)
    expect(bots(fromLive).map((entry) => entry.text)).toEqual(['좋아요.', '다음'])
    expect(bots(fromLive)).toEqual(bots(fromStored))
    expect(fromLive.entries.filter((entry) => entry.type !== 'status')).toEqual(fromStored.entries)
    expect(bots(fromLive)[0]).toMatchObject({ id: 't1:bot:0', sources: [] })
    expect(bots(fromLive)[1]).toMatchObject({ id: 't1:bot:1', sources: [{ id: 's', title: '공고' }] })
  })

  it('grows the open bot when a later status moves in front of it', () => {
    const live: TranscriptEvent[] = [
      turn('t1'),
      { type: 'status', line: thinking },
      { type: 'token', text: '좋아' },
      { type: 'status', line: working },
      { type: 'token', text: '요.' },
    ]
    const stored = live.filter((event) => event.type !== 'status')
    const fromLive = projectTranscript(live)
    const fromStored = projectTranscript(stored)
    expect(bots(fromLive).map((entry) => entry.text)).toEqual(['좋아요.'])
    expect(bots(fromLive)).toEqual(bots(fromStored))
  })

  it('keeps one run line and moves a new one to the end', () => {
    const state = projectTranscript([turn('t1'), { type: 'status', line: thinking }, { type: 'token', text: 'a' }, { type: 'status', line: working }])
    expect(state.entries.filter((entry) => entry.type === 'status')).toHaveLength(1)
    expect(state.entries.map((entry) => entry.type)).toEqual(['bot', 'status'])
    expect(state.entries[1]).toMatchObject({ line: working })
    expect(state.entries[0]).toMatchObject({ text: 'a' })
  })

  it('removes a waiting line on answer, a new turn, and every end except paused', () => {
    const open = projectTranscript([turn('t1'), { type: 'status', line: waiting }, { type: 'status', line: working }])
    expect(applyTranscript(open, { type: 'answered' }).entries.some((entry) => entry.type === 'status' && entry.line.kind === 'waiting')).toBe(false)
    expect(applyTranscript(open, turn('t2')).entries.some((entry) => entry.type === 'status' && entry.line.kind === 'waiting')).toBe(false)
    const paused = applyTranscript(open, { type: 'end', outcome: 'paused' })
    expect(paused.entries.some((entry) => entry.type === 'status' && entry.line.kind === 'waiting')).toBe(true)
    expect(paused.entries.some((entry) => entry.type === 'status' && entry.line.kind === 'run')).toBe(false)
    expect(paused.entries.some((entry) => entry.type === 'notice')).toBe(false)
    const done = applyTranscript(open, { type: 'end', outcome: 'done' })
    expect(done.entries.some((entry) => entry.type === 'status')).toBe(false)
    expect(done.entries.some((entry) => entry.type === 'notice')).toBe(false)
  })

  it('appends a stop or error notice once, and a second end changes nothing', () => {
    const open = projectTranscript([turn('t1'), { type: 'status', line: working }])
    const stopped = applyTranscript(open, { type: 'end', outcome: 'stopped', resumable: true })
    expect(stopped.entries.filter((entry) => entry.type === 'status')).toHaveLength(0)
    expect(statusLineView(noticeOf(stopped), new Date(0)).text).toBe('작업을 중지했어요 · 어떻게 할지 알려 주세요')
    const dropped = applyTranscript(open, { type: 'end', outcome: 'stopped', resumable: false })
    expect(statusLineView(noticeOf(dropped), new Date(0)).tone).toBe('quiet')
    const failed = applyTranscript(open, { type: 'end', outcome: 'error', code: 'DISCONNECTED', reason: '연결 끊김' })
    expect(statusLineView(noticeOf(failed), new Date(0))).toMatchObject({
      text: '작업 중 문제가 생겼어요',
      tail: '연결 끊김',
    })
    expect(applyTranscript(stopped, { type: 'end', outcome: 'done' })).toBe(stopped)
  })

  it('ignores a frame whose seq is not newer', () => {
    const once = applyTranscript(applyTranscript(emptyTranscript, turn('t1'), 1), { type: 'token', text: 'a' }, 2)
    expect(applyTranscript(once, { type: 'token', text: 'b' }, 2)).toBe(once)
    expect(applyTranscript(once, { type: 'token', text: 'b' }, 3).entries[0]).toMatchObject({ text: 'ab' })
  })

  it('replaces an entry in place only inside the same turn', () => {
    let state = projectTranscript([turn('t1'), { type: 'entry', entry: { type: 'card', id: 't1:card', text: 'a' } }])
    state = applyTranscript(state, { type: 'entry', entry: { type: 'card', id: 't1:card', text: 'b' } })
    expect(state.entries).toEqual([{ type: 'card', id: 't1:card', text: 'b' }])
    state = applyTranscript(state, turn('t2'))
    state = applyTranscript(state, { type: 'entry', entry: { type: 'card', id: 't1:card', text: 'c' } })
    expect(state.entries).toEqual([{ type: 'card', id: 't1:card', text: 'b' }])
  })
})
