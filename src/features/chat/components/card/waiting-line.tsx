import type { MascotColor } from '../../../../theme/mascot'
import type { Approval } from '../../types'
import StatusLine from '../status-line'
import { waitingLine } from '../../utils/card'

/** "확인을 기다리고 있어요 24초" above the panel, until the card is answered. */
export const WaitingLine = ({ approval, color }: { approval: Approval; color?: MascotColor }) => {
  const line = waitingLine(approval)
  return line ? <StatusLine line={line} color={color} /> : null
}
