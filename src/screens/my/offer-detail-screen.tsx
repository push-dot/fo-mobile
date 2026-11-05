import { Redirect, router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { monthDay } from '@push/shared'
import {
  Avatar,
  clock,
  counterpart,
  OFFER_DECLINE,
  OfferPostingCard,
  offerBadge,
  personLine,
  useOffer,
  useOfferDecision,
} from '@/features/my'
import { Badge, BottomSheet, Button, Chip, Icon, Text, TextField, TopBar } from '@/shared/components'
import { useColors } from '@/theme'

type Box = 'received' | 'sent'

const OfferDetailScreen = ({ id, box = 'received' }: { id: string; box?: Box }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [replying, setReplying] = useState(false)
  const [reply, setReply] = useState('')
  const { data: o, isLoading } = useOffer(id)
  const { accept, decline } = useOfferDecision(id, reply, () => {
    setReplying(false)
    setReply('')
  })

  if (isLoading || !o) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar onBack={() => router.back()} />
        {isLoading ? <ActivityIndicator style={{ marginTop: 60 }} /> : null}
      </View>
    )
  }

  if (o.status === 'ACCEPTED') return <Redirect href={`/offers/${o.id}/messages?box=${box}`} />

  const who = counterpart(o, box)
  const badge = offerBadge(o, box)
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
            {personLine(who) ? (
              <Text v="c1" color="t3">
                {personLine(who)}
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

        {p ? <OfferPostingCard posting={p} /> : null}

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
                에이전트가 적합도를 보고 이력서를 고쳐 드려요
              </Text>
            </View>
            <Icon name="chev" size={18} color={c.ac} />
          </Pressable>
        ) : null}

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
                { text: OFFER_DECLINE, style: 'destructive', onPress: () => decline.mutate() },
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

export default OfferDetailScreen
