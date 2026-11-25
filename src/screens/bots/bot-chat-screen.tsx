import { router, useLocalSearchParams } from 'expo-router'
import { LegendList, type LegendListRef } from '@legendapp/list/react-native'
import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, View, type NativeScrollEvent, type NativeSyntheticEvent, type TextInputInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { usePersonalPurchase } from '@/features/billing'
import { accountPath, materialPickerPath, useBot, useBotProfile, type BotId } from '@/features/bots'
import {
  AWAITING_TEXT,
  AwaitingRow,
  ChatBotColor,
  ComposerArea,
  ConsentSheet,
  CreditBanner,
  FindBar,
  FindHighlight,
  HeaderPill,
  NewMessagesPill,
  Onboarding,
  Queued,
  QuickStartRow,
  composerPlaceholder,
  turnFailed,
  followScroll,
  hasOlder,
  shownItems,
  headerLightOf,
  openBot,
  BUBBLE_GAP,
  threadBottomGap,
  threadRows,
  type ThreadRow,
  threadGreeting,
  quickStartPath,
  instantRun,
  send,
  stop,
  useDraftStore,
  useSurfaceActions,
  useChatWaiting,
  useChatAwaiting,
  useChatItems,
  useChatLimit,
  useChatQueue,
  useRunPhase,
  ThreadCell,
  loadOlder,
  RowMotion,
  useFind,
  useReadWhileOpen,
  useUnseen,
  type ChatItem,
} from '@/features/chat'
import { useReferenceConsent } from '@/features/my'
import { Button, Text, useKeyboardHeight, useReduceMotion } from '@/shared/components'
import { XlBoardChrome } from '@/shared/components/xl-chrome'

const COMPOSER_BOTTOM = 6
const AT_BOTTOM = 40
const OPEN_REST_MS = 800

const Gap = () => <View style={styles.gap} />

const addressOf = (botId: string | string[] | undefined) => (Array.isArray(botId) ? (botId[0] ?? '') : (botId ?? ''))

const BotChatScreen = () => {
  const raw = useLocalSearchParams<{ botId: string }>().botId
  const address = addressOf(raw)
  const [tryN, setTryN] = useState(0)

  return (
    <View style={styles.screen}>
      <Opened key={`${address}:${tryN}`} address={address} onRetry={() => setTryN((n) => n + 1)} />
    </View>
  )
}

const useLeading = () => {
  const redirected = !!useLocalSearchParams<{ instant?: string }>().instant
  const consented = useReferenceConsent().data?.referenceData === true
  return redirected ? (consented ? 'botHome' : 'none') : 'back'
}

