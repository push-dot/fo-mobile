import { router } from 'expo-router'
import { LegendList } from '@legendapp/list/react-native'
import { useState } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import {
  Avatar,
  clock,
  composerClosed,
  counterpart,
  dayBreaks,
  failedLine,
  failedSend,
  OFFER_BLOCKED_COMPOSER,
  OFFER_MENU_COPY,
  personLine,
  postingSentLine,
  RETRY_LABEL,
  useOffer,
  useOfferMenu,
  useViewerBox,
  useOfferMessages,
  type FailedSend,
} from '@/features/my'
import { Composer } from '@/features/chat'
import { emptyNoteStyle, Icon, Skeleton, StatusNote, Text, NativeTopBar, useKeyboardHeight } from '@/shared/components'
import { composerPadding } from '@/shared/utility'
import { onAccent, spacing } from '@/theme'

type Box = 'received' | 'sent'

const Bubble = ({
  body,
  at,
  mine,
  faded,
  onPress,
  posting,
}: {
  body: string
  at?: string
  mine: boolean
  faded?: boolean
  onPress?: () => void
  posting?: { title: string; company: string; onPress: () => void }
}) => {
  return (
    <View style={[styles.bubbleWrap, mine && styles.bubbleWrapMine]}>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        disabled={!onPress}
        onPress={onPress}
        style={[styles.bubble, mine && styles.bubbleMine, faded && styles.faded]}
      >
        <Text v="b2" style={[styles.bubbleText, mine && styles.bubbleTextMine]}>
          {body}
        </Text>
        {posting ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`함께 보낸 공고 ${posting.company} ${posting.title}`}
            onPress={posting.onPress}
            style={styles.posting}
          >
            <View style={styles.postingText}>
              <Text v="b2" weight="700" numberOfLines={1}>
                {posting.title}
              </Text>
              <Text v="c1" color="t3" numberOfLines={1}>
                {posting.company}
              </Text>
            </View>
            <Icon name="chev" size={16} color="t3" />
            <View pointerEvents="none" style={styles.postingRing} />
          </Pressable>
        ) : null}
      </Pressable>
      {at ? (
        <Text v="c2" color="t3">
          {clock(at)}
        </Text>
      ) : null}
    </View>
  )
}

const EMPTY_LIFT = 120
const COMPOSER_HEIGHT = 52
const COMPOSER_RADIUS = COMPOSER_HEIGHT / 2
const SCROLL_PAD_BOTTOM = spacing[5]
const DAY_LABEL_LIFT = 2

type Item =
  | { kind: 'msg'; key: string; m: { id: string; senderId: string; body: string; createdAt: string; day: string | null }; first: boolean }
  | { kind: 'posted'; key: string }
  | { kind: 'empty'; key: 'empty' }
  | { kind: 'pending'; key: 'pending'; body: string }
  | { kind: 'failed'; key: string; f: FailedSend }

const Gap = () => <View style={styles.gap} />

const DayLabel = ({ day }: { day: string | null }) =>
  day ? (
    <Text v="c2" weight="600" color="t3" style={styles.dayLabel}>
      {day}
    </Text>
  ) : null

