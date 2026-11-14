import type { ChatIntent } from '@push/api-client'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { emptyChat } from '../utils/reducer'
import { isStop } from '../utils/multi-pick'
import { sectionLabel, sectionPicks } from '../utils/stream-v3'
import type { Approval, ChatState } from '../types'

// Every scripted run the mock can play, driven through the real store as the chat screen drives it.
// The snapshot holds what each path leaves on screen, so a change to how runs are played shows up as a diff.

vi.mock('@/shared/infrastructure', () => ({ api: {}, http: {}, API_MOCK: true, hapticImpactLight: vi.fn(), hapticNotify: vi.fn() }))
vi.mock('@/features/my/api/fetchers', () => ({ myApi: {} }))
vi.mock('@/shared/components/toast-store', () => ({ showToast: vi.fn() }))
// Each path plays on a fresh mock, whose transport play() puts here.
const transport = vi.hoisted(() => ({ fetch: undefined as typeof fetch | undefined }))
vi.mock('../api/fetchers', () => {
  const unused = () => {
    throw new Error('a mock run never calls the live chat routes')
  }
  return {
    chatApi: {
      run: async (body: unknown) => {
        const res = await transport.fetch!(new Request('http://x/api/v1/chat/runs', { method: 'POST', body: JSON.stringify(body) }))
        return ((await res.json()) as { data: unknown }).data
      },
    },
    fetchConversationMessages: unused,
    fetchConversationTurns: unused,
    followConversation: unused,
    resolveConversationApproval: unused,
    streamConversation: unused,
    updateAiAccessMode: unused,
  }
})

type Act =
  | { kind: 'say'; text: string; attachment?: string; intent?: ChatIntent; settle?: false }
  | { kind: 'pick'; n: number }
  | { kind: 'multi'; picks: number[] }
  | { kind: 'submit' }
  | { kind: 'cancel' }
  | { kind: 'wait'; ms: number }
  | { kind: 'stop' }
  | { kind: 'account'; set: { spent?: boolean; run?: string } }

/** `answered` lists the cards this path already answered: the same answer after another history is walked again (a loop back to an earlier card, a retry). */
type Path = { name: string; conversation: string; acts: Act[]; answered: string[] }

const FREE_TEXT = '이렇게 해 주세요'
const MAX_DEPTH = 14

const say = (text: string, extra: Partial<Extract<Act, { kind: 'say' }>> = {}): Act => ({ kind: 'say', text, ...extra })

const label = (a: Act) => {
  switch (a.kind) {
    case 'say':
      return `say ${a.text}${a.attachment ? ` +${a.attachment}` : ''}${a.intent ? ` #${a.intent}` : ''}`
    case 'pick':
      return `pick ${a.n}`
    case 'multi':
      return `multi ${a.picks.join(',')}`
    case 'wait':
      return `wait ${a.ms}`
    case 'account':
      return `account ${JSON.stringify(a.set)}`
    default:
      return a.kind
  }
}

const sectioned = (a: Approval) => a.sections.some((s) => s.kind !== 'choices')
const multiSection = (a: Approval) => {
  const s = a.sections[0]
  return s?.kind === 'choices' && s.multi ? s : undefined
}

/** What a person can do with an open card, as approval-panel.tsx offers it, plus typing instead of picking. */
const actionsFor = (a: Approval): Act[] => {
  const typed = say(FREE_TEXT)
  if (sectioned(a)) return [{ kind: 'submit' }, ...(a.secondary ? [{ kind: 'cancel' } as const] : []), typed]
  const multi = multiSection(a)
  if (multi) return [{ kind: 'multi', picks: [0] }, ...multi.items.flatMap((c, n) => (isStop(c) ? [{ kind: 'pick', n } as const] : [])), typed]
  if (a.submit) return [{ kind: 'pick', n: 0 }, ...(a.secondary ? [{ kind: 'pick', n: 1 } as const] : []), typed]
  const choices = a.sections[0]
  const items = choices?.kind === 'choices' ? choices.items : []
  return [...items.flatMap((c, n) => (c.label === '직접 말하기' ? [] : [{ kind: 'pick', n } as const])), typed]
}

