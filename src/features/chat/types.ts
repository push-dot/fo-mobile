import type { BotContract, ResultAction, StreamEvent } from '@push/api-client'
import type { PickedFile } from '@/features/my'
import type { BadgeTone } from '@/shared/components'
import type { Notice } from './utils/status-line'

// Transcript model (feature-spec 15.2). Items render in order; control events change run state.

export type ToolState = 'run' | 'ok' | 'err' | 'wait'
export type TodoState = 'todo' | 'now' | 'done'

export type PlanItem = { type: 'plan'; id: string; title: string; meta: string; rows: { tag: string; label: string; note: string }[]; keywords: string[] }

export type ChatItem =
  | { type: 'user'; id: string; text: string; attachment?: string }
  /** `text` supports **bold**; `bullets` render as a t2 list under it. */
  /** `sources` is the 출처 row of a bot answer (ChatBotHeader). */
  /** `card` is the plan that came right after the text, `diff` the edit: the bubble draws them under the text (ChatPh1Feedback, ChatApprove). */
  /** `detail` is grey sub-text under the text; a tap expands it (rule 30). */
  | { type: 'agentText'; id: string; text: string; detail?: string; bullets?: string[]; sources?: BotContract.Attachment[]; card?: PlanItem; diff?: Extract<ChatItem, { type: 'diff' }>; result?: Extract<ChatItem, { type: 'result' }> }
  /** How a run ended badly, drawn as a bubble (ChatInterrupt, ChatVerifyFail). */
  | { type: 'notice'; id: string; notice: Notice }
  | { type: 'think'; id: string; seconds: number }
  /** `error` replaces the ⎿ result in red (failed or interrupted). `extra` collapses as "+N줄". */
  /** `name` (server tool) lets a later event for the same tool update this line while it runs or waits. */
  /** `warning` (retried once) turns the dot orange and leads the result line. */
  | { type: 'tool'; id: string; name?: string; action: string; target?: string; state: ToolState; result?: string; extra?: string[]; error?: string; warning?: string }
  | { type: 'todo'; id: string; title?: string; items: { label: string; state: TodoState; added?: boolean }[] }
  | PlanItem
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
      /** A 점수 올리기 result carries a note; the bubble draws it from the scores and `rounds`. */
      note?: string
      /** What each 점수 올리기 round raised: its target and its result line ("6.9 → 7.8 · …"). */
      rounds?: { label: string; line: string }[]
      /** FREE locks the part rows. */
      plan?: 'FREE' | 'PRO' | 'ULTRA'
      summary?: string
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
  /** `reason` set: the run broke with no line of its own to show, so a bubble says "작업 중 문제가 생겼어요. {reason}. 다시 해 볼까요?" (ChatBotStatusError). */
  | { type: 'error'; id: string; text: string; code?: string; reason?: string }
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
  optionIds: string[]
  /** A tool asking permission (the wire's `approval`), as opposed to a choice. */
  confirm?: true
  /** When the card was asked, in ms. A card waits until it is answered. */
  openedAt?: number
}

export type Awaiting = 'approval' | 'choice'

export type ChatEvent =
  | ChatItem
  | { type: 'start'; at: number }
  | { type: 'status'; verbs: string[] }
  | { type: 'token'; text: string }
  | { type: 'sources'; sources: BotContract.Attachment[] }
  | { type: 'approval'; approval: Approval }
  | { type: 'answer'; text: string }
  /** The card leaves with no answer bubble: 닫기 on an expired card, or a retry a newer message superseded. */
  | { type: 'dismiss' }
  | { type: 'queue'; text: string; file?: PickedFile }
  | { type: 'dequeue' }
  | { type: 'stop'; resumable?: boolean; turn?: string }
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

/** One step of a scripted mock run: wait `wait` ms, then deliver `frame` as the server's stream would. */
export type Step = { wait: number; frame: StreamEvent }
