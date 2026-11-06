import { type ChatIntent, type Conversation } from '@push/api-client'

/** Conversation plus the list badges (확인 필요 / 작업 중), last progress line and posting company (chat header pill) the design needs. */
export type ConversationRow = Conversation & { status?: 'NEEDS_APPROVAL' | 'RUNNING' | 'DONE' | null; lastLine?: string | null; company?: string | null }

export type ChatDoc = { id: string; fileName: string; size: number; createdAt: string; aiMade?: boolean }

export type Account = {
  email: string | null
  plan: 'FREE' | 'PRO' | 'ULTRA'
  credits: { used: number; total: number } | null
}

export type QsItem = {
  id: string
  title: string
  /** Line above the title (company) */
  over?: string
  sub?: string
  logo?: { text: string; color: string }
  avatar?: { text: string; color: string }
  badge?: { label: string; tone: 'ac' | 'grey' | 'red' | 'green' | 'orange' }
  note?: { label: string; ac?: boolean }
  meta?: string
  /** Message preview under the person line (제안 답장). */
  body?: string
  date?: { dow: string; day: string; color: 'red' | 'orange' | 'green' }
  /** Which segment tab the item belongs to (0 = first). */
  seg?: number
  selected?: boolean
}

/** Ingredients for one quick-start sheet; copy and layout live in constants.ts. */
export type QsData = {
  segments?: string[]
  /** One line per segment shown when that segment has no items. */
  empty?: (string | undefined)[]
  items: QsItem[]
  doc?: string
  chips?: string[]
  calendar?: { connected: boolean }
}

export type RunInput = {
  conversationId: string
  text?: string
  attachment?: string
  answer?: { approvalId: string; choice: number }
  resolve?: { approvalId: string; optionId: string; optionIds?: string[] }
  interrupted?: boolean
  /** Reattach to the conversation's running job and replay it from the start. */
  follow?: boolean
  intent?: ChatIntent
  context?: { documentId?: string; evidenceIds?: string[] }
}

