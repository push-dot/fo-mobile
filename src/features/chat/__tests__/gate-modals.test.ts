import { describe, expect, it, vi } from 'vitest'
import type { ChoiceModalRequest } from '@/shared/navigation'
import { gateTable, openGate, type GateHooks } from '../utils/gate-modals'
import type { Approval, DiffLine, PlanItem } from '../types'
import type { ReviewPageRequest } from '../review-page'

const base = (patch: Partial<Approval>): Approval => ({ id: 'a1', question: '어떤 방식으로 진행할까요?', sections: [], optionIds: [], ...patch })

const run = (approval: Approval, hooks: Partial<GateHooks> = {}) => {
  const shown: ChoiceModalRequest[] = []
  const h: GateHooks = { answer: vi.fn(), say: vi.fn(), change: vi.fn(), ...hooks }
  openGate(approval, h, (request) => shown.push(request))
  return { shown, h }
}

const ph0 = base({
  sections: [{ kind: 'choices', selected: [0], items: [{ label: '이력서부터 쓸게요' }, { label: '경험부터 정리할게요' }, { label: '닫기' }] }],
  optionIds: ['0', '1', '2'],
})

describe('openGate: a single pick (ChatPh0)', () => {
  it('is one regular modal with a row per option, no stop row and no button', () => {
    const { shown, h } = run(ph0)
    expect(shown).toHaveLength(1)
    expect(shown[0]!.items!.map((i) => i.label)).toEqual(['이력서부터 쓸게요', '경험부터 정리할게요'])
    expect(shown[0]!.confirm).toBeUndefined()
    shown[0]!.items![1]!.onPress()
    expect(h.answer).toHaveBeenCalledWith('경험부터 정리할게요', 1)
  })

  it('hands the floor to the composer when swiped away', () => {
    const { shown, h } = run(ph0)
    shown[0]!.onDismiss!()
    expect(h.say).toHaveBeenCalledOnce()
  })

  it('keeps 거절 on a permission card', () => {
    const { shown } = run(base({ confirm: true, sections: [{ kind: 'choices', selected: [], items: [{ label: '한 번 허용' }, { label: '거절' }] }] }))
    expect(shown[0]!.items!.map((i) => i.label)).toEqual(['한 번 허용', '거절'])
  })

  it('shows the plan the question is about as a table (ChatPh1Feedback)', () => {
    const table = { head: ['항목', '지금', '고칠 점'], rows: [['키워드', 'Kafka 없음', '경험 문장에 넣기']] }
    expect(run(ph0, { table }).shown[0]!.table).toBe(table)
  })
})

describe('openGate: several picks (ChatPh2XPrevent)', () => {
  const prevent = base({
    question: '어떤 문제를 예방할까요?',
    submit: '이대로 진행',
    sections: [{ kind: 'choices', selected: [], multi: true, items: [{ label: '성능' }, { label: '보안' }, { label: '닫기' }] }],
  })

  it('is one modal of checks whose button counts the picks, with the stop row left to the swipe', () => {
    const { shown, h } = run(prevent)
    const form = shown[0]!.form!
    expect(form.options.map((o) => o.label)).toEqual(['성능', '보안'])
    expect(form.multi).toBe(true)
    expect(form.confirmLabel([0, 1], false)).toBe('2개로 진행하기')
    form.onConfirm([1], false)
    expect(h.answer).toHaveBeenCalledWith('보안', [1])
  })
})

