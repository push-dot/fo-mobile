import { STOPPING_TEXT } from '../constants'

export type LiveLine =
  | { kind: 'run'; phase: 'queued'; since: Date; ahead: number }
  | { kind: 'run'; phase: 'thinking'; since: Date; text: string }
  | { kind: 'run'; phase: 'working'; since: Date; text: string }
  /** A line that names its work ends there: no elapsed time (ChatApprove). */
  | { kind: 'waiting'; since: Date; for: 'answer' | 'confirm'; cardId: string; text: string; named?: true }

export type Notice =
  | { kind: 'stopped'; resumable: boolean }
  | { kind: 'failed'; text: string }
  | { kind: 'error'; code: string | undefined; reason: string | null }

/** A notice is a result, so it is a chat bubble; `detail` is its grey sub-text (rule 29). */
export type NoticeBubble = { text: string; detail?: string }

export type StatusLineView = {
  mascot: 'think' | 'work' | 'help' | 'idle'
  tone: 'neutral' | 'help' | 'quiet'
  /** Empty for the waiting state: an icon alone says it (ChatBotStatusQueue, rule 29). */
  text: string
  tail: string | null
  accessibilityLabel: string
}

export const STATUS_STEPS = [
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
] as const

const QUEUE_TEXT = '순서를 기다리는 중'
const QUEUE_LABEL = '대기 중'
const THINK_TEXT = '생각 중'
const STOP_RESUMABLE_TEXT = '작업을 중지했어요. 어떻게 할지 알려 주세요.'
const STOP_DROPPED_TEXT = '중지했어요. 고치던 내용은 반영하지 않았어요.'
const ERROR_SENTENCE = '작업 중 문제가 생겼어요.'
const ERROR_RETRY = '다시 해 볼까요?'
const STORED_THINKING = new Set(['생각 중', '생각하는 중…'])

export const formatElapsed = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const sec = seconds % 60
  return m ? `${m}분 ${sec}초` : `${sec}초`
}

const elapsedText = (since: Date, now: Date) => formatElapsed(Math.max(0, Math.floor((now.getTime() - since.getTime()) / 1000)))

const view = (mascot: StatusLineView['mascot'], tone: StatusLineView['tone'], text: string, tail: string | null, label = text): StatusLineView => ({
  mascot,
  tone,
  text,
  tail,
  accessibilityLabel: tail ? `${label} ${tail}` : label,
})

export const statusLineView = (line: LiveLine, now: Date): StatusLineView => {
  if (line.kind === 'run' && line.phase === 'queued') return view('idle', 'neutral', '', null, QUEUE_LABEL)
  if (line.kind === 'run' && line.phase === 'thinking') return view('think', 'neutral', line.text, elapsedText(line.since, now))
  // ChatBotStatusStopped: stopping is a line that counts nothing and is grey.
  if (line.kind === 'run' && line.text === STOPPING_TEXT) return view('work', 'quiet', line.text, null)
  if (line.kind === 'run') return view('work', 'neutral', line.text, elapsedText(line.since, now))
  return view('help', 'help', line.text, line.named ? null : elapsedText(line.since, now))
}

export const noticeBubble = (notice: Notice): NoticeBubble => {
  if (notice.kind === 'stopped') return { text: notice.resumable ? STOP_RESUMABLE_TEXT : STOP_DROPPED_TEXT }
  if (notice.kind === 'failed') return { text: notice.text }
  // ChatBotStatusError: one sentence in the bubble, the reason between the two (a bubble holds what the Bot says; no grey sub-text).
  return { text: [ERROR_SENTENCE, notice.reason && `${notice.reason.replace(/\.$/, '')}.`, ERROR_RETRY].filter(Boolean).join(' ') }
}

export const lineFromWorking = (verbs: readonly string[], since: Date): LiveLine => {
  const text = verbs.find((verb) => verb.length > 0) ?? THINK_TEXT
  if (text === '대기 중' || text.startsWith(QUEUE_TEXT)) {
    const ahead = Number(/앞에 작업 (\d+)개/.exec(text)?.[1] ?? 0)
    return { kind: 'run', phase: 'queued', since, ahead }
  }
  if (STORED_THINKING.has(text)) return { kind: 'run', phase: 'thinking', since, text: THINK_TEXT }
  return { kind: 'run', phase: 'working', since, text }
}

export const canStop = (lines: readonly LiveLine[]) => lines.some((line) => line.kind === 'run')

export const isWorkTrail = (type: string) => type === 'think' || type === 'tool' || type === 'worked'
