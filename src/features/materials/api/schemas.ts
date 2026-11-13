import type { BotContract } from '@push/api-client'
import { dateOf, dayOf, toBotRef } from '@/features/bots'
import type { MadeBy, Material, MaterialDetail, MaterialsPage } from '../types'

// The only place that reads material wire field names. Dates and bot references are read by the bots feature's
// wire readers, so a bad value is handled the same way in both: the row is dropped.

/** LinkedIn is not a stored link kind. The server sends the link's host, and the label comes from it. An empty host has none. */
const LINKEDIN_HOST = /(^|\.)linkedin\.com$/

const madeByOf = (origin: 'UPLOAD' | 'AI', createdBy: BotContract.BotRef | null): MadeBy =>
  origin === 'UPLOAD' ? { by: 'user' } : { by: 'bot', bot: createdBy && toBotRef(createdBy) }

/** Null for a material whose dates do not parse. */
export const toMaterial = (m: BotContract.Material): Material | null => {
  switch (m.kind) {
    case 'file': {
      const updatedAt = dateOf(m.updatedAt)
      return updatedAt && { kind: 'file', id: m.id, title: m.title, mimeType: m.mimeType, bytes: m.size, pages: m.pageCount, madeBy: madeByOf(m.origin, m.createdBy), updatedAt }
    }
    case 'document': {
      const updatedAt = dateOf(m.updatedAt)
      return updatedAt && { kind: 'document', id: m.id, title: m.title, docKind: m.docKind, madeBy: madeByOf(m.origin, m.createdBy), updatedAt }
    }
    case 'posting': {
      const bookmarkedAt = dateOf(m.bookmarkedAt)
      const deadline = dayOf(m.deadline)
      if (!bookmarkedAt || (m.deadline !== null && !deadline)) return null
      return { ...m, deadline, bookmarkedAt }
    }
    case 'link': {
      const addedAt = dateOf(m.addedAt)
      const checkedAt = m.lastCheckedAt === null ? null : dateOf(m.lastCheckedAt)
      if (!addedAt || (m.lastCheckedAt !== null && !checkedAt)) return null
      return {
        kind: 'link',
        id: m.id,
        title: m.title,
        url: m.url,
        linkKind: LINKEDIN_HOST.test(m.host) ? 'linkedin' : m.linkKind,
        addedAt,
        lastCheck: checkedAt && { at: checkedAt, ok: m.lastCheckOk ?? false },
      }
    }
  }
}

export const toMaterialsPage = (page: BotContract.MaterialsPage): MaterialsPage => ({
  counts: page.counts,
  sections: page.sections.map((s) => ({ section: s.section, items: s.items.flatMap((m) => toMaterial(m) ?? []), hasMore: s.nextCursor !== null })),
})

export const toMaterialDetail = ({ usedBy, ...rest }: BotContract.MaterialDetail): MaterialDetail => {
  const material = toMaterial(rest as BotContract.Material)
  if (!material) throw new Error('unreadable material')
  return { material, usedBy: usedBy.map(toBotRef) }
}
