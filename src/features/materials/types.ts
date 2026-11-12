import type { AttachmentKind, BotId, BotRef } from '@/features/bots'

/** The modal's tabs. 서류 holds files and Push documents, 북마크 holds bookmarked postings. */
export type MaterialTab = 'all' | 'doc' | 'bookmark' | 'link'
export type MaterialSection = Exclude<MaterialTab, 'all'>
export type MaterialKind = AttachmentKind

/** What a materials list asks for. `bot` keeps the materials that bot made or that were attached in its chat (MaterialsFromProfile). */
export type MaterialsFilter = { tab: MaterialTab; q: string; bot?: BotId }

/** Who made a 서류. `bot: null` means a bot made it and that bot was deleted since. */
export type MadeBy = { by: 'user' } | { by: 'bot'; bot: BotRef | null }

/** The label of a link: one of the five stored kinds, or `linkedin`, which the app derives from the link's host. */
export type LinkLabel = 'job' | 'github' | 'portfolio' | 'blog' | 'linkedin' | 'other'

type MaterialCommon = { id: string; title: string }

/** One variant per kind, with the facts its row and its detail sheet print. */
export type Material =
  | (MaterialCommon & { kind: 'file'; mimeType: string; bytes: number; pages: number | null; madeBy: MadeBy; updatedAt: Date })
  | (MaterialCommon & { kind: 'document'; docKind: string; madeBy: MadeBy; updatedAt: Date })
  | (MaterialCommon & {
      kind: 'posting'
      company: string
      /** Null is 상시 채용. */
      deadline: Date | null
      closed: boolean
      careerMin: number | null
      careerMax: number | null
      employmentType: string | null
      location: string | null
      bookmarkedAt: Date
    })
  | (MaterialCommon & {
      kind: 'link'
      url: string
      linkKind: LinkLabel
      addedAt: Date
      /** Set when a bot last opened the link. Null hides 마지막 확인. */
      lastCheck: { at: Date; ok: boolean } | null
    })

/** The detail sheet. An empty `usedBy` hides 쓰인 대화. */
export type MaterialDetail = { material: Material; usedBy: BotRef[] }

/** One answer draws any tab: the counts of all three sections and the sections of that tab. 전체 holds a preview of each. */
export type MaterialsPage = {
  counts: Record<MaterialSection, number>
  sections: { section: MaterialSection; items: Material[]; hasMore: boolean }[]
}

/** Row copy, decided once. */
export type MaterialRowView = { title: string; sub: string }

/** 보내기 depends on where the modal was opened: from the bot home it asks for a bot, from a bot it attaches there. */
export type SendContext = { from: 'home' } | { from: 'bot'; botId: BotId }
