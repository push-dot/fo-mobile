import type { BotContract } from '@push/api-client'

export type BotId = string & { readonly __brand: 'BotId' }

export type BotAddress = BotId | 'push'

export type CardId = string & { readonly __brand: 'CardId' }

export type BotColor = BotContract.BotColor
export type BotKind = 'push' | 'company'

export type AttachmentKind = 'file' | 'document' | 'posting' | 'link'
export type Attachment = { kind: AttachmentKind; id: string; title: string }

export type BotActivity =
  | { phase: 'idle' }
  | { phase: 'queued'; since: Date; ahead: number }
  | { phase: 'thinking'; since: Date; label: string | null }
  | { phase: 'working'; since: Date; label: string }
  | { phase: 'waiting'; since: Date; for: 'answer' | 'confirm'; cardId: CardId; cardTitle: string }

export type BotOutcome = { kind: 'failed'; at: Date }

type BotCommon = {
  id: BotId
  name: string
  muted: boolean
  revision: number
  lastActivityAt: Date
  lastMessage: { preview: string; fromBot: boolean } | null
  unread: boolean
  activity: BotActivity
  outcome: BotOutcome | null
}

export type PushBot = BotCommon & { kind: 'push' }
export type CompanyBot = BotCommon & {
  kind: 'company'
  color: BotColor
  postingId: string | null
}
export type Bot = PushBot | CompanyBot

export type BotRef = { id: BotId; kind: BotKind; name: string; color: BotColor | null }

export type AllowedSite = { id: string; host: string; allowedAt: Date; kind: 'posting' | 'company' | 'other' }

export type BotProfile = {
  bot: Bot
  posting: { id: string; title: string; deadline: Date | null; closed: boolean } | null
  fitScore: number | null
  materialCount: number | null
  allowedSites: AllowedSite[] | null
}

export type NewBot = { postingId: string; color: BotColor; name?: string }

export type CreateBotResult = { bot: CompanyBot; existing: boolean }

export type BotLimit = {
  plan: 'FREE' | 'PRO' | 'ULTRA'
  max: number | null
  used: number
  table: { FREE: number; PRO: number; ULTRA: number | null }
}

export type LinkCheck =
  | {
      status: 'found'
      postingId: string
      company: string
      title: string
      deadline: Date | null
      careerMin: number | null
      careerMax: number | null
      location: string | null
      host: string
    }
  | { status: 'not_a_posting' }

export type MessageHit = { bot: BotRef; messageId: string; at: Date; fromBot: boolean; snippet: string }
export type BotSearch = { bots: { bot: Bot; line: string }[]; botTotal: number; messages: MessageHit[]; messageTotal: number }

export type MascotState = 'help' | 'done' | 'work' | 'think' | 'idle'

export type LocalActivity = { streaming?: BotActivity; reading: boolean }

export type BotRow = {
  id: BotId
  name: string
  color: BotColor | 'push'
  mascot: MascotState
  unreadDot: boolean
  line: string
  time: string
  accessibilityLabel: string
}
