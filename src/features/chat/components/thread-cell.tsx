import type { MascotColor } from '../../../theme/mascot'
import { useChatWorking, useLiveItem } from '../hooks'
import type { ChatItem } from '../types'
import type { ThreadRow } from '../utils/usage'
import { Item } from './entries'
import { RowMotion } from './motion'
import { StatusRow } from './status-line'

type ItemProps = Parameters<typeof Item>[0]
type Callbacks = Pick<ItemProps, 'onView' | 'onUsage' | 'onRetry' | 'onReadOff'>

const noStop = () => undefined

/** The running line reads the verbs itself: a status event re-renders this one row, not the list. */
const RunningLine = ({ chatId, color }: { chatId: string; color: MascotColor }) => {
  const working = useChatWorking(chatId)
  return working ? <StatusRow verbs={working.verbs} startedAt={working.startedAt} onStop={noStop} color={color} /> : null
}

/** The last bot line grows token by token: it alone follows the store. */
const StreamingItem = ({ chatId, row, ...rest }: { chatId: string; row: ChatItem; writing: boolean } & Callbacks) => {
  const live = useLiveItem(chatId, row.id) ?? row
  return <Item item={live} {...rest} />
}

type Props = Callbacks & {
  chatId: string
  row: ThreadRow
  color: MascotColor
  /** Lines that arrive after the room opened pop in (RowMotion). */
  live: boolean
  /** The line right above the running line: the one being written. */
  writing: boolean
  /** The newest line of the thread; a bot line there may still be streaming. */
  last: boolean
}

export const ThreadCell = ({ chatId, row, color, live, writing, last, ...callbacks }: Props) => {
  const motion = { key: `${chatId}/${row.id}`, live }
  return (
    <RowMotion.Provider value={motion}>
      {row.type === 'running' ? (
        <RunningLine chatId={chatId} color={color} />
      ) : last && row.type === 'agentText' ? (
        <StreamingItem chatId={chatId} row={row} writing={writing} {...callbacks} />
      ) : (
        <Item item={row} writing={writing} {...callbacks} />
      )}
    </RowMotion.Provider>
  )
}
