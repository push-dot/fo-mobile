import type { MascotColor } from '../../../theme/mascot'
import { lineFromWorking } from '../utils/status-line'
import StatusLine from './status-line'

type StatusRowProps = { verbs: string[]; startedAt: number; onStop: () => void; color?: MascotColor }

const StatusRow = ({ verbs, startedAt, color }: StatusRowProps) => <StatusLine line={lineFromWorking(verbs, new Date(startedAt))} color={color} />

export default StatusRow
