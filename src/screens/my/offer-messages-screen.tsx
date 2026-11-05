import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Avatar,
  clock,
  counterpart,
  dayBreaks,
  OFFER_FAIL_TITLE,
  OfferPostingCard,
  personLine,
  useOffer,
  useOfferMessages,
} from '@/features/my'
import { Glass, Icon, Text, TopBar } from '@/shared/components'
import { fontFor, useColors } from '@/theme'

type Box = 'received' | 'sent'
type Failed = { key: string; body: string }

const Bubble = ({ body, at, mine, faded }: { body: string; at?: string; mine: boolean; faded?: boolean }) => {
  const c = useColors()
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', gap: 4 }}>
      <View
        style={{
          maxWidth: '82%',
          borderRadius: 18,
          paddingVertical: 10,
          paddingHorizontal: 14,
          backgroundColor: mine ? c.ac : c.bg2,
          opacity: faded ? 0.5 : 1,
        }}
      >
        <Text v="b2" style={{ color: mine ? '#FFFFFF' : c.t1 }}>
          {body}
        </Text>
      </View>
      {at ? (
        <Text v="c2" color="t3">
          {clock(at)}
        </Text>
      ) : null}
    </View>
  )
}

const OfferMessagesScreen = ({ id, box }: { id: string; box: Box }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const [failed, setFailed] = useState<Failed[]>([])
  const { data: o } = useOffer(id)
  const { data, send } = useOfferMessages(id)

  if (!o) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar onBack={() => router.back()} />
        <ActivityIndicator style={{ marginTop: 60 }} />
      </View>
    )
  }

  const who = counterpart(o, box)
  const meId = box === 'received' ? o.recipient.id : o.sender.id
  const sub = personLine(who)
  const messages = (data?.data ?? []).map((m) => ({ id: m.id, senderId: m.sender.id, body: m.body, createdAt: m.createdAt }))
  const thread = dayBreaks(
    messages.length ? [{ id: o.id, senderId: o.sender.id, body: o.message, createdAt: o.createdAt }, ...messages] : [],
  )
  const post = (body: string) =>
    send.mutate(body, { onError: () => setFailed((f) => [...f, { key: `${Date.now()}`, body }]) })
  const canSend = !!text.trim()

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        onBack={() => router.back()}
        left={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${who.displayName} 허브 프로필 보기`}
            onPress={() => router.push(`/profiles/${who.id}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 6 }}
          >
            <Avatar name={who.displayName} url={who.avatarUrl} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text v="b1" weight="700" numberOfLines={1} accessibilityRole="header">
                {who.displayName}
              </Text>
              {sub ? (
                <Text v="c2" color="t3" numberOfLines={1}>
                  {sub}
                </Text>
              ) : null}
            </View>
          </Pressable>
        }
      />
      <ScrollView contentContainerStyle={{ gap: 12, paddingTop: 4, paddingHorizontal: 20, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
        {o.posting ? <OfferPostingCard posting={o.posting} /> : null}
        {thread.map((m) => (
          <View key={m.id} style={{ gap: 12 }}>
            {m.day ? (
              <Text v="c1" weight="600" color="t3" style={{ textAlign: 'center', paddingTop: 4 }}>
                {m.day}
              </Text>
            ) : null}
            <Bubble body={m.body} at={m.createdAt} mine={m.senderId === meId} />
          </View>
        ))}
        {data?.data.length === 0 && !send.isPending && failed.length === 0 ? (
          <Text v="b2" color="t3" style={{ textAlign: 'center', paddingTop: 8 }}>
            첫 메시지를 보내 대화를 시작해 보세요.
          </Text>
        ) : null}
        {send.isPending ? <Bubble body={send.variables ?? ''} mine faded /> : null}
        {failed.map((f) => (
          <View key={f.key} style={{ gap: 4 }}>
            <Bubble body={f.body} mine faded />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
              <Text v="c1" weight="700" color="red">
                !
              </Text>
              <Text v="c1" color="red">
                {OFFER_FAIL_TITLE}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="다시 보내기"
                hitSlop={10}
                onPress={() => {
                  setFailed((xs) => xs.filter((x) => x.key !== f.key))
                  post(f.body)
                }}
              >
                <Icon name="retry" size={16} color="t2" />
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: insets.bottom + 8 }}>
        <Glass style={{ borderRadius: 26, flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 16, paddingRight: 6, paddingVertical: 6, gap: 8 }}>
          <TextInput
            accessibilityLabel="메시지"
            value={text}
            onChangeText={setText}
            placeholder="메시지를 입력해 주세요"
            placeholderTextColor={c.t4}
            multiline
            style={[{ flex: 1, minHeight: 40, maxHeight: 120, paddingTop: 10, paddingBottom: 10, fontSize: 16, color: c.t1 }, fontFor('400')]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="보내기"
            accessibilityState={{ disabled: !canSend }}
            disabled={!canSend}
            onPress={() => {
              post(text.trim())
              setText('')
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: canSend ? c.ac : c.fill2,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon name="up" size={20} color={canSend ? '#FFFFFF' : c.t4} />
          </Pressable>
        </Glass>
      </View>
    </KeyboardAvoidingView>
  )
}

export default OfferMessagesScreen
