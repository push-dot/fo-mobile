import { brandOf } from '@push/shared'
import { View } from 'react-native'
import { Chip, Text, TextField } from '../../../shared/components'
import { useColors } from '../../../theme'
import { PROPOSAL_MAX } from '../constants'
import Avatar from './avatar'

type Posting = { id: string; company: string; title: string }

type Props = {
  userId: string
  name: string
  subtitle: string
  message: string
  postingId?: string
  postings: Posting[]
  error: string | null
  onMessage: (message: string) => void
  onPosting: (id: string | undefined) => void
  onError: (message: string | null) => void
}

const ProposalSheet = ({ userId, name, subtitle, message, postingId, postings, error, onMessage, onPosting, onError }: Props) => {
  const c = useColors()
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Avatar userId={userId} name={name} size={44} />
        <View style={{ flex: 1 }}>
          <Text v="b1" weight="700">
            {name} 님에게
          </Text>
          <Text v="c1" color="t3">
            {subtitle}
          </Text>
        </View>
      </View>
      <TextField
        label="메시지"
        accessibilityLabel="메시지"
        multiline
        max={PROPOSAL_MAX}
        value={message}
        onChangeText={(t) => {
          onMessage(t)
          onError(null)
        }}
        placeholder="어떤 이야기를 나누고 싶은지 적어 주세요"
      />
      {postings.length ? (
        <View style={{ gap: 8 }}>
          <Text v="b2" weight="700">
            함께 보낼 공고 (선택)
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {postings.map((p) => (
              <Chip
                key={p.id}
                label={`${p.company} · ${p.title}`}
                lead={
                  <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: brandOf(p.company), alignItems: 'center', justifyContent: 'center' }}>
                    <Text weight="700" style={{ color: c.card, fontSize: 11, lineHeight: 14 }}>
                      {[...p.company][0]}
                    </Text>
                  </View>
                }
                on={postingId === p.id}
                onPress={() => onPosting(postingId === p.id ? undefined : p.id)}
              />
            ))}
          </View>
        </View>
      ) : null}
      <Text v="c1" color="t3">
        제안은 {name} 님의 알림과 메시지함으로 전달돼요.
      </Text>
      {error ? (
        <Text v="c1" color="red" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  )
}

export default ProposalSheet
