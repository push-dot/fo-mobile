import type { StreamEvent } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import { applyEvent, emptyChat } from '../utils/reducer'
import { fromStream, mapEvent } from '../utils/stream'
import { isVerdictPlan, planTone, sectionLabel, sectionPicks, submitLabelFor } from '../utils/stream-v3'
import type { Approval, ChatItem } from '../types'

const profile = (): ChatItem => ({
  type: 'result',
  id: 'result-d1',
  source: 'profile',
  checklist: [],
  documentId: 'd1',
  actions: [{ id: 'view', label: '프로필 보기' }],
  name: '김서준',
  headline: '백엔드',
  title: '김서준 · 백엔드',
  subtitle: 'Push 프로필',
})

describe('stream v3', () => {
  it('drops an unknown type and keeps the next frame', async () => {
    expect(mapEvent({ type: 'nope' } as unknown as StreamEvent)).toEqual([])
    async function* frames(): AsyncGenerator<StreamEvent> {
      yield { type: 'nope' } as unknown as StreamEvent
      yield { type: 'token', text: '계속', seq: 1 }
      yield { type: 'done', operation: null, seq: 2 }
    }
    const out = []
    for await (const event of fromStream(frames(), async function* () {})) out.push(event)
    expect(out.map((event) => event.type)).toEqual(['token', 'done'])
  })

  it('maps think', () => {
    expect(mapEvent({ type: 'think', seconds: 6, phase: 'strategy', seq: 3 })).toEqual([{ type: 'think', id: 'think-3', seconds: 6 }])
  })

  it('maps plan', () => {
    const [item] = mapEvent({
      type: 'plan',
      id: 'strategy',
      title: '수정 전략',
      meta: '섹션 2개',
      rows: [
        { tag: '강화', label: '경력', note: '성과를 앞으로' },
        { tag: '기타', label: '소개', note: '짧게' },
      ],
      keywords: ['결제'],
      seq: 4,
    })
    expect(item).toMatchObject({
      type: 'plan',
      id: 'strategy',
      keywords: ['결제'],
      rows: [
        { tag: '강화', tone: 'ac', label: '경력' },
        { tag: '기타', tone: 'grey', label: '소개' },
      ],
    })
  })

  it('tells a blueprint list (verdict tags only) from a tagged plan', () => {
    expect(isVerdictPlan([{ tag: '통과' }, { tag: '조건부' }])).toBe(true)
    expect(isVerdictPlan([{ tag: '통과' }, { tag: '강화' }])).toBe(false)
    expect(isVerdictPlan([])).toBe(false)
    expect([planTone('통과'), planTone('조건부')]).toEqual(['green', 'orange'])
  })

  it('maps paper', () => {
    expect(mapEvent({ type: 'paper', id: 'draft-resume-v1', label: '이력서 초안 v1', heading: '김서준', lines: ['한 줄'], seq: 1 })).toEqual([
      { type: 'paper', id: 'draft-resume-v1', label: '이력서 초안 v1', heading: '김서준', lines: ['한 줄'] },
    ])
  })

  it('draws the recommended (else first) single-choice row selected, and none for multi', () => {
    const options = [{ id: 'a', label: '하나' }, { id: 'b', label: '둘' }]
    const sel = (ev: StreamEvent) => {
      const [out] = mapEvent(ev)
      return out?.type === 'approval' ? out.approval : undefined
    }
    expect(sel({ type: 'choice', id: 'x', options })?.sections[0]).toMatchObject({ selected: [0] })
    expect(sel({ type: 'choice', id: 'x', options, recommended: 'b' })?.sections[0]).toMatchObject({ selected: [1] })
    const multi = sel({ type: 'choice', id: 'x', options, multiple: true })
    expect(multi?.sections[0]).toMatchObject({ selected: [] })
    expect(multi?.foot).toBe('여러 개 고를 수 있어요')
  })

  it('a sectioned multi card carries the multi foot; toggle rows put sub on the second line; templates get a layout', () => {
    const [ev] = mapEvent({
      type: 'choice',
      id: 'g',
      options: [],
      sections: [
        { id: 'p', kind: 'chips', multiple: true, options: [{ id: 'perf', label: '성능' }], selected: [] },
        { id: 'q', kind: 'toggle', options: [{ id: 'tone', label: '말투 통일하기', sub: '“~했음”과 “~했습니다”가 섞였어요' }], selected: [] },
        { id: 't', kind: 'thumbnails', options: [{ id: 'MODERN', label: '모던' }, { id: 'ATS', label: 'ATS' }, { id: 'X', label: '컴팩트' }, { id: 'CLASSIC', label: '클래식' }], selected: [] },
      ],
    })
    const a = ev?.type === 'approval' ? ev.approval : undefined
    expect(a?.foot).toBe('여러 개 고를 수 있어요')
    expect(a?.sections[1]).toMatchObject({ items: [{ label: '말투 통일하기', desc: '“~했음”과 “~했습니다”가 섞였어요' }] })
    expect(a?.sections[2]).toMatchObject({ items: [{ layout: 'modern' }, { layout: 'ats' }, { layout: 'compact' }, { layout: 'classic' }] })
  })

  it('multi-section choice skips the number list', () => {
    const [ev] = mapEvent({
      type: 'choice',
      id: 'g',
      title: '어떤 산출물을 만들까요?',
      options: [{ id: 'resume', label: '이력서' }],
      sections: [
        { id: 'targets', kind: 'chips', title: '어떤 산출물을 만들까요?', multiple: true, options: [{ id: 'resume', label: '이력서' }], selected: ['resume'] },
        { id: 'materials', kind: 'rows', title: '가져올 자료', options: [{ id: 'm1', label: '파일.pdf', sub: '마이 › 서류', action: 'change' }] },
        { id: 'later', kind: 'later' },
      ],
      submit: { label: '다음' },
    } as StreamEvent)
    expect(ev).toMatchObject({ type: 'approval' })
    if (ev?.type !== 'approval') return
    expect(ev.approval.sections.map((s) => s.kind)).toEqual(['chips', 'rows'])
    expect(ev.approval.optionIds).not.toContain('m1')
    expect(ev.approval.sections.some((s) => s.kind === 'choices')).toBe(false)
    expect(ev.approval.submit).toBe('다음')
  })

  it('auto section choice is a line, not a panel', () => {
    expect(
      mapEvent({
        type: 'choice',
        id: 'q',
        auto: true,
        recommended: 'rec1',
        options: [{ id: 'rec1', label: '숫자로 성과 쓰기' }],
        sections: [{ id: 'recs', kind: 'toggle', options: [{ id: 'rec1', label: '숫자로 성과 쓰기' }], selected: ['rec1'] }],
        submit: { label: '{n}개 반영하고 디자인으로' },
      } as StreamEvent),
    ).toEqual([{ type: 'agentText', id: 'auto-q', text: '자동으로 골랐어요: 숫자로 성과 쓰기' }])
  })

  it('template submit label follows the selected thumbnail', () => {
    const approval: Approval = {
      id: 'r',
      question: '디자인',
      sections: [],
      submit: '만들기',
      submitLabels: { CLASSIC: '클래식으로 만들기', MODERN: '모던으로 만들기' },
      zeroSubmit: '그대로 디자인으로',
    }
    expect(submitLabelFor(approval, { templateId: 'CLASSIC', toggleCount: 1 })).toBe('클래식으로 만들기')
    expect(submitLabelFor({ ...approval, submit: '{n}개 반영하고 디자인으로' }, { toggleCount: 0 })).toBe('그대로 디자인으로')
    expect(submitLabelFor({ ...approval, submit: '{n}개 반영하고 디자인으로' }, { toggleCount: 2 })).toBe('2개 반영하고 디자인으로')
  })

  it('review card answers submit with the picked thumbnail and toggle', () => {
    const [ev] = mapEvent({
      type: 'choice',
      id: 'r',
      gate: 'review',
      title: '검증을 마쳤어요. 어떤 디자인을 적용할까요?',
      recommended: 'CLASSIC',
      options: [
        { id: 'CLASSIC', label: '클래식', badge: '추천' },
        { id: 'MODERN', label: '모던' },
        { id: 'cancel', label: '그만하기' },
      ],
      sections: [
        { id: 'template', kind: 'thumbnails', options: [{ id: 'CLASSIC', label: '클래식', badge: '추천' }, { id: 'MODERN', label: '모던' }], selected: ['CLASSIC'] },
        { id: 'photo', kind: 'toggle', options: [{ id: 'photo', label: '프로필 사진 넣기', desc: '마이 › 프로필 사진을 써요 · 모든 템플릿' }], selected: ['photo'] },
      ],
      submit: { label: '만들기', optionLabels: { CLASSIC: '클래식으로 만들기', MODERN: '모던으로 만들기' } },
    })
    if (ev?.type !== 'approval') throw new Error('expected approval')
    const a = ev.approval
    expect(a.optionIds).toEqual(['submit', 'CLASSIC', 'MODERN', 'photo', 'cancel'])
    expect(a.secondary).toBe('그만하기')
    const ids = (sel: number[][]) => sectionPicks(a, sel).map((i) => a.optionIds![i])
    expect(ids([[1], [0]])).toEqual(['submit', 'MODERN', 'photo'])
    expect(ids([[0], []])).toEqual(['submit', 'CLASSIC'])
    expect(submitLabelFor(a, { templateId: 'MODERN', toggleCount: 1 })).toBe('모던으로 만들기')
    expect(sectionLabel(a, [[1], [0]])).toBe('모던으로 만들기')
  })

  it('material rows are not answers and know their icon', () => {
    const [ev] = mapEvent({
      type: 'choice',
      id: 'g',
      title: '어떤 산출물을 만들까요?',
      options: [{ id: 'resume', label: '이력서' }],
      sections: [
        {
          id: 'materials',
          kind: 'rows',
          title: '가져올 자료',
          options: [
            { id: 'm_posting', label: '백엔드 엔지니어', sub: '홈 › 북마크 공고', badge: '모', action: 'change' },
            { id: 'm_github', label: 'github.com/seojun-kim', sub: '이력서에서 찾았어요', action: 'change' },
          ],
        },
      ],
      submit: { label: '다음' },
    })
    if (ev?.type !== 'approval') throw new Error('expected approval')
    const [rows] = ev.approval.sections
    expect(rows).toMatchObject({ kind: 'rows', items: [{ tag: '모', ac: true }, { tag: 'link', ac: false }] })
    expect(sectionPicks(ev.approval, [[]]).map((i) => ev.approval.optionIds![i])).toEqual(['submit'])
  })

  it('choice without note does not set pendingNote', () => {
    const [ev] = mapEvent({ type: 'choice', id: 'c', title: '확인', options: [{ id: 'ok', label: '확인했어요' }] })
    expect(ev).toMatchObject({ type: 'approval', approval: { sections: [{ kind: 'choices' }] } })
    if (ev?.type !== 'approval') return
    expect(ev.approval.pendingNote).toBeUndefined()
  })

  it('choice note sticks to the profile result', () => {
    const note = 'PDF는 Push 프로필에서 내보낼 수 있어요.'
    const [ev] = mapEvent({ type: 'choice', id: 'c', title: '확인', note, options: [{ id: 'ok', label: '확인했어요' }, { id: 'stop', label: '그만하기' }] })
    if (ev?.type !== 'approval') throw new Error('expected approval')
    let s = applyEvent({ ...emptyChat, items: [profile()] }, ev)
    const card = s.items.find((it) => it.type === 'result' && it.source === 'profile')
    expect(card).toMatchObject({ pendingNote: note })
    s = applyEvent(s, { type: 'answer', text: '확인했어요' })
    const cleared = s.items.find((it) => it.type === 'result' && it.source === 'profile')
    expect(cleared).toMatchObject({ pendingNote: undefined })
  })

  it('answering the choice clears the note', () => {
    const [ev] = mapEvent({
      type: 'choice',
      id: 'c',
      note: '메모',
      options: [{ id: 'ok', label: '확인' }],
      resolution: { status: 'APPROVED', optionId: 'ok' },
    })
    if (ev?.type !== 'approval') throw new Error('expected approval')
    expect(ev.approval.pendingNote).toBeUndefined()
  })
})