const roots = (tokens: string[]): Path[] => {
  const list: [string, Act[]][] = [
    ...tokens.map((t): [string, Act[]] => [`token ${t}`, [say(t)]]),
    ['tailor', [say('모아페이 공고에 맞춰 이력서 고쳐 주세요')]],
    ['tailor alias', [say('tailor')]],
    ['fix a document', [say('이 서류를 고쳐 줘')]],
    ['make a resume', [say('이력서 만들어 주세요')]],
    ['make a resume alias', [say('make resume')]],
    ['auto pick', [say('PDF로 만들어 줘')]],
    ['await a reply', [say('경력 섹션을 공고에 맞게 바꿔 주세요')]],
    ['apply', [say('이 공고에 지원해 줘')]],
    ['apply alias', [say('apply')]],
    ['save', [say('내 서류에 저장해 줘')]],
    ['failure', [say('채용 페이지 실패 테스트')]],
    ['failure alias', [say('fail')]],
    ['generic', [say('요즘 백엔드 채용 시장은 어때요? 길게 알려 주세요')]],
    ['attachment', [say('이 파일로 맞춰 주세요', { attachment: '김서준_모아페이_백엔드.pdf' })]],
    ['intent fit', [say('적합도 봐 주세요', { intent: 'fit' })]],
    ['intent boost', [say('점수를 올려 주세요', { intent: 'boost' })]],
    ['intent experience', [say('경험을 만들어 주세요', { intent: 'experience' })]],
    ['queue busy', [say('queue-busy')]],
    ['states in one conversation', [say('states-file'), say('states-apply'), say('도토리증권 공고도 맞춰 줘')]],
    ['credits spent', [{ kind: 'account', set: { spent: true } }, say('모아페이 공고에 맞춰 경력기술서도 써 줘')]],
    ['run switch', [{ kind: 'account', set: { run: 'err-unavailable' } }, say('모아페이 백엔드 공고에 맞춰 이력서 고쳐 주세요')]],
    ['queued while working', [say('tailor hold', { settle: false }), { kind: 'wait', ms: 10_000 }, say('use numbers')]],
    ['interrupt then resume', [say('tailor hold', { settle: false }), { kind: 'wait', ms: 10_000 }, { kind: 'stop' }, say('자기소개서도 같이 써 줘')]],
    ['interrupt then a new task', [say('tailor hold', { settle: false }), { kind: 'wait', ms: 10_000 }, { kind: 'stop' }, say('이 공고에 지원해 줘')]],
  ]
  return [
    ...list.map(([name, acts], i) => ({ name, conversation: `g${i}`, acts, answered: [] })),
    // A conversation the list shows as 작업 중 continues its draft (ChatResume).
    { name: 'running conversation', conversation: 'c-dotori', acts: [say('이어서 봐 주세요')], answered: [] },
  ]
}

// Key order draws nothing, and a to-do row's `added` and a material row's `ac` draw the same when false or absent.
const line = (x: unknown) =>
  JSON.stringify(x, (k, v: unknown) => {
    if ((k === 'added' || k === 'ac') && v === false) return undefined
    if (!v || typeof v !== 'object' || Array.isArray(v)) return v
    return Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b)))
  })

/**
 * What the chat screen draws, one line per transcript entry and one for the open card.
 * Ids are list keys and option ids are answer plumbing, so neither is compared.
 */
const view = (s: ChatState) => {
  const items = s.items.map(({ id: _id, ...item }) => {
    if (item.type !== 'tool') return item
    const { name: _name, ...tool } = item
    return tool
  })
  const approval = s.approval && {
    ...s.approval,
    optionIds: undefined,
    sections: s.approval.sections.map((x) => ({
      ...x,
      id: undefined,
      ids: undefined,
      ...(x.kind === 'rows' ? { items: x.items.map(({ id: _id, ...row }) => row) } : {}),
      ...(x.kind === 'templates' ? { items: x.items.map(({ id: _id, ...t }) => t) } : {}),
    })),
  }
  const rest = { working: s.working, awaiting: s.awaiting, queue: s.queue, interrupted: s.interrupted }
  return ['', ...items.map(line), `card ${line(approval)}`, line(rest), ''].join('\n')
}

