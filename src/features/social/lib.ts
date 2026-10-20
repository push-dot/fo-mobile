import type { Comment } from '@push/api-client'

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

/** "방금 전" · "5분 전" · "2시간 전" · "어제" · "3일 전" · "10월 2일" · "2025. 3. 1." */
export const timeAgo = (iso: string, now: Date = new Date()) => {
  const d = new Date(iso)
  const diff = Math.max(0, now.getTime() - d.getTime())
  if (diff < MIN) return '방금 전'
  if (diff < HOUR) return `${Math.floor(diff / MIN)}분 전`
  if (diff < DAY) return `${Math.floor(diff / HOUR)}시간 전`
  if (diff < 2 * DAY) return '어제'
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}일 전`
  if (d.getFullYear() === now.getFullYear()) return `${d.getMonth() + 1}월 ${d.getDate()}일`
  return `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`
}

/** Orders comments so each reply follows its parent. Orphan replies stay at the end. */
export const threadComments = (comments: Comment[]) => {
  const roots = comments.filter((c) => !c.parentId)
  const ids = new Set(roots.map((c) => c.id))
  const out: (Comment & { reply: boolean })[] = []
  for (const r of roots) {
    out.push({ ...r, reply: false })
    for (const c of comments) if (c.parentId === r.id) out.push({ ...c, reply: true })
  }
  for (const c of comments) if (c.parentId && !ids.has(c.parentId)) out.push({ ...c, reply: true })
  return out
}

/** Avatar label: the given name ("이수빈" → "수빈"), per design. */
export const givenName = (name: string) => (/^[가-힣]{3}$/.test(name) ? name.slice(1) : name.slice(0, 2))
