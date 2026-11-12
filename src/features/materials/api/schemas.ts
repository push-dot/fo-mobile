import type { BotContract } from '@push/api-client'
import type { BotId, BotRef } from '@/features/bots'
import type { MadeBy, Material, MaterialDetail, MaterialsPage } from '../types'

// The only place that reads material wire field names.

const dateOf = (iso: string): Date => new Date(iso)

/** A posting deadline is a calendar day ("2026-11-20"), read as local midnight so the day does not shift with the zone. */
const dayOf = (value: string | null): Date | null => {
  if (value === null) return null
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  return day ? new Date(Number(day[1]), Number(day[2]) - 1, Number(day[3])) : new Date(value)
}

const botRefOf = (ref: BotContract.BotRef): BotRef => ({ id: ref.id as BotId, kind: ref.kind, name: ref.displayName, color: ref.color })

/** LinkedIn is not a stored link kind. The server sends the link's host, and the label comes from it. */
const LINKEDIN_HOST = /(^|\.)linkedin\.com$/

const madeByOf = (origin: 'UPLOAD' | 'AI', createdBy: BotContract.BotRef | null): MadeBy =>
  origin === 'UPLOAD' ? { by: 'user' } : { by: 'bot', bot: createdBy && botRefOf(createdBy) }

export const toMaterial = (m: BotContract.Material): Material => {
  switch (m.kind) {
    case 'file':
      return { kind: 'file', id: m.id, title: m.title, mimeType: m.mimeType, bytes: m.size, pages: m.pageCount, madeBy: madeByOf(m.origin, m.createdBy), updatedAt: dateOf(m.updatedAt) }
    case 'document':
      return { kind: 'document', id: m.id, title: m.title, docKind: m.docKind, madeBy: madeByOf(m.origin, m.createdBy), updatedAt: dateOf(m.updatedAt) }
    case 'posting':
      return { ...m, deadline: dayOf(m.deadline), bookmarkedAt: dateOf(m.bookmarkedAt) }
    case 'link':
      return {
        kind: 'link',
        id: m.id,
        title: m.title,
        url: m.url,
        linkKind: LINKEDIN_HOST.test(m.host) ? 'linkedin' : m.linkKind,
        addedAt: dateOf(m.addedAt),
        lastCheck: m.lastCheckedAt === null ? null : { at: dateOf(m.lastCheckedAt), ok: m.lastCheckOk ?? false },
      }
  }
}

export const toMaterialsPage = (page: BotContract.MaterialsPage): MaterialsPage => ({
  counts: page.counts,
  sections: page.sections.map((s) => ({ section: s.section, items: s.items.map(toMaterial), hasMore: s.nextCursor !== null })),
})

export const toMaterialDetail = ({ usedBy, ...material }: BotContract.MaterialDetail): MaterialDetail => ({
  material: toMaterial(material as BotContract.Material),
  usedBy: usedBy.map(botRefOf),
})
