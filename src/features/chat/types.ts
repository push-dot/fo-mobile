import type { ResultAction } from '@push/api-client'
import type { PickedFile } from '@/features/my'
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
  /** `warning` (retried once) turns the dot orange and leads the result line. */
  | { type: 'tool'; id: string; name?: string; action: string; target?: string; state: ToolState; result?: string; extra?: string[]; error?: string; warning?: string }
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
      /** FREE locks the part rows; PRO shows the ULTRA teaser; ULTRA shows `projected`. */
      plan?: 'FREE' | 'PRO' | 'ULTRA'
      summary?: string
      projected?: { label: string; bullets: string[] }
    }
  /** `url` is relative to the API base (server artifacts). */
  | { type: 'file'; id: string; name: string; meta?: string; progress?: number; preview?: boolean; url?: string }
  | { type: 'paper'; id: string; label: string; heading: string; lines: string[] }
  | {
      type: 'result'
      id: string
      source: 'external'
      checklist: string[]
      documentId: string
      company?: string
      actions: ResultAction[]
      fileName: string
      pageLine: string
      savedLine?: string
      cardMeta?: string
    }
  | {
      type: 'result'
      id: string
      source: 'profile'
      checklist: string[]
      documentId: string
      company?: string
      actions: ResultAction[]
      name: string
      headline: string
      title: string
      subtitle: string
      /** Set while a profile-save choice is still unanswered. */
      pendingNote?: string
    }
  | { type: 'worked'; id: string; seconds: number }
  | { type: 'error'; id: string; text: string; code?: string }
  | { type: 'stale'; id: string; text: string }

export type Choice = { label: string; desc?: string; hint?: string; badge?: { label: string; tone: BadgeTone } }

export type TemplateLayout = 'classic' | 'modern' | 'compact' | 'ats'

export type ApprovalSection =
  | { id?: string; kind: 'choices'; items: Choice[]; selected: number[]; multi?: boolean; ids?: string[] }
  | { id?: string; kind: 'chips'; title?: string; options: string[]; selected: number[]; multi?: boolean; ids?: string[] }
  | { id?: string; kind: 'rows'; title: string; items: { id?: string; tag: string; title: string; sub: string; ac?: boolean; action?: 'change' }[] }
  | { id?: string; kind: 'templates'; items: { id?: string; label: string; layout?: TemplateLayout; recommended?: boolean }[]; selected: number[] }
  | { id?: string; kind: 'toggle'; items: Choice[]; selected: number[]; ids: string[] }

export type Approval = {
  id: string
  question: string
  sections: ApprovalSection[]
  /** Present → picks are confirmed with this button instead of tapping a number. */
  submit?: string
  submitLabels?: Record<string, string>
  zeroSubmit?: string
  /** Copied onto the latest profile result while this choice is open. */
  pendingNote?: string
  secondary?: string
  /** What the user bubble says after submit; defaults to the button label. */
  answer?: string
  foot?: string
  /** Server warning shown in place of the hint, e.g. 지원하면 취소할 수 없어요. */
  warning?: string
  detail?: string
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
  | { type: 'queue'; text: string; file?: PickedFile }
  | { type: 'dequeue' }
  | { type: 'stop' }
  | { type: 'done'; at: number; awaiting?: Awaiting }

export type ChatState = {
  items: ChatItem[]
  /** Non-null while the agent works: drives the StatusRow and the stop button. */
  working: { verbs: string[]; startedAt: number } | null
  approval: Approval | null
  awaiting: Awaiting | null
  queue: { text: string; file?: PickedFile }[]
  interrupted: boolean
  runStartedAt: number | null
}

/** One scripted step: wait `wait` ms, then apply `event`. Mock runs and tests share this shape. */
export type Step = { wait: number; event: ChatEvent }
