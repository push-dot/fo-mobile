import { noticeBubble, type Notice as NoticeModel } from '../../utils/status-line'
import BotText from './bot'

const Notice = ({ id, notice }: { id: string; notice: NoticeModel }) => <BotText item={{ type: 'agentText', id, ...noticeBubble(notice) }} />

export default Notice
