import { router } from 'expo-router'
import { useRef, useState, type ComponentRef } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  Avatar,
  clock,
  composerClosed,
  counterpart,
  dayBreaks,
  failedLine,
  failedSend,
  OFFER_BLOCKED_COMPOSER,
  OfferPostingCard,
  personLine,
  useOffer,
  useOfferMenu,
  useViewerBox,
  useOfferMessages,
  type FailedSend,
} from '@/features/my'
import { Glass, GlassButton, Icon, Skeleton, Text, TopBar } from '@/shared/components'
import { inputReset } from '@/shared/components/text-field-metrics'
import { fontFor, onAccent, radius, spacing, type, useColors } from '@/theme'

type Box = 'received' | 'sent'

const Bubble = ({
  body,
  at,
  mine,
  faded,
}: {
  body: string
  at?: string
  mine: boolean
  faded?: boolean
}) => {
  const c = useColors()
  return (
    <View style={{ alignItems: mine ? 'flex-end' : 'flex-start', gap: spacing[1] }}>
      <View
        style={{
          maxWidth: '82%',
          borderRadius: radius.md,
          borderBottomLeftRadius: mine ? radius.md : radius.xs,
          borderBottomRightRadius: mine ? radius.xs : radius.md,
          paddingVertical: spacing[3],
          paddingHorizontal: spacing[4],
          backgroundColor: mine ? c.ac : c.bg2,
          opacity: faded ? 0.55 : 1,
        }}
      >
        <Text v="b2" style={{ color: mine ? onAccent : c.t1 }}>
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

// The board centres the empty line over the whole screen (composer overlaid) with a 120pt lift; here the composer takes its own height.
const EMPTY_LIFT = 120
const COMPOSER_HEIGHT = 52
const COMPOSER_RADIUS = COMPOSER_HEIGHT / 2

const OfferMessagesScreen = ({ id, box: hint }: { id: string; box: Box }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [text, setText] = useState('')
  const [composerH, setComposerH] = useState(0)
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null)
  const [failed, setFailed] = useState<FailedSend[]>([])
  const { data: o } = useOffer(id)
  const box = useViewerBox(o, hint)
  const menu = useOfferMenu(o, box)
  const { data, send } = useOfferMessages(id)

  if (!o) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar onBack={() => router.back()} />
        <View style={{ gap: spacing[4], padding: spacing[5] }}>
          <Skeleton width="100%" height={64} />
          <Skeleton width="60%" height={44} />
        </View>
      </View>
    )
  }

  const who = counterpart(o, box)
  const meId = box === 'received' ? o.recipient.id : o.sender.id
  const sub = personLine(who)
  const messages = (data?.data ?? []).map((m) => ({
    id: m.id,
    senderId: m.sender.id,
    body: m.body,
    createdAt: m.createdAt,
  }))
  const thread = dayBreaks(
    messages.length
      ? [{ id: o.id, senderId: o.sender.id, body: o.message, createdAt: o.createdAt }, ...messages]
      : [],
  )
  const post = (body: string) =>
    send.mutate(body, {
      onError: (e) => setFailed((f) => [...f, failedSend(body, e)]),
    })
  const canSend = !!text.trim()
  const ios = Platform.OS === 'ios'
  const Composer = ios ? Glass : View
  const empty = data?.data.length === 0 && !send.isPending && failed.length === 0
  const closed = composerClosed(failed, o.canSend)

  return (
    <KeyboardAvoidingView behavior="padding" style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar
        onBack={() => router.back()}
        left={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${who.displayName} 허브 프로필 보기`}
            onPress={() => router.push(`/profiles/${who.id}`)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[3],
              paddingLeft: spacing[1],
            }}
          >
            <Avatar name={who.displayName} url={who.avatarUrl} size={36} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text v="b2" weight="700" numberOfLines={1} accessibilityRole="header">
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
        right={
          menu ? <GlassButton actions={[{ icon: 'menu', label: '더 보기', menu }]} /> : undefined
        }
      />
      <ScrollView
        ref={scroll}
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
        contentContainerStyle={{
          flexGrow: 1,
          gap: spacing[4],
          paddingTop: spacing[1],
          paddingHorizontal: spacing[5],
          paddingBottom: spacing[5],
        }}
        keyboardShouldPersistTaps="handled"
      >
        {o.posting ? <OfferPostingCard posting={o.posting} compact /> : null}
        {thread.map((m) => (
          <View key={m.id} style={{ gap: spacing[4] }}>
            {m.day ? (
              <Text
                v="c2"
                weight="600"
                color="t3"
                style={{ textAlign: 'center', paddingTop: spacing[1] }}
              >
                {m.day}
              </Text>
            ) : null}
            <Bubble body={m.body} at={m.createdAt} mine={m.senderId === meId} />
          </View>
        ))}
        {empty ? (
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              paddingBottom: Math.max(EMPTY_LIFT - composerH, 0),
            }}
          >
            <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
              첫 메시지를 보내 대화를 시작해 보세요.
            </Text>
          </View>
        ) : null}
        {send.isPending ? <Bubble body={send.variables ?? ''} mine faded /> : null}
        {failed.map((f) => (
          <View key={f.key} style={{ gap: spacing[1] }}>
            <Bubble body={f.body} mine faded />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: spacing[2],
              }}
            >
              <Text v="c2" weight="700" color="red">
                !
              </Text>
              <Text v="c2" color="red">
                {failedLine(f).title}
              </Text>
              {failedLine(f).retry ? (
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
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
      <View
        onLayout={(e) => setComposerH(e.nativeEvent.layout.height)}
        style={{
          paddingHorizontal: ios ? spacing[4] : spacing[3],
          paddingTop: ios ? 6 : spacing[2],
          paddingBottom: ios ? Math.max(insets.bottom - 6, spacing[2]) : insets.bottom + spacing[2],
          backgroundColor: ios ? undefined : c.bg,
        }}
      >
        {closed ? (
          <View
            accessibilityRole="alert"
            style={{
              minHeight: COMPOSER_HEIGHT,
              borderRadius: COMPOSER_RADIUS,
              paddingHorizontal: spacing[4],
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.fill,
            }}
          >
            <Text v="c1" color="t2" style={{ textAlign: 'center' }}>
              {OFFER_BLOCKED_COMPOSER}
            </Text>
          </View>
        ) : (
          <Composer
            style={{
              borderRadius: COMPOSER_RADIUS,
              flexDirection: 'row',
              alignItems: 'flex-end',
              padding: 6,
              gap: spacing[2],
              backgroundColor: ios ? undefined : c.fill,
            }}
          >
            <TextInput
              accessibilityLabel="메시지"
              value={text}
              onChangeText={setText}
              placeholder="메시지를 입력해 주세요"
              placeholderTextColor={c.t4}
              multiline
              style={[
                {
                  flex: 1,
                  ...inputReset,
                  minHeight: 40,
                  maxHeight: 120,
                  paddingVertical: spacing[2],
                  paddingHorizontal: spacing[1],
                  fontSize: type.b1.fontSize,
                  lineHeight: type.b1.lineHeight,
                  color: c.t1,
                  textAlignVertical: 'center',
                },
                fontFor('400'),
              ]}
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
                borderRadius: radius.pill,
                backgroundColor: canSend ? c.ac : ios ? c.fill : c.fill2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="up" size={20} color={canSend ? onAccent : c.t3} />
            </Pressable>
          </Composer>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

export default OfferMessagesScreen