/** The to-do card a continuation finishes depends on how the work started, so it is part of an answer's identity. */
const todoOf = (s: ChatState) => {
  const todo = s.items.findLast((x) => x.type === 'todo')
  return todo?.type === 'todo' ? todo.items.map((x) => x.label).join('|') : ''
}

// A run waits on fake timers and on module loading, which is real I/O, so both get their turn until the run is over.
// A gated step (GATED_STEP, st-steps) waits for a tour's `step-next` link, so each turn also sends it.
const settle = async (running: () => boolean, nextStep: () => void) => {
  for (let i = 0; i < 3 || (running() && i < 100); i++) {
    nextStep()
    await vi.runAllTimersAsync()
    await new Promise((resolve) => setImmediate(resolve))
  }
}

const play = async (path: Path) => {
  vi.resetModules()
  vi.setSystemTime(0)
  const store = await import('../stores')
  const mock = await import('../../../mock/chat')
  transport.fetch = (await import('../../../mock/server')).mockFetch
  const id = path.conversation
  const card = () => store.useChatStore.getState().chats[id]?.approval
  for (const act of path.acts) {
    const a = card()
    switch (act.kind) {
      case 'say':
        store.send(id, act.text, act.attachment, act.intent)
        if (act.settle === false) continue
        break
      case 'pick': {
        if (!a) throw new Error(`${path.name}: no card to pick from`)
        const multi = multiSection(a)
        const choices = a.sections[0]
        const text = multi
          ? multi.items[act.n]!.label
          : a.submit
            ? act.n === 0
              ? (a.answer ?? a.submit)
              : a.secondary!
            : choices?.kind === 'choices'
              ? choices.items[act.n]!.label
              : ''
        store.answer(id, text, act.n)
        break
      }
      case 'multi': {
        const multi = multiSection(a!)!
        store.answer(id, act.picks.map((n) => multi.items[n]!.label).join(', '), act.picks)
        break
      }
      case 'submit': {
        const sel = a!.sections.map((x) => ('selected' in x ? x.selected : []))
        store.answer(id, sectionLabel(a!, sel), sectionPicks(a!, sel))
        break
      }
      case 'cancel':
        store.answer(id, a!.secondary!, a!.optionIds?.indexOf('cancel') ?? -1)
        break
      case 'wait':
        await vi.advanceTimersByTimeAsync(act.ms)
        continue
      case 'stop':
        store.stop(id)
        break
      case 'account':
        mock.setAccount(act.set)
        continue
    }
    await settle(() => !!store.useChatStore.getState().chats[id]?.working, store.nextMockStep)
  }
  return store.useChatStore.getState().chats[id] ?? emptyChat
}

beforeAll(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'] })
})
afterAll(() => {
  vi.useRealTimers()
})

describe('every scripted run (golden)', () => {
  it('leaves the same chat on screen at every card and at the end', async () => {
    const { TOKENS } = await import('../../../mock/bot-scripts/runs')
    const queue = roots(Object.keys(TOKENS))
    // Each answer to each card is walked once per history of answered cards.
    const seen = new Set<string>()
    let paths = 0
    while (queue.length) {
      const path = queue.shift()!
      const state = await play(path)
      paths++
      expect.soft(view(state)).toMatchSnapshot(path.name)
      const a = state.approval
      if (!a || path.acts.length >= MAX_DEPTH) continue
      for (const act of actionsFor(a)) {
        const key = `${a.id} ${label(act)} ${todoOf(state)} ${[...new Set(path.answered)].sort().join(',')}`
        if (seen.has(key)) continue
        seen.add(key)
        queue.push({ ...path, name: `${path.name} > ${a.id}: ${label(act)}`, acts: [...path.acts, act], answered: [...path.answered, a.id] })
      }
    }
    expect(paths).toBeGreaterThan(100)
  }, 300_000)
})
