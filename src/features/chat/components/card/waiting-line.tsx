import type { Approval } from '../../types'
import StatusLine from '../status-line'
import { useCardState } from './use-card-state'
import { waitingLine } from '../../utils/card'

/** "확인을 기다리고 있어요 24초" above the panel. It leaves with the card's time (ChatBotStatusExpired has none). */
export const WaitingLine = ({ approval }: { approval: Approval }) => {
  const line = waitingLine(approval, useCardState(approval))
  return line ? <StatusLine line={line} /> : null
}