const OfferMessagesScreen = ({ id, box: hint }: { id: string; box: Box }) => {
  const insets = useSafeAreaInsets()
  const keyboardUp = useKeyboardHeight() > 0
  const [text, setText] = useState('')
  const [composerH, setComposerH] = useState(0)
  const [failed, setFailed] = useState<FailedSend[]>([])
  const { data: o, isError, refetch } = useOffer(id)
  const box = useViewerBox(o, hint)
  const menu = useOfferMenu(o, box)
  const { data, send } = useOfferMessages(id)

  if (!o) {
    return (
      <View style={styles.screen}>
        <NativeTopBar onBack={() => router.back()} />
        {isError ? (
          <StatusNote
            lines={[OFFER_MENU_COPY.failed]}
            action={{ label: RETRY_LABEL, onPress: () => void refetch() }}
            style={emptyNoteStyle(140)}
          />
        ) : (
          <View style={styles.loading}>
            <Skeleton width="100%" height={64} />
            <Skeleton width="60%" height={44} />
          </View>
        )}
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
  const posted = o.posting ? (
    <Bubble
      body={postingSentLine(o.sender.displayName)}
      mine={o.sender.id === meId}
      posting={{ title: o.posting.title, company: o.posting.company, onPress: () => router.push(`/postings/${o.posting!.id}`) }}
    />
  ) : null
  const post = (body: string) =>
    send.mutate(body, {
      onError: (e) => setFailed((f) => [...f, failedSend(body, e)]),
    })
  const empty = data?.data.length === 0 && !send.isPending && failed.length === 0
  const closed = composerClosed(failed, o.canSend)
  const items: Item[] = [
    ...thread.map((m, i): Item => ({ kind: 'msg', key: m.id, m, first: i === 0 })),
    ...(thread.length === 0 && posted ? ([{ kind: 'posted', key: 'posted' }] satisfies Item[]) : []),
    ...(empty ? ([{ kind: 'empty', key: 'empty' }] satisfies Item[]) : []),
    ...(send.isPending ? ([{ kind: 'pending', key: 'pending', body: send.variables ?? '' }] satisfies Item[]) : []),
    ...failed.map((f): Item => ({ kind: 'failed', key: f.key, f })),
  ]
  const renderItem = ({ item }: { item: Item }) => {
    switch (item.kind) {
      case 'msg':
        return (
          <View style={styles.stack}>
            <DayLabel day={item.m.day} />
            {item.first ? posted : null}
            <Bubble body={item.m.body} at={item.m.createdAt} mine={item.m.senderId === meId} />
          </View>
        )
      case 'posted':
        return (
          <View style={styles.stack}>
            <DayLabel day={dayBreaks([{ createdAt: o.createdAt }])[0]!.day} />
            {posted}
          </View>
        )
      case 'empty':
        return (
          <View style={styles.empty(composerH)}>
            <Text v="b2" color="t3" style={styles.center}>
              첫 메시지를 보내 대화를 시작해 보세요.
            </Text>
          </View>
        )
      case 'pending':
        return <Bubble body={item.body} mine faded />
      case 'failed': {
        const f = item.f
        return (
          <View style={styles.failed}>
            <Bubble body={f.body} mine faded />
            <View style={styles.failedRow}>
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
        )
      }
    }
  }

  return (
    <KeyboardAvoidingView behavior="padding" style={styles.screen}>
      <NativeTopBar
        onBack={() => router.back()}
        titleView={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${who.displayName} 허브 프로필 보기`}
            onPress={() => router.push(`/profiles/${who.id}`)}
            style={styles.who}
          >
            <Avatar name={who.displayName} url={who.avatarUrl} size={36} />
            <View style={styles.whoText}>
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
        actions={menu ? [{ icon: 'more', label: '더 보기', menu }] : undefined}
      />
      <LegendList
        data={items}
        keyExtractor={(it) => it.key}
        getItemType={(it) => it.kind}
        renderItem={renderItem}
        extraData={composerH}
        ItemSeparatorComponent={Gap}
        estimatedItemSize={64}
        alignItemsAtEnd
        initialScrollAtEnd
        maintainScrollAtEnd
        maintainVisibleContentPosition
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
      />
      <View
        onLayout={(e) => setComposerH(e.nativeEvent.layout.height)}
        style={styles.composer(insets.bottom, keyboardUp)}
      >
        {closed ? (
          <View
            accessibilityRole="alert"
            style={styles.closed}
          >
            <Text v="c1" color="t2" style={styles.center}>
              {OFFER_BLOCKED_COMPOSER}
            </Text>
          </View>
        ) : (
          <Composer
            tools={false}
            value={text}
            onChangeText={setText}
            placeholder="메시지를 입력해 주세요"
            sending={send.isPending}
            onSend={() => {
              post(text.trim())
              setText('')
            }}
          />
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  loading: { gap: theme.spacing[4], padding: theme.spacing[5] },
  bubbleWrap: { alignItems: 'flex-start', gap: theme.spacing[1] },
  bubbleWrapMine: { alignItems: 'flex-end' },
  bubble: {
    maxWidth: '82%',
    borderRadius: theme.radius.md,
    borderBottomLeftRadius: theme.radius.xs,
    borderBottomRightRadius: theme.radius.md,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[4],
    backgroundColor: theme.colors.bg2,
    opacity: 1,
  },
  bubbleMine: { borderBottomLeftRadius: theme.radius.md, borderBottomRightRadius: theme.radius.xs, backgroundColor: theme.colors.ac },
  faded: { opacity: 0.55 },
  bubbleText: { color: theme.colors.t1 },
  bubbleTextMine: { color: onAccent },
  posting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10,
    paddingVertical: theme.spacing[3],
    paddingHorizontal: 14,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.bg,
  },
  postingText: { flexShrink: 1, minWidth: 0 },
  postingRing: { ...StyleSheet.absoluteFillObject, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.line },
  gap: { height: theme.spacing[4] },
  dayLabel: { textAlign: 'center', paddingTop: DAY_LABEL_LIFT },
  stack: { gap: theme.spacing[4] },
  empty: (composerH: number) => ({ paddingVertical: Math.max(EMPTY_LIFT - composerH - SCROLL_PAD_BOTTOM, 0) + 80 }),
  center: { textAlign: 'center' },
  failed: { gap: theme.spacing[1] },
  failedRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: theme.spacing[2] },
  who: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingLeft: theme.spacing[1] },
  whoText: { flex: 1, minWidth: 0 },
  list: { flexGrow: 1, paddingTop: theme.spacing[1], paddingHorizontal: theme.spacing[5], paddingBottom: SCROLL_PAD_BOTTOM },
  composer: (bottom: number, keyboardUp: boolean) => ({
    ...composerPadding(Platform.OS === 'ios', bottom, keyboardUp),
    backgroundColor: Platform.OS === 'ios' ? undefined : theme.colors.bg,
  }),
  closed: {
    minHeight: COMPOSER_HEIGHT,
    borderRadius: COMPOSER_RADIUS,
    paddingHorizontal: theme.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.fill,
  },
}))

export default OfferMessagesScreen
