import { View } from 'react-native'
import { Text } from '@/shared/components'
import type { TranscriptEntry } from '../utils/reducer'
import BotText from './entries/bot'
import Notice from './entries/notice'
import UserBubble from './entries/user'
import StatusLine from './status-line'

const Transcript = ({ entries }: { entries: readonly TranscriptEntry[] }) => (
  <View style={{ gap: 18 }}>
    {entries.map((entry) => {
      if (entry.type === 'status') return <StatusLine key={entry.id} line={entry.line} />
      if (entry.type === 'notice') return <Notice key={entry.id} notice={entry.notice} />
      if (entry.type === 'user') return <UserBubble key={entry.id} item={{ type: 'user', id: entry.id, text: entry.text }} />
      if (entry.type === 'bot') return <BotText key={entry.id} item={{ type: 'agentText', id: entry.id, text: entry.text }} />
      return (
        <Text key={entry.id} v="b2">
          {entry.text}
        </Text>
      )
    })}
  </View>
)

export default Transcript
