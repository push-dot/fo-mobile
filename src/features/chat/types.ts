import type { A2uiKind, A2uiMessage, BotContract, StreamEvent } from '@push/api-client'
import type { PickedFile } from '@/features/my'
import type { Notice } from './utils/status-line'

// Transcript model (feature-spec 15.2). Items render in order; control events change run state.

export type ToolState = 'run' | 'ok' | 'err' | 'wait'

export type ChatItem =
  | { type: 'user'; id: string; text: string; attachment?: string }
  /** `text` supports **bold**; `bullets` render as the dotted list (`ul.mdul`) under it. */
  /** `sources` is the 출처 row of a bot answer (ChatBotHeader). */
  /** `detail` is grey sub-text under the text; a tap expands it (rule 30). */
  | { type: 'agentText'; id: string; text: string; detail?: string; bullets?: string[]; sources?: BotContract.Attachment[]; /** The changeId of a profile the run saved at once: the line draws 되돌리기, read from the server (rule 39). */ undo?: string }
  /** How a run ended badly, drawn as a bubble (ChatInterrupt, ChatVerifyFail). */
  | { type: 'notice'; id: string; notice: Notice }
  | { type: 'think'; id: string; seconds: number }
  /** `error` replaces the ⎿ result in red (failed or interrupted). `extra` collapses as "+N줄". */
  /** `name` (server tool) lets a later event for the same tool update this line while it runs or waits. */
  /** `warning` (retried once) turns the dot orange and leads the result line. */
  | { type: 'tool'; id: string; name?: string; action: string; target?: string; state: ToolState; result?: string; extra?: string[]; error?: string; warning?: string }
  /**
   * A Bot card: one A2UI surface, upserted by its surfaceId (`id`). `messages` only grows: a repeated frame adds its
   * updateComponents and updateDataModel, and an answer adds the `/open` and `/picked` patches.
   */
  | { type: 'surface'; id: string; kind: A2uiKind; messages: A2uiMessage[] }
  /** `url` is relative to the API base (server artifacts). */
  | { type: 'file'; id: string; name: string; meta?: string; progress?: number; preview?: boolean; url?: string }
  | { type: 'worked'; id: string; seconds: number }
  /** `reason` set: the run broke with no line of its own to show, so a bubble says "작업 중 문제가 생겼어요. {reason}. 다시 해 볼까요?" (ChatBotStatusError). */
  | { type: 'error'; id: string; text: string; code?: string; reason?: string }

/** A line of the review page: PushDiff's lines (`~` marks a line edited in place). */
export type DiffLine = { n?: number; sign: '+' | '-' | '~' | ''; text: string }

export type Awaiting = 'approval' | 'choice'

export type ChatEvent =
  | ChatItem
  | { type: 'start'; at: number }
  | { type: 'status'; verbs: string[] }
  | { type: 'token'; text: string }
  | { type: 'sources'; sources: BotContract.Attachment[] }
  /** The status `waiting` frame: the surface the run now waits on. */
  | { type: 'wait'; surfaceId: string }
  /** The person answered the waiting surface (a pick, or free text with no pick): it closes in place, keeping `picked`. */
  | { type: 'answer'; surfaceId: string; picked: string[] }
  /** The answer did not reach the server: the surface waits again. */
  | { type: 'reopen'; surfaceId: string }
  | { type: 'queue'; text: string; file?: PickedFile }
  | { type: 'dequeue' }
  | { type: 'stop'; resumable?: boolean; turn?: string }
  | { type: 'done'; at: number; awaiting?: Awaiting }

export type ChatState = {
  items: ChatItem[]
  /** Non-null while the agent works: drives the StatusRow and the stop button. */
  working: { verbs: string[]; startedAt: number } | null
  /** The surfaceId of the newest surface waiting for an answer: the only one whose PushChoice responds. */
  waiting: string | null
  awaiting: Awaiting | null
  queue: { text: string; file?: PickedFile }[]
  interrupted: boolean
  runStartedAt: number | null
}

/** One step of a scripted mock run: wait `wait` ms, then deliver `frame` as the server's stream would. */
export type Step = { wait: number; frame: StreamEvent }
