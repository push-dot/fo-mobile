import type { ApplicationStage, Career, Offer } from '@push/api-client'
import type { BadgeTone } from '../../ui'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

/** Avatar label: the given name ("김서준" → "서준"). */
export const givenName = (name: string) =>
  /^[가-힣]{3}$/.test(name) ? name.slice(1) : name.slice(0, 2)

// Placeholder avatar/logo colours (design: brand gradient or colour + initial), picked by name.
const TINTS = [
  '#3B5BDB',
  '#0C8599',
  '#5F3DC4',
  '#E8590C',
  '#2F9E44',
  '#1F3A8A',
  '#C2255C',
  '#1864AB',
]
export const tintOf = (seed: string) =>
  TINTS[[...seed].reduce((a, ch) => a + ch.charCodeAt(0), 0) % TINTS.length]!

/** 2.4MB · 640KB */
export const fileSize = (bytes: number) =>
  bytes >= 1_000_000
    ? `${(bytes / 1_000_000).toFixed(1)}MB`
    : `${Math.max(1, Math.round(bytes / 1000))}KB`

export const fileKind = (name: string) => (/\.docx?$/i.test(name) ? 'DOCX' : 'PDF')

/** 10월 12일 */
export const monthDay = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

/** "2022-03" → "2022년 3월" */
export const ymLabel = (ym: string) => {
  const [y, m] = ym.split('-')
  return `${y}년 ${Number(m)}월`
}

export const careerPeriod = (c: Pick<Career, 'startedOn' | 'endedOn'>) =>
  `${ymLabel(c.startedOn)} – ${c.endedOn ? ymLabel(c.endedOn) : '현재'}`

/** Accepts "2022.3", "2022-03", "202203"; returns "2022-03" or null. */
export const parseYm = (text: string) => {
  const m = text.trim().match(/^(\d{4})\D*(\d{1,2})$/)
  if (!m) return null
  const month = Number(m[2])
  return month >= 1 && month <= 12 ? `${m[1]}-${String(month).padStart(2, '0')}` : null
}

export const tenureLabel = (years: number | null) => (years == null ? '' : years <= 0 ? '신입' : `${years}년차`)

/** Badge tone per 지원 단계 (MyActivity board). */
export const stageTone = (stage: ApplicationStage): BadgeTone => {
  switch (stage) {
    case 'SCREENING':
      return 'ac'
    case 'INTERVIEW':
      return 'orange'
    case 'OFFER':
    case 'ACCEPTED':
      return 'green'
    case 'REJECTED':
    case 'WITHDRAWN':
      return 'red'
    default:
      return 'grey'
  }
}

/** 받은 제안: 새 제안 · 수락함 · 거절함. 보낸 제안: 읽지 않음 · 읽음 · 수락함 · 거절함. */
export const offerBadge = (
  o: Pick<Offer, 'status'>,
  box: 'received' | 'sent',
): { label: string; tone: BadgeTone } => {
  if (o.status === 'ACCEPTED') return { label: '수락함', tone: 'green' }
  if (o.status === 'DECLINED') return { label: '거절함', tone: 'grey' }
  if (box === 'received') return { label: '새 제안', tone: 'ac' }
  return { label: o.status === 'READ' ? '읽음' : '읽지 않음', tone: 'grey' }
}

/** "방금 전" · "5분 전" · "2시간 전" · "어제" · "3일 전" · "10월 2일" */
export const timeAgo = (iso: string, now = new Date()) => {
  const d = new Date(iso)
  const diff = Math.max(0, now.getTime() - d.getTime())
  if (diff < MIN) return '방금 전'
  if (diff < HOUR) return `${Math.floor(diff / MIN)}분 전`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`
  if (diff < 2 * DAY) return '어제'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}일 전`
  if (d.getFullYear() === now.getFullYear()) return monthDay(iso)
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}

/** 오후 3:00 */
export const clock = (iso: string) => {
  const d = new Date(iso)
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
const dayDiff = (a: Date, b: Date) =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY)

/** D-2 · D-Day · 마감 */
export const dday = (iso: string, now = new Date()) => {
  const n = dayDiff(new Date(iso), now)
  return n > 0 ? `D-${n}` : n === 0 ? 'D-Day' : '마감'
}

export const sameDay = (a: Date, b: Date) => dayDiff(a, b) === 0

/** "10월 21일 수요일 · 내일" */
export const dayTitle = (d: Date, now = new Date()) => {
  const base = `${d.getMonth() + 1}월 ${d.getDate()}일 ${WEEKDAYS[d.getDay()]}요일`
  const n = dayDiff(d, now)
  return n === 0 ? `${base} · 오늘` : n === 1 ? `${base} · 내일` : base
}

/** Month grid from the Sunday on/before the 1st to the Saturday on/after the last day. */
export const monthGrid = (year: number, month: number) => {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const cells: Date[] = []
  for (
    let d = new Date(year, month, 1 - first.getDay());
    d <= last || d.getDay() !== 0;
    d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)
  ) {
    cells.push(d)
  }
  return cells
}

const hasBatchim = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}

/** ["소개", "경력"] → "지금 프로필의 소개와 경력은 이 내용으로 바뀌어요." */
export const overwriteWarning = (labels: string[]) => {
  if (labels.length === 0) return null
  const head = labels.slice(0, -1)
  const lastHead = head[head.length - 1]
  const joined = head.length
    ? `${head
        .slice(0, -1)
        .map((l) => `${l}, `)
        .join('')}${lastHead}${hasBatchim(lastHead!) ? '과' : '와'} ${labels[labels.length - 1]}`
    : labels[0]!
  return `지금 프로필의 ${joined}${hasBatchim(labels[labels.length - 1]!) ? '은' : '는'} 이 내용으로 바뀌어요.`
}