const Opened = ({ address, onRetry }: { address: string; onRetry: () => void }) => {
  const leading = useLeading()
  const [id, setId] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!address) return
    let live = true
    void openBot(address).then(
      (resolved) => {
        if (live) setId(resolved)
      },
      () => {
        if (live) setFailed(true)
      },
    )
    return () => {
      live = false
    }
  }, [address])

  if (id) return <Thread id={id} />
  return (
    <View style={styles.flex}>
      <HeaderPill leading={leading} />
      {failed ? (
        <View style={styles.failed}>
          <Text v="c1" color="t2" style={styles.flex}>
            대화를 불러오지 못했어요
          </Text>
          <Button label="다시 불러오기" size="sm" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  )
}

const Thread = ({ id }: { id: string }) => {
  const leading = useLeading()
  const bot = useBot(id as BotId)
  const profile = useBotProfile(id as BotId)
  const items = useChatItems(id)
  const queue = useChatQueue(id)
  const waiting = useChatWaiting(id)
  const awaiting = useChatAwaiting(id)
  const phase = useRunPhase(id)
  const working = phase !== 'idle'
  const name = bot.data?.name
  const kind = bot.data?.kind
  const color = bot.data?.kind === 'company' ? bot.data.color : 'push'
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const purchase = usePersonalPurchase()
  const input = useRef<TextInputInstance>(null)
  const chipKind = useDraftStore((s) => s.byBot[id]?.chipKind)
  const typing = useDraftStore((s) => !!s.byBot[id]?.text)
  const placeholder = composerPlaceholder(name, chipKind, Platform.OS === 'android' && phase === 'working')
  const empty = items.length === 0 && queue.length === 0
  const greetingTitle = profile.data?.posting?.title
  const showGreeting = !empty && !hasOlder(id) && kind === 'company' && !!name
  const greeting: ChatItem[] = showGreeting && name ? [{ type: 'agentText', id: 'greeting', text: threadGreeting(name, greetingTitle) }] : []
  const data: ThreadRow[] = [...greeting, ...threadRows(shownItems(id, items), working)]
  const lastId = data.findLast((row) => row.type !== 'running')?.id

  const find = useFind(id)
  const limit = useChatLimit(items)
  const [headerH, setHeaderH] = useState(0)
  const [atBottom, setAtBottom] = useState(true)
  const [live, setLive] = useState(false)
  useEffect(() => {
    const timer = setTimeout(() => setLive(true), OPEN_REST_MS)
    return () => clearTimeout(timer)
  }, [])
  const unseen = useUnseen(items, atBottom)
  useReadWhileOpen(bot.data, atBottom)
  const reduceMotion = useReduceMotion()
  const failed = turnFailed(items)
  const light = headerLightOf({ creditsOut: limit.out, unseenBotMessages: unseen, failed, attention: !!waiting })
  const list = useRef<LegendListRef>(null)
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  })
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
    setAtBottom(contentOffset.y + layoutMeasurement.height >= contentSize.height - AT_BOTTOM)
  }
  const onStartReached = () => {
    void loadOlder(id).catch(() => undefined)
  }
  const toBottom = () => void list.current?.scrollToEnd({ animated: !reduceMotion })
  const currentId = find.currentId
  useEffect(() => {
    if (!currentId) return
    const at = dataRef.current.findIndex((i) => i.id === currentId)
    if (at >= 0) void list.current?.scrollToIndex({ index: at, viewPosition: 0.5, animated: true })
  }, [currentId])

  const buyCredits = useRef(purchase.buyCredits)
  useEffect(() => {
    buyCredits.current = purchase.buyCredits
  }, [purchase.buyCredits])
  const onUsage = (action: 'plan' | 'credits') => {
    if (action === 'plan') router.push(accountPath('plan'))
    else buyCredits.current()
  }
  const onReadOff = (action: 'attach' | 'settings') => router.push(action === 'attach' ? materialPickerPath(id as BotId) : '/settings')
  const onLocal = useSurfaceActions(id, () => setTimeout(() => input.current?.focus(), 50))
  const renderItem = ({ item }: { item: ThreadRow }) => {
    const last = item.id === lastId
    return (
      <ThreadCell chatId={id} row={item} color={color} live={live} last={last} onLocal={onLocal} onReadOff={onReadOff} />
    )
  }
  const onboardingMotion = { key: `${id}/onboarding`, live }
  const maintainScrollAtEnd = { animated: followScroll(true, working, reduceMotion) === 'animated' }
  const listHeader = <View style={styles.height(headerH)} />
  const listFooter = queue.length ? (
    <View style={styles.queue}>
      {queue.map((item, i) => (
        <Queued key={`${i}-${item.text}`} text={item.text} />
      ))}
    </View>
  ) : null

  return (
    <View style={styles.flex}>
      <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)} style={styles.header}>
        {find.open ? (
          <FindBar query={find.query} label={find.label} onQuery={find.setQuery} onStep={find.step} onClose={find.close} />
        ) : (
          <HeaderPill botId={id} name={name} kind={kind} color={color} light={light} leading={leading} onFind={find.show} />
        )}
      </View>
      <KeyboardAvoidingView behavior="padding" style={styles.flex}>
      {empty && kind && name ? (
        <RowMotion.Provider value={onboardingMotion}>
          <Onboarding kind={kind} name={name} postingTitle={profile.data?.posting?.title} top={headerH} />
        </RowMotion.Provider>
      ) : (
      <View style={styles.flex}>
      <ChatBotColor.Provider value={color}>
      <FindHighlight.Provider value={find.highlight}>
      <LegendList
        ref={list}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={`${working}|${lastId}|${live}|${color}`}
        getItemType={(item) => item.type}
        estimatedItemSize={72}
        recycleItems={false}
        initialScrollAtEnd
        maintainScrollAtEnd={maintainScrollAtEnd}
        maintainVisibleContentPosition
        onStartReached={onStartReached}
        onStartReachedThreshold={1}
        onScroll={onScroll}
        scrollEventThrottle={100}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.thread(threadBottomGap(keyboard))}
        ItemSeparatorComponent={Gap}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
      />
      </FindHighlight.Provider>
      </ChatBotColor.Provider>
      {unseen > 0 && followScroll(atBottom, working, reduceMotion) === 'fresh' ? <NewMessagesPill count={unseen} onPress={toBottom} /> : null}
      </View>
      )}
      {limit.banner ? <CreditBanner banner={limit.banner} onAction={onUsage} /> : null}
      <View style={styles.composer(keyboard ? null : insets.bottom + COMPOSER_BOTTOM)}>
        <ComposerArea
          botId={id}
          inputRef={input}
          placeholder={placeholder}
          working={phase === 'working'}
          disabled={!!limit.banner}
          onStop={() => stop(id)}
          onSend={(text, attachment) => send(id, text, attachment)}
          above={
            awaiting ? (
              <AwaitingRow text={AWAITING_TEXT[awaiting]} color={color} />
            ) : empty && kind && !typing ? (
              <QuickStartRow
                kind={kind}
                onChip={(key) => {
                  const run = instantRun(key)
                  if (run) send(id, run.message, undefined, run.intent)
                  else router.push(quickStartPath(key))
                }}
              />
            ) : null
          }
        />
      </View>
      <ConsentSheet kind={kind} />
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  gap: { height: BUBBLE_GAP },
  failed: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], padding: theme.spacing[5] },
  height: (height: number) => ({ height }),
  queue: { gap: BUBBLE_GAP, paddingTop: BUBBLE_GAP },
  header: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 },
  thread: (paddingBottom: number) => ({ paddingHorizontal: theme.spacing[5], paddingTop: theme.spacing[4], paddingBottom }),
  composer: (paddingBottom: number | null) => ({ paddingHorizontal: theme.spacing[3], paddingBottom: paddingBottom ?? theme.spacing[2] }),
}))

const BotChatScreenWithXlChrome = () => (
  <XlBoardChrome>
    <BotChatScreen />
  </XlBoardChrome>
)

export default BotChatScreenWithXlChrome