describe('openGate: sections (ChatPh0Input)', () => {
  const input = base({
    question: '어떤 산출물을 만들까요?',
    submit: '시작하기',
    secondary: '닫기',
    optionIds: ['submit', 's0.0', 's0.1', 's2.0', 's2.1', 'cancel'],
    sections: [
      { kind: 'chips', id: 's0', title: '만들 것', options: ['이력서', '포트폴리오'], ids: ['s0.0', 's0.1'], selected: [0], multi: true },
      { kind: 'rows', id: 's1', title: '가져올 자료', items: [{ id: 'a', tag: '', title: '허브 프로필', sub: '기본 서류' }, { id: 'b', tag: '', title: '백엔드 엔지니어', sub: '모아페이', action: 'change' }] },
      { kind: 'chips', id: 's2', title: '말투', options: ['전문적으로', '원래 말투로'], ids: ['s2.0', 's2.1'], selected: [1] },
    ],
  })

  it('is one modal per question, shown in sequence, the last with the card\'s own button', () => {
    const { shown, h } = run(input)
    expect(shown).toHaveLength(1)
    expect(shown[0]!.form!.confirmLabel([0], false)).toBe('다음')
    shown[0]!.form!.onConfirm([0], false)
    expect(shown).toHaveLength(2)
    expect(shown[1]!.confirm!.label).toBe('다음')
    expect(shown[1]!.items!.map((i) => i.label)).toEqual(['백엔드 엔지니어'])
    shown[1]!.confirm!.onPress()
    expect(shown).toHaveLength(3)
    expect(shown[2]!.form!.confirmLabel([1], false)).toBe('시작하기')
    expect(h.answer).not.toHaveBeenCalled()
    shown[2]!.form!.onConfirm([1], false)
    expect(h.answer).toHaveBeenCalledWith('이력서만 · 자료 2개 · 원래 말투로', [0, 1, 4])
  })

  it('keeps the card detail on the first rows step and does not repeat the step title in the message', () => {
    const rowsFirst = base({
      question: '자료를 확인해 주세요',
      detail: '아래 자료로 만들어요.',
      submit: '시작하기',
      sections: [{ kind: 'rows', id: 's1', title: '가져올 자료', items: [{ id: 'a', tag: '', title: '허브 프로필', sub: '기본 서류' }] }],
    })
    expect(run(rowsFirst).shown[0]!.message).toBe('아래 자료로 만들어요.\n허브 프로필 · 기본 서류')
    const second = run(input)
    second.shown[0]!.form!.onConfirm([0], false)
    expect(second.shown[1]!.title).toBe('가져올 자료')
    expect(second.shown[1]!.message).toBe('허브 프로필 · 기본 서류')
  })

  it('opens the material change and shows the same question again when it is done', () => {
    const { shown, h } = run(input)
    shown[0]!.form!.onConfirm([0], false)
    shown[1]!.items![0]!.onPress()
    expect(h.change).toHaveBeenCalledOnce()
    ;(h.change as ReturnType<typeof vi.fn>).mock.calls[0]![1]()
    expect(shown).toHaveLength(3)
    expect(shown[2]!.title).toBe('가져올 자료')
  })

  it('shows no modal on a modal: each step is asked only after the one before is answered', () => {
    expect(run(input).shown).toHaveLength(1)
  })
})

describe('openGate: a last toggle section with {n} and zeroSubmit', () => {
  const counted = base({
    question: '반영할 항목',
    submit: '{n}개 반영하고 디자인으로',
    zeroSubmit: '그대로 디자인으로',
    optionIds: ['submit', 'a', 'b'],
    sections: [{ kind: 'toggle', selected: [], ids: ['a', 'b'], items: [{ label: '가' }, { label: '나' }] }],
  })

  it('builds the button label from the picks and allows submitting none', () => {
    const { shown, h } = run(counted)
    const form = shown[0]!.form!
    expect(form.allowEmpty).toBe(true)
    expect(form.confirmLabel([], false)).toBe('그대로 디자인으로')
    expect(form.confirmLabel([0, 1], false)).toBe('2개 반영하고 디자인으로')
    form.onConfirm([], false)
    expect(h.answer).toHaveBeenCalledWith('그대로 디자인으로', [0])
  })

  it('needs a pick when the card has no zeroSubmit', () => {
    expect(run({ ...counted, zeroSubmit: undefined }).shown[0]!.form!.allowEmpty).toBeUndefined()
  })
})

