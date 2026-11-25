import type { MascotColor } from '../../../theme/mascot'
import { useChatWorking, useLiveItem } from '../hooks'
import type { ChatItem } from '../types'
import type { ThreadRow } from '../utils/usage'
import { Item } from './entries'
import { RowMotion } from './motion'
import { StatusRow } from './status-line'

type ItemProps = Parameters<typeof Item>[0]
type Callbacks = Pick<ItemProps, 'onLocal' | 'onReadOff'>

const noStop = () => undefined

const RunningLine = ({ chatId, color }: { chatId: string; color: MascotColor }) => {
  const working = useChatWorking(chatId)
  return working ? <StatusRow verbs={working.verbs} startedAt={working.startedAt} onStop={noStop} color={color} /> : null
}

const StreamingItem = ({ chatId, row, ...rest }: { chatId: string; row: ChatItem } & Callbacks) => {
  const live = useLiveItem(chatId, row.id) ?? row
  return <Item chatId={chatId} item={live} {...rest} />
}

type Props = Callbacks & {
  chatId: string
  row: ThreadRow
  color: MascotColor
  live: boolean
  last: boolean
}

export const ThreadCell = ({ chatId, row, color, live, last, ...callbacks }: Props) => {
  const motion = { key: `${chatId}/${row.id}`, live }
  return (
    <RowMotion.Provider value={motion}>
      {row.type === 'running' ? (
        <RunningLine chatId={chatId} color={color} />
      ) : last && row.type === 'agentText' ? (
        <StreamingItem chatId={chatId} row={row} {...callbacks} />
      ) : (
        <Item chatId={chatId} item={row} {...callbacks} />
      )}
    </RowMotion.Provider>
  )
}
