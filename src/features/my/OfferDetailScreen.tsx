import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import type { Offer } from '@push/api-client'
import { api } from '../../lib/api'
import { fontFor, radius, useColors } from '../../theme'
import {
  Badge,
  BottomSheet,
  Button,
  careerLabel,
  Chip,
  Glass,
  Icon,
  Text,
  TextField,
  TopBar,
} from '../../ui'
import { clock, dday, monthDay, offerBadge } from './lib'
import { counterpart } from './OffersScreen'
import { Avatar, Logo } from './parts'

type Box = 'received' | 'sent'

function Thread({ offer, meId }: { offer: Offer; meId: string }) {
  const c = useColors()
  const qc = useQueryClient()
  const [text, setText] = useState('')
  const key = ['me', 'offer', offer.id, 'messages']
  const { data } = useQuery({
    queryKey: key,
    queryFn: () => api.me.offerMessages(offer.id, { limit: 100 }),
  })
  const send = useMutation({
    mutationFn: (body: string) => api.me.sendOfferMessage(offer.id, body),
    onSuccess: () => {
      setText('')
      void qc.invalidateQueries({ queryKey: key })
    },
    onError: () => Alert.alert('메시지를 보내지 못했어요', '잠시 뒤에 다시 보내 주세요.'),
  })
  const canSend = !!text.trim() && !send.isPending
  return (
    <View style={{ gap: 10 }}>
      <Text v="h3" accessibilityRole="header" style={{ marginTop: 4 }}>
        메시지
      </Text>
      {data?.data.length === 0 ? (
        <Text v="b2" color="t3">
          첫 메시지를 보내 대화를 시작해 보세요.
        </Text>
      ) : null}
      {data?.data.map((m) => {
        const mine = m.sender.id === meId
        return (
          <View key={m.id} style={{ alignItems: mine ? 'flex-end' : 'flex-start', gap: 2 }}>
            <View
              style={{
                maxWidth: '82%',
                borderRadius: 18,
                paddingVertical: 10,
                paddingHorizontal: 14,
                backgroundColor: mine ? c.ac : c.bg2,
              }}
            >
              <Text v="b2" style={{ color: mine ? '#FFFFFF' : c.t1 }}>
                {m.body}
              </Text>
            </View>
            <Text v="c2" color="t3">
              {monthDay(m.createdAt)} {clock(m.createdAt)}
            </Text>
          </View>
        )
      })}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: 6 }}>
        <TextInput
          accessibilityLabel="메시지"
          value={text}
          onChangeText={setText}
          placeholder="메시지 보내기"
          placeholderTextColor={c.t4}
          multiline
          style={[
            {
              flex: 1,
              minHeight: 48,
              maxHeight: 120,
              borderRadius: radius.md,
              backgroundColor: c.fill,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: 12,
              fontSize: 16,
              color: c.t1,
            },
            fontFor('400'),
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="보내기"
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={() => send.mutate(text.trim())}
          style={{
            width: 48,
            height: 48,
            borderRadius: 24,
            backgroundColor: canSend ? c.ac : c.fill2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="up" size={20} color={canSend ? '#FFFFFF' : c.t4} />
        </Pressable>
      </View>
    </View>
  )
}

/** 제안 상세: sender, message, 함께 보낸 공고, AI 맞추기 card; 거절 / 수락하고 답장하기; 1:1 메시지 after accept. */
export function OfferDetailScreen({ id, box = 'received' }: { id: string; box?: Box }) {
  const c = useColors()
  const qc = useQueryClient()
  const insets = useSafeAreaInsets()
  const [replying, setReplying] = useState(false)
  const [reply, setReply] = useState('')
  const { data: o, isLoading } = useQuery({
    queryKey: ['me', 'offer', id],
    queryFn: () => api.me.offer(id),
  })

  // Opening marks the offer read on the server; refresh lists and the inbox badge.
  useEffect(() => {
    if (o) void qc.invalidateQueries({ queryKey: ['me', 'offers'] })
  }, [o?.id, qc]) // eslint-disable-line react-hooks/exhaustive-deps

  const done = (next: Offer) => {
    qc.setQueryData(['me', 'offer', id], next)
    void qc.invalidateQueries({ queryKey: ['me', 'offers'] })
    void qc.invalidateQueries({ queryKey: ['me', 'offer', id, 'messages'] })
  }
  const accept = useMutation({
    mutationFn: () => api.me.acceptOffer(id, reply.trim() || undefined),
    onSuccess: (next) => {
      setReplying(false)
      setReply('')
      done(next)
    },
    onError: () => Alert.alert('수락하지 못했어요', '잠시 뒤에 다시 시도해 주세요.'),
  })
  const decline = useMutation({ mutationFn: () => api.me.declineOffer(id), onSuccess: done })
  // The offer only carries a posting stub; the detail (shared cache with the posting screen) fills 지역 · 경력 · 마감.
  const postingId = o?.posting?.id
  const { data: full } = useQuery({
    queryKey: ['postings', 'detail', postingId],
    queryFn: () => api.postings.get(postingId!),
    enabled: !!postingId,
  })

  if (isLoading || !o) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar onBack={() => router.back()} />
        {isLoading ? <ActivityIndicator style={{ marginTop: 60 }} /> : null}
      </View>
    )
  }

  const who = counterpart(o, box)
  const badge = offerBadge(o, box)
  const meId = box === 'received' ? o.recipient.id : o.sender.id
  const pending = box === 'received' && (o.status === 'SENT' || o.status === 'READ')
  const p = o.posting

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: c.bg }}
    >
      <TopBar onBack={() => router.back()} />
      <ScrollView
        contentContainerStyle={{ gap: 18, paddingTop: 4, paddingHorizontal: 20, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Avatar name={who.displayName} url={who.avatarUrl} size={56} />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text v="h3" accessibilityRole="header" numberOfLines={1} style={{ flexShrink: 1 }}>
                {who.displayName}
              </Text>
              <Badge label={badge.label} tone={badge.tone} />
            </View>
            {who.affiliation ? (
              <Text v="c1" color="t3">
                {who.affiliation}
              </Text>
            ) : null}
          </View>
        </View>
        <View style={{ alignSelf: 'flex-start' }}>
          <Chip label="허브 프로필 보기" onPress={() => router.push(`/profiles/${who.id}`)} />
        </View>
        <View
          style={{
            borderRadius: 20,
            backgroundColor: c.bg2,
            paddingVertical: 16,
            paddingHorizontal: 18,
          }}
        >
          <Text v="b1" style={{ lineHeight: 25 }}>
            {o.message}
          </Text>
        </View>
        <Text v="c1" color="t3" style={{ marginTop: -8 }}>
          {monthDay(o.createdAt)} {clock(o.createdAt)} · {box === 'received' ? '받음' : '보냄'}
        </Text>

        {p ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`함께 보낸 공고 ${p.company} ${p.title}`}
            onPress={() => router.push(`/postings/${p.id}`)}
          >
            <Glass
              style={{
                borderRadius: 16,
                paddingVertical: 14,
                paddingHorizontal: 16,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <Logo name={p.company} size={44} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text v="c1" weight="600" color="t3">
                  함께 보낸 공고
                </Text>
                <Text v="b2" weight="700" numberOfLines={1}>
                  {p.title}
                </Text>
                <Text v="c1" color="t3" numberOfLines={1}>
                  {[full?.location, full && `경력 ${careerLabel(full)}`, full?.deadline ? dday(full.deadline) : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Text>
              </View>
              <Icon name="chev" size={18} color="t4" />
            </Glass>
          </Pressable>
        ) : null}

        {pending && p ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(tabs)/(chat)/chat')}
            style={{
              paddingVertical: 16,
              paddingHorizontal: 18,
              borderRadius: 20,
              backgroundColor: c.acSoft,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Icon name="spark" size={22} color={c.ac} />
            <View style={{ flex: 1 }}>
              <Text v="b2" weight="700">
                답장 전에 이 공고에 맞춰 볼까요?
              </Text>
              <Text v="c1" color="t2">
                AI가 적합도를 보고 이력서를 고쳐 드려요
              </Text>
            </View>
            <Icon name="chev" size={18} color={c.ac} />
          </Pressable>
        ) : null}

        {o.status === 'ACCEPTED' ? <Thread offer={o} meId={meId} /> : null}
      </ScrollView>

      {pending ? (
        <View
          style={{
            flexDirection: 'row',
            gap: 8,
            paddingTop: 14,
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 10,
            backgroundColor: c.bg,
            borderTopWidth: 1,
            borderTopColor: c.line,
          }}
        >
          <Button
            label="거절"
            variant="secondary"
            disabled={decline.isPending}
            style={{ minWidth: 92 }}
            onPress={() =>
              Alert.alert('이 제안을 거절할까요?', `${who.displayName} 님에게 거절했다고 알려요.`, [
                { text: '취소', style: 'cancel' },
                { text: '거절하기', style: 'destructive', onPress: () => decline.mutate() },
              ])
            }
          />
          <Button label="수락하고 답장하기" onPress={() => setReplying(true)} style={{ flex: 1 }} />
        </View>
      ) : null}

      <BottomSheet
        visible={replying}
        onClose={() => setReplying(false)}
        title="어떻게 답장할까요?"
        description="수락하면 내 연락처가 상대에게 보이고, 답장이 첫 메시지가 돼요."
        action={{
          label: accept.isPending ? '보내는 중' : '수락하고 보내기',
          onPress: () => accept.mutate(),
          disabled: !reply.trim() || accept.isPending,
        }}
      >
        <TextField
          accessibilityLabel="답장"
          multiline
          max={500}
          value={reply}
          onChangeText={setReply}
          placeholder={`${who.displayName} 님에게 답장을 써 주세요.`}
        />
      </BottomSheet>
    </KeyboardAvoidingView>
  )
}
