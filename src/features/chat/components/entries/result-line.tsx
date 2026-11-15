import { Pressable } from 'react-native'
import { Text } from '@/shared/components'
import { useShareFile } from '../../api/hooks'
import type { ChatItem } from '../../types'

type Result = Extract<ChatItem, { type: 'result' }>

const withoutExtension = (name: string) => name.replace(/\.[A-Za-z0-9]{2,4}$/, '')

/** The result as the closing line of the bot's bubble: the profile opens, the file shares (ChatPh6Result "Push 프로필 보기 ›", ChatPh6ResultFile "김서준_모아페이_백엔드 · A4 1쪽"). */
const ResultLine = ({ card, onView }: { card: Result; onView: (card: Result) => void }) => {
  const share = useShareFile()
  const profile = card.source === 'profile'
  const label = profile ? 'Push 프로필 보기' : withoutExtension(card.fileName)
  // The server's page line carries the size too ("A4 1쪽 · 186KB"); the board names the pages only.
  const tail = profile ? ' ›' : ` · ${card.pageLine.split(' · ')[0]}`
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => (profile ? onView(card) : share.mutate({ documentId: card.documentId, name: card.fileName }))}
    >
      <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20 }}>
        <Text v="c1" color="t3" style={{ fontSize: 14, lineHeight: 20, textDecorationLine: 'underline' }}>
          {label}
        </Text>
        {tail}
      </Text>
    </Pressable>
  )
}

export default ResultLine
