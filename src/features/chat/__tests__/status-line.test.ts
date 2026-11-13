import { describe, expect, it } from 'vitest'
import { STATUS_STEPS, canStop, lineFromWorking, statusLineView, type StatusLine } from '../utils/status-line'

const at = (ms: number) => new Date(ms)
const NOW = at(161_000)

const run = (line: StatusLine) => statusLineView(line, NOW)

describe('statusLineView', () => {
  it('words the queue and keeps the idle mascot', () => {
    const since = at(161_000 - 12_000)
    expect(run({ kind: 'run', phase: 'queued', since, ahead: 0 })).toMatchObject({
      mascot: 'idle',
      tone: 'neutral',
      text: '순서를 기다리는 중',
      tail: '12초',
      role: 'status',
      accessibilityLabel: '순서를 기다리는 중 12초',
    })
    expect(run({ kind: 'run', phase: 'queued', since, ahead: 1 }).text).toBe('순서를 기다리는 중 · 앞에 작업 1개')
  })

  it('prints the server sentence for thinking, working, and waiting', () => {
    expect(run({ kind: 'run', phase: 'thinking', since: at(NOW.getTime() - 4_000), text: '생각 중' })).toMatchObject({
      mascot: 'think',
      tone: 'neutral',
      text: '생각 중',
      tail: '4초',
      accessibilityLabel: '생각 중 4초',
    })
    expect(run({ kind: 'run', phase: 'working', since: at(NOW.getTime() - 38_000), text: '공고 요건을 읽는 중' })).toMatchObject({
      mascot: 'work',
      tone: 'neutral',
      text: '공고 요건을 읽는 중',
      tail: '38초',
    })
    expect(run({ kind: 'waiting', since: at(NOW.getTime() - 72_000), for: 'answer', cardId: 'c', text: '답을 기다리고 있어요' })).toMatchObject({
      mascot: 'help',
      tone: 'help',
      text: '답을 기다리고 있어요',
      tail: '1분 12초',
    })
    expect(run({ kind: 'waiting', since: at(NOW.getTime() - 24_000), for: 'confirm', cardId: 'c', text: '확인을 기다리고 있어요' }).tail).toBe('24초')
  })

  it('keeps both stop notices grey', () => {
    expect(run({ kind: 'stopped', resumable: true })).toMatchObject({
      mascot: 'idle',
      tone: 'neutral',
      text: '작업을 중지했어요 · 어떻게 할지 알려 주세요',
      tail: null,
      role: 'status',
    })
    expect(run({ kind: 'stopped', resumable: false })).toMatchObject({
      mascot: 'idle',
      tone: 'neutral',
      text: '중지했어요. 고치던 내용은 반영하지 않았어요.',
      tail: null,
    })
  })

  it('draws a failed step and an error with its reason', () => {
    expect(run({ kind: 'failed', text: '방향 검증에서 문제가 생겼어요' })).toMatchObject({
      mascot: 'idle',
      tone: 'danger',
      text: '방향 검증에서 문제가 생겼어요',
      tail: null,
    })
    expect(run({ kind: 'error', code: 'DISCONNECTED', reason: '연결 끊김' })).toMatchObject({
      mascot: 'idle',
      tone: 'danger',
      text: '작업 중 문제가 생겼어요',
      tail: '연결 끊김',
      role: 'alert',
      accessibilityLabel: '작업 중 문제가 생겼어요 연결 끊김',
    })
  })

  it('clamps a clock that is behind the server at 0초', () => {
    expect(statusLineView({ kind: 'run', phase: 'thinking', since: at(10_000), text: '생각 중' }, at(0)).tail).toBe('0초')
  })

  it('prints the 13 step sentences in board order', () => {
    expect(STATUS_STEPS).toEqual([
      '서류를 읽는 중',
      '공고 요건을 읽는 중',
      '필수·우대 스택을 뽑는 중',
      '기술 스택을 비교하는 중',
      '경력 수준을 비교하는 중',
      '적합도를 계산하는 중',
      '고칠 곳을 고르는 중',
      '경력 섹션을 쓰는 중',
      '자기소개서를 쓰는 중',
      '서류 양식을 고르는 중',
      'PDF로 만드는 중',
      '결과를 검토하는 중',
      '내 서류에 저장하는 중',
    ])
    for (const text of STATUS_STEPS) {
      expect(run({ kind: 'run', phase: 'working', since: NOW, text })).toMatchObject({ mascot: 'work', tone: 'neutral', text, tail: '0초' })
    }
  })

  it('reads a stored thinking verb as 생각 중 and can stop only a run', () => {
    expect(lineFromWorking(['생각하는 중…'], NOW)).toMatchObject({ phase: 'thinking', text: '생각 중' })
    expect(lineFromWorking(['대기 중'], NOW)).toMatchObject({ phase: 'queued', ahead: 0 })
    expect(canStop([{ kind: 'run', phase: 'working', since: NOW, text: '결과를 검토하는 중' }])).toBe(true)
    expect(canStop([{ kind: 'stopped', resumable: true }])).toBe(false)
  })
})
