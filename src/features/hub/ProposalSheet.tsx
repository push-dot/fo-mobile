import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '@push/api-client'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { api } from '../../lib/api'
import { BottomSheet, Chip, Text, TextField } from '../../ui'
import { Avatar } from './Avatar'

type Props = {
  userId: string
  name: string
  /** "개발 · 4년차 · 이직/구직중" */
  subtitle: string
  visible: boolean
  onClose: () => void
  onSent?: () => void
}

const MAX = 500

/** 제안하기 glass sheet (feature-spec 10). One offer per profile; a repeat returns 409. */
export function ProposalSheet({ userId, name, subtitle, visible, onClose, onSent }: Props) {
  const qc = useQueryClient()
  const [message, setMessage] = useState('')
  const [postingId, setPostingId] = useState<string>()
  const [error, setError] = useState<string | null>(null)

  // 함께 보낼 공고 is optional: offer from the user's bookmarks, hide the row when there are none.
  const bookmarks = useQuery({ queryKey: ['me', 'bookmarks', 'offer-pick'], queryFn: () => api.me.bookmarks({ limit: 10 }), enabled: visible })

  const send = useMutation({
    mutationFn: () => api.profiles.offer(userId, { message: message.trim(), postingId }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profiles'] })
      setMessage('')
      setPostingId(undefined)
      onSent?.()
      onClose()
    },
    onError: (e) =>
      setError(e instanceof ApiError && e.code === 'CONFLICT' ? '이미 제안을 보냈어요.' : '제안을 보내지 못했어요. 잠시 후 다시 시도해 주세요.'),
  })

  const postings = bookmarks.data?.data ?? []

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="제안하기"
      action={{ label: '제안 보내기', onPress: () => send.mutate(), disabled: !message.trim() || send.isPending }}
    >
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
        max={MAX}
        value={message}
        onChangeText={(t) => {
          setMessage(t)
          setError(null)
        }}
        placeholder="어떤 이야기를 나누고 싶은지 적어 주세요"
      />
      {postings.length ? (
        <View style={{ gap: 8 }}>
          <Text v="c1" color="t3" weight="700">
            함께 보낼 공고 (선택)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {postings.map((p) => (
              <Chip
                key={p.id}
                label={`${p.company} · ${p.title}`}
                check
                on={postingId === p.id}
                onPress={() => setPostingId(postingId === p.id ? undefined : p.id)}
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
    </BottomSheet>
  )
}
