import { brandColor } from '@push/shared'
import { Platform, ScrollView, View } from 'react-native'
import { Chip, GlassButton, Text, TextField } from '../../../shared/components'
import { spacing, useColors } from '../../../theme'
import { PROPOSAL_MAX } from '../constants'
import Avatar from './avatar'

type Posting = { id: string; company: string; title: string }

type Props = {
  name: string
  subtitle: string
  message: string
  postingId?: string
  postings: Posting[]
  error: string | null
  onMessage: (message: string) => void
  onPosting: (id: string | undefined) => void
  onError: (message: string | null) => void
  onClose: () => void
}

const bleed = Platform.OS === 'android' ? spacing[5] : spacing[4]

const ProposalSheet = ({ name, subtitle, message, postingId, postings, error, onMessage, onPosting, onError, onClose }: Props) => {
  const c = useColors()
  return (
    <View style={{ gap: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        {Platform.OS === 'ios' ? <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: onClose }]} /> : null}
        <Text v="h2" accessibilityRole="header" style={{ flex: 1 }}>
          제안하기
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
        <Avatar name={name} size={44} />
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
        <View style={{ gap: spacing[3] }}>
          <Text v="b2" weight="700">
            함께 보낼 공고 (선택)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginRight: -bleed }} contentContainerStyle={{ gap: spacing[2], paddingRight: bleed }}>
            {postings.map((p) => (
              <Chip
                key={p.id}
                check
                label={`${p.company} · ${p.title}`}
                lead={
                  <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: brandColor(p.company), alignItems: 'center', justifyContent: 'center' }}>
                    <Text weight="700" style={{ color: c.card }}>
                      {[...p.company][0]}
                    </Text>
                  </View>
                }
                on={postingId === p.id}
                onPress={() => onPosting(postingId === p.id ? undefined : p.id)}
              />
            ))}
          </ScrollView>
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
