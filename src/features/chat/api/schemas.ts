import { type ChatIntent, type Conversation } from '@push/api-client'

export type ConversationRow = Conversation & { status?: 'NEEDS_APPROVAL' | 'RUNNING' | 'DONE' | null; lastLine?: string | null; company?: string | null }

export type ChatDoc = { id: string; fileName: string; size: number; createdAt: string; aiMade?: boolean }

export type Account = {
  plan: 'FREE' | 'PRO' | 'ULTRA'
  credits: { used: number; total: number } | null
  paymentsEnabled?: boolean
  creditsRefillAt?: string
  usageByBot?: { name: string; percent: number }[]
}

export type QsItem = {
  id: string
  title: string
  over?: string
  sub?: string
  logo?: { text: string; color: string }
  avatar?: { text: string; color: string }
  badge?: { label: string; solid?: boolean }
  meta?: string
  body?: string
  date?: { dow: string; day: string; color: 'red' | 'orange' | 'green' }
  seg?: number
  selected?: boolean
}

export type QsData = {
  segments?: string[]
  empty?: (string | undefined)[]
  items: QsItem[]
  doc?: string
  chips?: string[]
}

export type RunInput = {
  conversationId: string
  text?: string
  attachment?: string
  resolve?: { approvalId: string; optionId: string; optionIds?: string[] }
  interrupted?: boolean
  follow?: boolean
  after?: number
  piece?: string
  intent?: ChatIntent
  context?: { documentId?: string; evidenceIds?: string[]; materials?: { kind: 'file' | 'document' | 'posting' | 'link'; id: string }[] }
}

