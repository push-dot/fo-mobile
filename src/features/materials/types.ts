import type { AttachmentKind, BotId, BotRef } from '@/features/bots'

export type MaterialTab = 'all' | 'doc' | 'bookmark' | 'link'
export type MaterialSection = Exclude<MaterialTab, 'all'>
export type MaterialKind = AttachmentKind

export type MaterialsFilter = { tab: MaterialTab; q: string; bot?: BotId }

export type MadeBy = { by: 'user' } | { by: 'bot'; bot: BotRef | null }

export type LinkLabel = 'job' | 'github' | 'portfolio' | 'blog' | 'linkedin' | 'other'

type MaterialCommon = { id: string; title: string }

export type Material =
  | (MaterialCommon & { kind: 'file'; mimeType: string; bytes: number; pages: number | null; madeBy: MadeBy; updatedAt: Date })
  | (MaterialCommon & { kind: 'document'; docKind: string; madeBy: MadeBy; updatedAt: Date })
  | (MaterialCommon & {
      kind: 'posting'
      company: string
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
      lastCheck: { at: Date; ok: boolean } | null
    })

export type MaterialDetail = { material: Material; usedBy: BotRef[] }

export type MaterialsPage = {
  counts: Record<MaterialSection, number>
  sections: { section: MaterialSection; items: Material[]; hasMore: boolean }[]
}

export type MaterialRowView = { title: string; sub: string }

export type SendContext = { from: 'home' } | { from: 'bot'; botId: BotId }