describe('openGate: a last single pick with no button of its own', () => {
  it('answers by being tapped', () => {
    const { shown, h } = run(base({ question: '말투', optionIds: ['submit', 't0', 't1'], sections: [{ kind: 'chips', id: 's', options: ['짧게', '자신 있게'], ids: ['t0', 't1'], selected: [] }] }))
    expect(shown[0]!.items!.map((i) => i.label)).toEqual(['짧게', '자신 있게'])
    shown[0]!.items![1]!.onPress()
    expect(h.answer).toHaveBeenCalledWith('자신 있게', [0, 2])
  })
})

describe('openGate: a proposed edit (ChatApprove)', () => {
  const edit = base({ question: '수정 적용', detail: '경력 섹션 3줄을 고쳤어요.', submit: '적용', secondary: '그대로 두기', optionIds: ['apply', 'keep'] })
  const lines: DiffLine[] = [{ sign: '-', text: '결제 API 개발' }, { sign: '+', text: '결제 승인 API 재설계' }]

  it('opens the page of the changed document, not a sentence or a confirm modal', () => {
    const opened: ReviewPageRequest[] = []
    const { shown, h } = run(edit, { review: { lines, open: (r) => opened.push(r) } })
    expect(shown).toEqual([])
    expect(opened).toHaveLength(1)
    expect(opened[0]!.lines).toBe(lines)
    opened[0]!.apply!()
    expect(h.answer).toHaveBeenLastCalledWith('적용', 0)
    opened[0]!.undo!()
    expect(h.answer).toHaveBeenLastCalledWith('되돌리기', 1)
    opened[0]!.onDismiss!()
    expect(h.say).toHaveBeenCalledOnce()
  })

  it('has no 되돌리기 when the server sent no second option', () => {
    const opened: ReviewPageRequest[] = []
    run({ ...edit, secondary: undefined }, { review: { lines, open: (r) => opened.push(r) } })
    expect(opened[0]!.undo).toBeUndefined()
  })

  it('falls back to a plain confirm that names no message when no lines came', () => {
    const { shown, h } = run(edit, { review: { lines: [], open: vi.fn() } })
    expect(shown[0]!.message).toBeUndefined()
    expect(shown[0]!.confirm!.label).toBe('적용')
    shown[0]!.confirm!.secondary!.onPress()
    expect(h.answer).toHaveBeenLastCalledWith('되돌리기', 1)
  })
})

describe('openGate: the design card (ChatPh4Design)', () => {
  it('is one form with the switch row', () => {
    const { shown } = run(
      base({
        question: '디자인',
        submit: '클래식으로 만들기',
        submitLabels: { t0: '클래식으로 만들기' },
        optionIds: ['submit', 't0', 'photo'],
        sections: [
          { kind: 'templates', selected: [0], items: [{ id: 't0', label: '클래식' }] },
          { kind: 'toggle', selected: [0], ids: ['photo'], items: [{ label: '사진' }] },
        ],
      }),
    )
    expect(shown[0]!.form!.selected).toEqual([0])
    expect(shown[0]!.form!.toggle).toEqual({ label: '사진', on: true })
  })
})

describe('gateTable', () => {
  const plan: PlanItem = { type: 'plan', id: 's-feedback', title: '피드백', meta: '', keywords: [], rows: [{ tag: '키워드', label: 'Kafka 없음', note: '경험 문장에 넣기' }] }
  it('reads the plan the bot showed since the user last spoke', () => {
    expect(gateTable([{ type: 'user', id: 'u', text: 'a' }, plan])).toEqual({ head: ['항목', '지금', '고칠 점'], rows: [['키워드', 'Kafka 없음', '경험 문장에 넣기']] })
    expect(gateTable([plan, { type: 'user', id: 'u', text: 'a' }])).toBeUndefined()
  })

  it('leaves the blueprints to the bubble list', () => {
    expect(gateTable([{ ...plan, id: 'bp', rows: [{ tag: '통과', label: '큐', note: '' }] }])).toBeUndefined()
  })
})
