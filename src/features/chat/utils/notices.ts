import { READ_OFF_CODE, READ_OFF_TEXT } from '../constants'
import type { ChatItem } from '../types'

type NoticeFrame = { text?: string; code?: string; seq?: number }

/**
 * A notice frame: the read switch refusal (ChatBotReadOff) or a step that failed while the run went on (ChatVerifyFail).
 * push-be's spec lists a notice with text only, while the runtime also sends `code`, so either one names the refusal.
 * The refusal is one bubble per turn, so its id is the turn: a live run and a reopened chat draw the same entry.
 */
export const noticeOf = (ev: NoticeFrame, turn?: string): ChatItem | null => {
  if (ev.code === READ_OFF_CODE || ev.text === READ_OFF_TEXT) return { type: 'readOff', id: `read-off-${turn ?? ev.seq ?? 0}`, text: READ_OFF_TEXT }
  return ev.text ? { type: 'notice', id: `notice-${ev.seq ?? ev.text}`, notice: { kind: 'failed', text: ev.text } } : null
}
