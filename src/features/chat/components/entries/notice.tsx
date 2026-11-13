import StatusLine from '../status-line'
import type { Notice as NoticeModel } from '../../utils/status-line'

const Notice = ({ notice }: { notice: NoticeModel }) => <StatusLine line={notice} />

export default Notice
