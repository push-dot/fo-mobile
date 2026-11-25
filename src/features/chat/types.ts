import type { A2uiKind, A2uiMessage, BotContract, StreamEvent } from '@push/api-client'
import type { PickedFile } from '@/features/my'
import type { Notice } from './utils/status-line'


export type ToolState = 'run' | 'ok' | 'err' | 'wait'

export type ChatItem =
  | { type: 'user'; id: string; text: string; attachment?: string }
  | { type: 'agentText'; id: string; text: string; detail?: string; bullets?: string[]; sources?: BotContract.Attachment[]; undo?: string }
  | { type: 'notice'; id: string; notice: Notice }
  | { type: 'think'; id: string; seconds: number }
  | { type: 'tool'; id: string; name?: string; action: string; target?: string; state: ToolState; result?: string; extra?: string[]; error?: string; warning?: string }
  | { type: 'surface'; id: string; kind: A2uiKind; messages: A2uiMessage[] }
  | { type: 'file'; id: string; name: string; meta?: string; progress?: number; preview?: boolean; url?: string }
  | { type: 'worked'; id: string; seconds: number }
  | { type: 'error'; id: string; text: string; code?: string; reason?: string }

export type DiffLine = { n?: number; sign: '+' | '-' | '~' | ''; text: string }

export type Awaiting = 'approval' | 'choice'

export type ChatEvent =
  | ChatItem
  | { type: 'start'; at: number }
  | { type: 'status'; verbs: string[] }
  | { type: 'token'; text: string }
  | { type: 'sources'; sources: BotContract.Attachment[] }
  | { type: 'wait'; surfaceId: string }
  | { type: 'answer'; surfaceId: string; picked: string[] }
  | { type: 'reopen'; surfaceId: string }
  | { type: 'queue'; text: string; file?: PickedFile }
  | { type: 'dequeue' }
  | { type: 'stop'; resumable?: boolean; turn?: string }
  | { type: 'done'; at: number; awaiting?: Awaiting }

export type ChatState = {
  items: ChatItem[]
  working: { verbs: string[]; startedAt: number } | null
  waiting: string | null
  awaiting: Awaiting | null
  queue: { text: string; file?: PickedFile }[]
  interrupted: boolean
  runStartedAt: number | null
  runAfter: string | null
}

export type Step = { wait: number; frame: StreamEvent }
