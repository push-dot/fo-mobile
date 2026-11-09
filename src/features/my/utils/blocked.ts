import type { BlockedUser } from '@push/api-client'

export const BLOCKED_COPY = {
  title: '차단한 사람',
  intro: '차단한 사람은 나에게 제안이나 메시지를 보낼 수 없어요.',
  note: '차단을 풀면 이 사람이 보낸 지난 제안이 받은 제안 목록에 다시 보여요. 차단하거나 풀어도 상대에게는 알리지 않아요.',
  empty: '차단한 사람이 없어요.',
  unblock: '차단 해제',
} as const

export const blockedCount = (total: number | undefined) => (total === undefined ? undefined : `${total}명`)

const blockedOn = (iso: string, now: Date) => {
  const d = new Date(iso)
  const monthDay = `${d.getMonth() + 1}월 ${d.getDate()}일`
  return d.getFullYear() === now.getFullYear() ? monthDay : `${d.getFullYear()}년 ${monthDay}`
}

export const blockedLine = (b: BlockedUser, now = new Date()) => `${blockedOn(b.createdAt, now)} 차단`
