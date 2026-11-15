import { Pressable } from 'react-native'
import { Text } from '@/shared/components'
import { useShareFile } from '../../api/hooks'
import type { ChatItem } from '../../types'

type Result = Extract<ChatItem, { type: 'result' }>

const withoutExtension = (name: string) => name.replace(/\.[A-Za-z0-9]{2,4}$/, '')

/**
 * The result as the closing line of the bot's bubble: a profile that names itself draws its title (underlined) and subtitle in grey and opens on a tap (ChatDoneProfile
 * "김서준 · 백엔드 엔지니어 · Push 프로필 · 방금 수정"), one that does not is the link "Push 프로필 보기 ›" (ChatPh6Result); the file shares (ChatDone "김서준_모아페이_백엔드 · A4 1쪽 · 186KB").
 */
const ResultLine = ({ card, onView }: { card: Result; onView: (card: Result) => void }) => {
  const share = useShareFile()
  const profile = card.source === 'profile'
  const named = profile && !!card.subtitle
  const label = named ? card.title : profile ? 'Push 프로필 보기' : withoutExtension(card.fileName)
  const tail = named ? ` · ${card.subtitle}` : profile ? ' ›' : ` · ${card.pageLine}`
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
