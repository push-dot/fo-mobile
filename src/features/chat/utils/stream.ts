import type { BotContract, StreamEvent } from '@push/api-client'
import { DEFAULT_ERROR_TEXT, ERROR_TEXT, PROFILE_SAVED, queueBusyMessage } from '../constants'
import type { ChatEvent } from '../types'
import { noticeOf } from './notices'

const detailRecord = (value: unknown): Record<string, unknown> | undefined =>
  value !== null && typeof value === 'object' ? (value as Record<string, unknown>) : undefined

export const errorReason = (code: string | undefined, reason: unknown) =>
  code !== 'QUEUE_BUSY' && !(code && ERROR_TEXT[code]) && typeof reason === 'string' && reason ? reason : undefined

export const errorText = (code?: string, retryAfterSec?: number, reason?: unknown) =>
  code === 'QUEUE_BUSY' ? queueBusyMessage(retryAfterSec, reason) : (code && ERROR_TEXT[code]) || DEFAULT_ERROR_TEXT

export const mapEvent = (ev: StreamEvent, turn?: string): ChatEvent[] => {
  switch (ev.type) {
    case 'token':
      return [{ type: 'token', text: ev.text }]
    case 'status': {
      const card = (ev as { phase?: string; cardId?: string }).phase === 'waiting' ? (ev as { cardId?: string }).cardId : undefined
      return [{ type: 'status', verbs: [ev.text] }, ...(card ? [{ type: 'wait' as const, surfaceId: card }] : [])]
    }
    case 'a2ui':
      return [{ type: 'surface', id: ev.surfaceId, kind: ev.kind, messages: ev.messages }]
    case 'tool': {
      const error = ev.state === 'err' && typeof ev.result?.error === 'string' ? ev.result.error : undefined
      const changeId = ev.name === 'update_my_profile' && ev.state === 'ok' && typeof ev.result?.changeId === 'string' ? ev.result.changeId : undefined
      const line: ChatEvent[] = changeId ? [{ type: 'agentText', id: `undo-${changeId}`, text: PROFILE_SAVED, undo: changeId }] : []
      return [
        {
          type: 'tool',
          id: `tool-${ev.name}`,
          name: ev.name,
          action: ev.summary,
          state: ev.state,
          error,
          ...(ev.target ? { target: ev.target } : {}),
          ...(ev.resultLine ? { result: ev.resultLine } : {}),
          ...(ev.extra?.length ? { extra: ev.extra } : {}),
          ...(ev.warning ? { warning: ev.warning } : {}),
        },
        ...line,
      ]
    }
    case 'think':
      return [{ type: 'think', id: `think-${ev.seq ?? ev.phase ?? '0'}`, seconds: ev.seconds }]
    case 'file':
      return [{ type: 'file', id: `file-${ev.fileId}`, name: ev.name, url: ev.downloadUrl, preview: true }]
    case 'error': {
      const details = detailRecord(ev.error.details)
      const retry = details?.retryAfterSec
      const sec = typeof retry === 'number' ? retry : undefined
      const reason = errorReason(ev.error.code, details?.reason)
      return [{ type: 'error', id: `err-${ev.seq ?? Date.now()}`, text: errorText(ev.error.code, sec, details?.reason), code: ev.error.code, ...(reason ? { reason } : {}) }]
    }
    case 'cancelled':
      return [{ type: 'stop', resumable: (ev as { resumable?: boolean }).resumable === true, ...(turn ? { turn } : {}) }]
    case 'done': {
      const sources = (ev as { sources?: BotContract.Attachment[] }).sources
      return [...(sources?.length ? [{ type: 'sources' as const, sources }] : []), { type: 'done', at: 0, awaiting: ev.awaiting }]
    }
    default: {
      const notice = (ev as { type: string }).type === 'notice' ? noticeOf(ev as { text?: string; seq?: number }) : null
      return notice ? [notice] : []
    }
  }
}

type Frame = { type: string; seq?: number; turn?: string; text?: string }

export type StreamEnd = { reason: 'terminal' | 'reattach-empty' | 'no-seq' }

const turnOf = (ev: Frame) => (typeof ev.turn === 'string' ? ev.turn : undefined)

export const fromStream = async function* (
  first: AsyncIterable<Frame>,
  resume: (after?: number) => AsyncIterable<Frame>,
  end?: StreamEnd,
  open?: string,
): AsyncGenerator<ChatEvent> {
  const mark = (reason: StreamEnd['reason']) => {
    if (end) end.reason = reason
  }
  let seq: number | undefined
  let piece: string | null = open ?? null
  for (let source = first; ; source = resume(seq)) {
    let got = false
    for await (const ev of source) {
      got = true
      if (ev.seq !== undefined) seq = ev.seq
      const turn = turnOf(ev)
      if (ev.type === 'token' && turn && ev.seq !== undefined && ev.text !== undefined) {
        if (!piece?.startsWith(`${turn}:`)) {
          piece = `${turn}:${ev.seq}`
          yield { type: 'agentText', id: piece, text: ev.text }
        } else yield { type: 'token', text: ev.text }
      } else {
        if (ev.type !== 'status') piece = null
        yield* mapEvent(ev as StreamEvent, turn)
      }
      if (ev.type === 'done' || ev.type === 'error' || ev.type === 'cancelled') {
        mark('terminal')
        return
      }
    }
    if (!got) {
      mark('reattach-empty')
      return
    }
    if (seq === undefined) {
      mark('no-seq')
      return
    }
  }
}
