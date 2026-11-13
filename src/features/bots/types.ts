import type { BotContract } from '@push/api-client'

/** The id of a bot as the server returned it. Every piece of app state about a chat is keyed by it. */
export type BotId = string & { readonly __brand: 'BotId' }

/**
 * What a route or a caller may name before any bot was loaded. The server accepts `'push'` on every bot route and
 * answers with the Push Bot, so the app never derives its id. State is keyed by the `BotId` of that answer.
 */
export type BotAddress = BotId | 'push'

/** The id of a question card (server `approvals.id`). */
export type CardId = string & { readonly __brand: 'CardId' }

/** The server's list. A palette typed `Record<BotColor, …>` stops compiling when the server adds a colour. */
export type BotColor = BotContract.BotColor
export type BotKind = 'push' | 'company'

export type AttachmentKind = 'file' | 'document' | 'posting' | 'link'
/**
 * A material on a message: a composer chip, a bubble chip, a mention pick, the 보내기 action, a bot answer's 출처.
 * `title` is a snapshot, so a bubble still reads after the material is deleted.
 */
export type Attachment = { kind: AttachmentKind; id: string; title: string }

/**
 * What a bot is doing, as facts. One variant per phase with only that phase's fields. `since` is server time:
 * the run's start for a run, so the timer counts through thinking and working, and the asking time for a card.
 */
export type BotActivity =
  | { phase: 'idle' }
  | { phase: 'queued'; since: Date; ahead: number }
  /** `label` is the run's last working sentence, so a row keeps its line while the bot thinks again. */
  | { phase: 'thinking'; since: Date; label: string | null }
  | { phase: 'working'; since: Date; label: string }
  | { phase: 'waiting'; since: Date; for: 'answer' | 'confirm'; cardId: CardId; cardTitle: string; expiresAt: Date | null }

/** How the last run ended while nothing runs and no card is open. The server clears it when something newer happens. */
export type BotOutcome = { kind: 'expired' | 'failed'; at: Date }

type BotCommon = {
  id: BotId
  /** "Push Bot" or the company name, or the user's rename. */
  name: string
  muted: boolean
  /** Optimistic-lock token for rename, mute, and colour. */
  revision: number
  /** The row's time and the server's order key. Never the row edit time. */
  lastActivityAt: Date
  /** Newest message of the thread, any author. Null for a bot nobody has talked to. */
  lastMessage: { preview: string; fromBot: boolean } | null
  /** The bot said something (a message or a card) after the user last read it. */
  unread: boolean
  activity: BotActivity
  outcome: BotOutcome | null
}

/** Push Bot has no colour and no posting and cannot be deleted, so those fields do not exist on it. */
export type PushBot = BotCommon & { kind: 'push' }
export type CompanyBot = BotCommon & {
  kind: 'company'
  color: BotColor
  /** The posting the bot was made from. Null once that posting is gone. */
  postingId: string | null
}
export type Bot = PushBot | CompanyBot

/** Enough to draw a bot's mascot and name where the bot itself is not loaded. */
export type BotRef = { id: BotId; kind: BotKind; name: string; color: BotColor | null }

/** The profile's extra facts. Each null hides its row. */
export type BotProfile = {
  bot: Bot
  posting: { id: string; title: string; deadline: Date | null; closed: boolean } | null
  fitScore: number | null
  /** Materials this bot made or was sent. Null until the server counts them. */
  materialCount: number | null
}

/** What the create sheet submits. A company bot always starts from a posting in Push. */
export type NewBot = { postingId: string; color: BotColor; name?: string }

/** `existing`: the user already had a bot for that company and the server returned it. The app opens it either way. */
export type CreateBotResult = { bot: CompanyBot; existing: boolean }

/** Sent with the bot list, so the app holds no copy of the plan table. `max` null is unlimited. Push Bot is not counted. */
export type BotLimit = {
  plan: 'FREE' | 'PRO' | 'ULTRA'
  max: number | null
  used: number
  table: { FREE: number; PRO: number; ULTRA: number | null }
}

/** What a pasted link resolved to. The server knows only postings already in Push. */
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

/** The five states of AgentHomeMascot. */
export type MascotState = 'help' | 'done' | 'work' | 'think' | 'idle'

/**
 * What this session knows about one bot beyond the last list answer. Published by the chat, keyed by BotId.
 * `streaming` is set while this session holds the bot's stream. `reading` is true while its chat is open at the bottom.
 */
export type LocalActivity = { streaming?: BotActivity; reading: boolean }

/** Everything a home row draws. */
export type BotRow = {
  id: BotId
  name: string
  /** `push` draws the black or white body by theme. */
  color: BotColor | 'push'
  mascot: MascotState
  /** The dot of 완료 안 읽음, drawn by the mascot. */
  unreadDot: boolean
  /** The open card's title, else the working sentence, else the last message. Empty for a new bot. */
  line: string
  time: string
  accessibilityLabel: string
}
