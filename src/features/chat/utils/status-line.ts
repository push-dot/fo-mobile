export type LiveLine =
  | { kind: 'run'; phase: 'queued'; since: Date; ahead: number }
  | { kind: 'run'; phase: 'thinking'; since: Date; text: string }
  | { kind: 'run'; phase: 'working'; since: Date; text: string }
  | { kind: 'waiting'; since: Date; for: 'answer' | 'confirm'; cardId: string; text: string }

export type Notice =
  | { kind: 'stopped'; resumable: boolean }
  | { kind: 'failed'; text: string }
  | { kind: 'error'; code: string | undefined; reason: string | null }

export type StatusLine = LiveLine | Notice

export type StatusLineView = {
  mascot: 'think' | 'work' | 'help' | 'idle'
  tone: 'neutral' | 'help' | 'danger'
  text: string
  tail: string | null
  accessibilityLabel: string
  role: 'status' | 'alert'
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
const THINK_TEXT = '생각 중'
const STOP_RESUMABLE_TEXT = '작업을 중지했어요 · 어떻게 할지 알려 주세요'
const STOP_DROPPED_TEXT = '중지했어요. 고치던 내용은 반영하지 않았어요.'
const ERROR_SENTENCE = '작업 중 문제가 생겼어요'
const STORED_THINKING = new Set(['생각 중', '생각하는 중…'])

export const formatElapsed = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const sec = seconds % 60
  return m ? `${m}분 ${sec}초` : `${sec}초`
}

const elapsedText = (since: Date, now: Date) => formatElapsed(Math.max(0, Math.floor((now.getTime() - since.getTime()) / 1000)))

const view = (mascot: StatusLineView['mascot'], tone: StatusLineView['tone'], text: string, tail: string | null, role: StatusLineView['role']): StatusLineView => ({
  mascot,
  tone,
  text,
  tail,
  role,
  accessibilityLabel: tail ? `${text} ${tail}` : text,
})

export const statusLineView = (line: StatusLine, now: Date): StatusLineView => {
  if (line.kind === 'run' && line.phase === 'queued') {
    const text = line.ahead > 0 ? `${QUEUE_TEXT} · 앞에 작업 ${line.ahead}개` : QUEUE_TEXT
    return view('idle', 'neutral', text, elapsedText(line.since, now), 'status')
  }
  if (line.kind === 'run' && line.phase === 'thinking') return view('think', 'neutral', line.text, elapsedText(line.since, now), 'status')
  if (line.kind === 'run' && line.phase === 'working') return view('work', 'neutral', line.text, elapsedText(line.since, now), 'status')
  if (line.kind === 'waiting') return view('help', 'help', line.text, elapsedText(line.since, now), 'status')
  if (line.kind === 'stopped') return view('idle', 'neutral', line.resumable ? STOP_RESUMABLE_TEXT : STOP_DROPPED_TEXT, null, 'status')
  if (line.kind === 'failed') return view('idle', 'danger', line.text, null, 'status')
  return view('idle', 'danger', ERROR_SENTENCE, line.reason, 'alert')
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

export const canStop = (lines: readonly StatusLine[]) => lines.some((line) => line.kind === 'run')

export const isWorkTrail = (type: string) => type === 'think' || type === 'tool' || type === 'worked'
