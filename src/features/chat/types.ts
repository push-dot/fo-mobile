import type { BadgeTone } from '@/shared/components'

// Transcript model (feature-spec 15.2). Items render in order; control events change run state.

export type ToolState = 'run' | 'ok' | 'err' | 'wait'
export type TodoState = 'todo' | 'now' | 'done'

export type ChatItem =
  | { type: 'user'; id: string; text: string; attachment?: string }
  /** `text` supports **bold**; `bullets` render as a t2 list under it. */
  | { type: 'agentText'; id: string; text: string; bullets?: string[] }
  | { type: 'think'; id: string; seconds: number }
  /** `error` replaces the ⎿ result in red (failed or interrupted). `extra` collapses as "+N줄". */
  /** `name` (server tool) lets a later event for the same tool update this line while it runs or waits. */
  | { type: 'tool'; id: string; name?: string; action: string; target?: string; state: ToolState; result?: string; extra?: string[]; error?: string }
  | { type: 'todo'; id: string; title?: string; items: { label: string; state: TodoState; added?: boolean }[] }
  | { type: 'plan'; id: string; title: string; meta: string; rows: { tag: string; tone: BadgeTone; label: string; note: string }[]; keywords: string[] }
  | { type: 'diff'; id: string; lines: { n?: number; sign: '+' | '-' | '~' | ''; text: string }[] }
  | {
      type: 'fit'
      id: string
      score: number
      from?: number
      delta?: string
      caption?: string
      rows?: { label: string; score: number }[]
      keywords?: { label: string; ok: boolean }[]
      /** Single overall bar with a note (점수 올리기). */
      note?: string
    }
  /** `url` is relative to the API base (server artifacts). */
  | { type: 'file'; id: string; name: string; meta?: string; tag?: string; progress?: number; preview?: boolean; url?: string }
  | { type: 'paper'; id: string; label: string; heading: string; lines: string[] }
  | { type: 'actions'; id: string; company: string }
  | { type: 'worked'; id: string; seconds: number }
  | { type: 'error'; id: string; text: string }

export type Choice = { label: string; desc?: string; hint?: string; badge?: { label: string; tone: BadgeTone } }

export type ApprovalSection =
  | { kind: 'choices'; items: Choice[]; selected: number[]; multi?: boolean }
  | { kind: 'chips'; title?: string; options: string[]; selected: number[]; multi?: boolean }
  | { kind: 'rows'; title: string; items: { tag: string; title: string; sub: string; ac?: boolean }[] }
  | { kind: 'templates'; items: { label: string; recommended?: boolean }[]; selected: number[] }

export type Approval = {
  id: string
  question: string
  sections: ApprovalSection[]
  /** Present → picks are confirmed with this button instead of tapping a number. */
  submit?: string
  secondary?: string
  /** What the user bubble says after submit; defaults to the button label. */
  answer?: string
  foot?: string
  optionIds?: string[]
}

export type Awaiting = 'approval' | 'choice'

export type ChatEvent =
  | ChatItem
  | { type: 'start'; at: number }
  | { type: 'status'; verbs: string[] }
  | { type: 'token'; text: string }
  | { type: 'approval'; approval: Approval }
  | { type: 'answer'; text: string }
  | { type: 'queue'; text: string }
  | { type: 'dequeue' }
  | { type: 'stop' }
  | { type: 'done'; at: number; awaiting?: Awaiting }

export type ChatState = {
  items: ChatItem[]
  /** Non-null while the agent works: drives the StatusRow and the stop button. */
  working: { verbs: string[]; startedAt: number } | null
  approval: Approval | null
  awaiting: Awaiting | null
  queue: string[]
  interrupted: boolean
  runStartedAt: number | null
}

/** One scripted step: wait `wait` ms, then apply `event`. Mock runs and tests share this shape. */
export type Step = { wait: number; event: ChatEvent }
