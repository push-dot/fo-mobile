import type { ChatItem } from '../types'

type NoticeFrame = { text?: string; seq?: number }

/** A notice frame: a step that failed while the run went on (ChatVerifyFail). */
export const noticeOf = (ev: NoticeFrame): ChatItem | null =>
  ev.text ? { type: 'notice', id: `notice-${ev.seq ?? ev.text}`, notice: { kind: 'failed', text: ev.text } } : null
