import { useState } from 'react'
import type { MascotColor } from '../../../theme/mascot'
import type { LiveLine } from '../utils/status-line'
import StatusLine from './status-line'

const AwaitingRow = ({ text, color }: { text: string; color?: MascotColor }) => {
  const [since] = useState(() => new Date())
  const line: LiveLine = { kind: 'waiting', since, for: text.startsWith('확인') ? 'confirm' : 'answer', cardId: 'awaiting', text }
  return <StatusLine line={line} color={color} />
}

export default AwaitingRow
