import type { Comment } from '@push/api-client'

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
