import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

// The codemod that turned the mock's reducer-event steps into wire frames, one rule per kind of step.
const { convert } = createRequire(import.meta.url)('../../../../scripts/mock-wire-frames.cjs') as { convert: (source: string) => string }

const scripts = (body: string) => `// ---------- scripted runs ----------
const s = (wait: number, event: ChatEvent): Step => ({ wait, event })
${body}
// The scripted run answers QUEUE_BUSY as an error line.
`
const run = (...steps: string[]) => convert(scripts(`const run: Step[] = [\n${steps.map((x) => `  ${x},`).join('\n')}\n]`))

describe('mock-wire-frames codemod', () => {
  it('keeps one sentence per status, as a status frame carries', () => {
    expect(run(`s(200, status('훑어보는 중…', '읽어 보는 중…'))`)).toContain(`s(200, status('훑어보는 중…'))`)
    expect(run(`s(100, status(...(added < 0 ? ['맞춰보는 중…', '견주어 보는 중…'] : ['다시 맞춰보는 중…'])))`)).toContain(
      `s(100, status(added < 0 ? '맞춰보는 중…' : '다시 맞춰보는 중…'))`,
    )
  })

  it('sends a line as a token and a choice the run made as an auto-picked card', () => {
    expect(run(`s(700, agent('hi', '좋아요.'))`)).toContain(`s(700, agent('좋아요.'))`)
    expect(run(`s(400, agent('auto1', '자동으로 골랐어요: 모던 템플릿'))`)).toContain(`s(400, autoPicked('auto1', '모던 템플릿'))`)
    expect(run(`...say('bye', '알겠어요.')`, `...fail('err', 'UNKNOWN', DEFAULT_ERROR_TEXT)`)).toContain(`...say('알겠어요.'),\n  ...fail('UNKNOWN'),`)
  })

  it('moves the closing line into the result frame, with the waits of both', () => {
    const out = run(`s(300, agent('done', '다 됐어요! 적합도를 **6.9 → 8.1**로 올렸어요.', BULLETS))`, `s(200, { type: 'result', id: 'result', source: 'profile', documentId: 'd1', actions: [] })`)
    expect(out).toContain(`s(500, {\n    type: 'result',\n    source: 'profile',\n    taskLine: '',\n    documentId: 'd1',\n    actions: [],\n    ...closing('다 됐어요! 적합도를 **6.9 → 8.1**로 올렸어요.', BULLETS),\n  })`)
    expect(() => run(`s(300, agent('done', '다 됐어요!', BULLETS))`, `done`)).toThrow('must sit right before its result card')
    expect(() => run(`s(200, { type: 'result', id: 'result', source: 'profile' })`)).toThrow('needs the closing line')
  })

  it('turns each numbered card variant into the frame push-be sends for it', () => {
    expect(run(`ask(numbered('ph2x-level', '강도?', LEVELS, PICK_HINT, [1]))`)).toContain(`ask(numbered('ph2x-level', '강도?', LEVELS, 1))`)
    expect(run(`ask({ ...numbered('present', '확인할까요?', OK), pendingNote: 'PDF는 …' })`)).toContain(`ask({ ...numbered('present', '확인할까요?', OK), note: 'PDF는 …' })`)
    expect(run(`ask({ ...numbered('apply', '지원해요', ['실행', '취소']), foot: undefined, warning: '취소할 수 없어요' })`)).toContain(
      `ask(confirm(numbered('apply', '지원해요', ['실행', '취소']), '취소할 수 없어요'))`,
    )
    expect(run(`ask({ ...numbered('ph2x-prevent', '무엇을?', PREVENT, MULTI_PICK_FOOT), submit: MULTI_PICK_SUBMIT, sections: [] })`)).toContain(
      `ask({ ...numbered('ph2x-prevent', '무엇을?', PREVENT), multiple: true })`,
    )
    expect(run(`ask({ ...numbered('ph2x-verify', '다시 고를까요?', AGAIN), foot: undefined })`)).toContain(`ask({ ...numbered('ph2x-verify', '다시 고를까요?', AGAIN), gate: HINTLESS_GATES[0] })`)
  })

  it('turns an apply-or-keep card into a document edit card', () => {
    expect(run(`ask({ id: 'tailor-apply', question: '적용할까요?', sections: [], submit: '적용', secondary: '그대로 두기', foot: PICK_HINT })`)).toContain(
      `kind: 'DOCUMENT_EDIT',\n    title: '적용할까요?',\n    documentId: DOC,\n    options: [{ id: 'apply', label: '적용' }, { id: 'keep', label: '그대로 두기' }],`,
    )
  })

  it('turns a section card into a choice with sections, ids for every pick, and 그만하기 as cancel', () => {
    const out = run(`ask({
    id: 'ph4-design',
    question: '어떤 디자인?',
    sections: [
      { kind: 'chips', multi: true, options: ['이력서', '포트폴리오'], selected: [0] },
      { kind: 'rows', title: '가져올 자료', items: [{ tag: 'PDF', title: RESUME, sub: '마이 › 서류', ac: true, action: 'change' }, { tag: 'link', title: 'github.com/x', sub: '이력서에서 찾았어요' }] },
      { kind: 'templates', items: [{ id: 't0', label: '클래식', layout: 'classic', recommended: true }, { id: 't1', label: '모던', layout: 'modern' }], selected: [0] },
      { kind: 'toggle', items: [{ label: '사진', desc: '모든 템플릿' }], selected: [], ids: ['photo'] },
    ],
    submit: '클래식으로 만들기',
    submitLabels: { t0: '클래식으로 만들기', t1: '모던으로 만들기' },
    zeroSubmit: '그대로',
    secondary: '그만하기',
    answer: '1번',
  })`)
    expect(out).toContain(`options: [{ id: 'cancel', label: '그만하기' }],\n    recommended: 't0',`)
    expect(out).toContain(`{ kind: 'chips', id: 's0', multiple: true, options: [{ id: 's0.0', label: '이력서' }, { id: 's0.1', label: '포트폴리오' }], selected: ['s0.0'] },`)
    expect(out).toContain(`{ id: 's1.0', label: RESUME, sub: '마이 › 서류', badge: 'PDF', action: 'change' },`)
    expect(out).toContain(`{ id: 'm_github', label: 'github.com/x', sub: '이력서에서 찾았어요' },`)
    expect(out).toContain(`{ kind: 'thumbnails', id: 's2', options: [{ id: 't0', label: '클래식' }, { id: 't1', label: '모던' }], selected: ['t0'] },`)
    expect(out).toContain(`{ kind: 'toggle', id: 's3', options: [{ id: 'photo', label: '사진', desc: '모든 템플릿' }], selected: [] },`)
    expect(out).toContain(`submit: { label: '클래식으로 만들기', zeroLabel: '그대로', optionLabels: { t0: '클래식으로 만들기', t1: '모던으로 만들기' } },`)
    expect(out).not.toContain('1번')
  })

  it('renames the card fields of fit, diff, plan, think, and a failed tool to their wire names', () => {
    const fit = run(`s(300, { type: 'fit', id: 'fit1', score: 6.9, caption: '보통', rows: [{ label: '기술 스택', score: 7.5 }, { label: '도메인', score: 5.0 }], ...(ultra ? { projected: { label: '8점대', bullets: B } } : {}) })`)
    expect(fit).toContain(`score: 6.9,\n    band: '보통',\n    parts: { techStack: 7.5, domain: 5.0 },\n    ...(ultra ? { projected: { score: 8, label: '8점대', bullets: B } } : {}),`)
    expect(() => run(`s(300, { type: 'fit', id: 'f', score: 1, rows: [{ label: '모름', score: 1 }] })`)).toThrow('unknown fit row')
    expect(run(`s(200, { type: 'diff', id: 'diff3', lines: [{ n: 12, sign: '-', text: 'a' }, { sign: '~', text: 'b' }] })`)).toContain(
      `type: 'diff', documentId: DOC, revisionId: 'diff3',\n    hunks: [\n      { line: 12, sign: '-', text: 'a' },\n      { line: null, sign: MOVED, text: 'b' },\n    ],`,
    )
    expect(run(`s(300, { type: 'plan', id: 'fbplan', title: '', meta: '', rows: [{ tag: '성과', tone: 'grey', label: 'l', note: 'n' }], keywords: [] })`)).toContain(
      `id: 'feedback',\n    title: '',\n    meta: '',\n    rows: [\n      { tag: '성과', label: 'l', note: 'n' },\n    ],`,
    )
    expect(run(`s(200, { type: 'think', id: 'think', seconds: 6 })`)).toContain(`s(200, { type: 'think', seconds: 6, phase: 'think' })`)
    expect(run(`s(1500, { type: 'tool', id: 'jd', action: '공고 읽기', target: T, state: 'err', error: '못 읽었어요' })`)).toContain(
      `s(1500, { ...tool('jd', '공고 읽기', T, 'err'), result: { error: '못 읽었어요' } })`,
    )
  })

  it('replaces the old builders with frame builders and keeps the route state in chat.ts', () => {
    const out = convert(scripts(`const status = (...verbs: string[]): ChatEvent => ({ type: 'status', verbs })
// Per conversation: the scenario.
const scenario = new Map<string, string>()
let seq = 0
const next: Record<string, Step[]> = {}`))
    expect(out).toContain(`const s = (wait: number, frame: Frame): Step => ({ wait, frame })`)
    expect(out).toContain(`export const next: Record<string, Step[]> = {}`)
    expect(out).not.toMatch(/ChatEvent|scenario|let seq/)
  })
})
