import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, View, type NativeScrollEvent, type NativeSyntheticEvent, type TextInputInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePersonalPurchase } from '@/features/billing'
import { accountPath, materialPickerPath as botMaterialPath, useBot, useBotProfile, type BotId } from '@/features/bots'
import {
  AWAITING_TEXT,
  ApprovalPanel,
  AwaitingRow,
  ChatBotColor,
  ComposerArea,
  ConsentSheet,
  CreditBanner,
  FindBar,
  FindHighlight,
  HeaderPill,
  Item,
  NewMessagesPill,
  Onboarding,
  Queued,
  QuickStartRow,
  StatusRow,
  THREAD_BATCH,
  THREAD_INITIAL_RENDER,
  THREAD_WINDOW,
  answer,
  applyText,
  closeApproval,
  composerPlaceholder,
  endsInError,
  followScroll,
  headerLightOf,
  openBot,
  threadRows,
  type ThreadRow,
  threadGreeting,
  retryApproval,
  quickStartPath,
  send,
  stop,
  useCardState,
  useDoneNext,
  useChat,
  useChatLimit,
  useDraftStore,
  useFind,
  useUnseen,
  WaitingLine,
  type ChatItem,
} from '@/features/chat'
import { useConvertDocument } from '@/features/my'
import { Button, Text, useKeyboardHeight, useReduceMotion } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const COMPOSER_BOTTOM = 6
// An inverted list sits at the bottom while its offset is near zero.
const AT_BOTTOM = 40

const addressOf = (botId: string | string[] | undefined) => (Array.isArray(botId) ? (botId[0] ?? '') : (botId ?? ''))

const BotChatScreen = () => {
  const raw = useLocalSearchParams<{ botId: string }>().botId
  const address = addressOf(raw)
  const c = useColors()
  const [tryN, setTryN] = useState(0)

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Opened key={`${address}:${tryN}`} address={address} onRetry={() => setTryN((n) => n + 1)} />
    </View>
  )
}

const Opened = ({ address, onRetry }: { address: string; onRetry: () => void }) => {
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
    <View style={{ flex: 1 }}>
      <HeaderPill />
      {failed ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], padding: spacing[5] }}>
          <Text v="c1" color="t2" style={{ flex: 1 }}>
            대화를 불러오지 못했어요
          </Text>
          <Button label="다시 불러오기" size="sm" variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </View>
  )
}

const Thread = ({ id }: { id: string }) => {
  const bot = useBot(id as BotId)
  const profile = useBotProfile(id as BotId)
  const chat = useChat(id)
  const name = bot.data?.name
  const kind = bot.data?.kind
  const color = bot.data?.kind === 'company' ? bot.data.color : 'push'
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const purchase = usePersonalPurchase()
  const convert = useConvertDocument((documentId) => {
    router.push(`/docs/push/${documentId}`)
  })
  const [sayingFor, setSayingFor] = useState<string>()
  const input = useRef<TextInputInstance>(null)
  const saying = !!chat.approval && sayingFor === chat.approval.id
  const showPanel = chat.approval && !saying
  const cardIs = useCardState(chat.approval)
  const chipKind = useDraftStore((s) => s.byBot[id]?.chipKind)
  const placeholder = composerPlaceholder(chat, name, chipKind)
  const empty = chat.items.length === 0 && chat.queue.length === 0
  const greeting: ChatItem[] =
    !empty && kind === 'company' && name ? [{ type: 'agentText', id: 'greeting', text: threadGreeting(name, profile.data?.posting?.title) }] : []
  const rows = threadRows(chat.items, !!chat.working)
  const running = rows.some((r) => r.type === 'running')
  const data: ThreadRow[] = [...rows].reverse().concat(greeting)

  const find = useFind(id)
  const limit = useChatLimit(chat.items)
  const [headerH, setHeaderH] = useState(0)
  const [atBottom, setAtBottom] = useState(true)
  const unseen = useUnseen(chat.items, atBottom)
  const reduceMotion = useReduceMotion()
  const light = headerLightOf({ creditsOut: limit.out, unseenBotMessages: unseen, failed: endsInError(chat.items) })
  const list = useRef<FlatList<ThreadRow>>(null)
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  })
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => setAtBottom(e.nativeEvent.contentOffset.y < AT_BOTTOM), [])
  const toBottom = () => list.current?.scrollToOffset({ offset: 0, animated: !reduceMotion })
  const currentId = find.currentId
  useEffect(() => {
    if (!currentId) return
    const at = dataRef.current.findIndex((i) => i.id === currentId)
    if (at >= 0) list.current?.scrollToIndex({ index: at, viewPosition: 0.5, animated: true })
  }, [currentId])

  const convertRef = useRef(convert.mutate)
  const buyCredits = useRef(purchase.buyCredits)
  useEffect(() => {
    convertRef.current = convert.mutate
    buyCredits.current = purchase.buyCredits
  }, [convert.mutate, purchase.buyCredits])
  const onView = useCallback((card: Extract<ChatItem, { type: 'result' }>) => {
    router.push(`/docs/push/${card.documentId}`)
  }, [])
  const onReadOff = useCallback(
    (action: 'attach' | 'settings') => router.push(action === 'attach' ? botMaterialPath(id as BotId) : '/settings'),
    [id],
  )
  const onUsage = useCallback((action: 'plan' | 'credits') => {
    if (action === 'plan') router.push(accountPath('plan'))
    else buyCredits.current()
  }, [])
  useDoneNext(chat, (action, card) => {
    if (action.id === 'apply') send(id, applyText(card.company))
    else if (action.id === 'convert' && !convert.isPending) convertRef.current(card.documentId)
  })
  const working = chat.working
  const renderItem = useCallback(
    ({ item }: { item: ThreadRow }) =>
      item.type === 'running' ? (
        working ? <StatusRow verbs={working.verbs} startedAt={working.startedAt} onStop={() => stop(id)} color={color} /> : null
      ) : (
        <Item item={item} onView={onView} onUsage={onUsage} onReadOff={onReadOff} />
      ),
    [onView, onUsage, onReadOff, working, id, color],
  )

  return (
    <View style={{ flex: 1 }}>
      <View onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)} style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 3 }}>
        {find.open ? (
          <FindBar query={find.query} label={find.label} onQuery={find.setQuery} onStep={find.step} onClose={find.close} />
        ) : (
          <HeaderPill botId={id} name={name} kind={kind} color={color} light={light} onFind={find.show} />
        )}
      </View>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {empty && kind && name ? (
        <Onboarding kind={kind} name={name} postingTitle={profile.data?.posting?.title} top={headerH} />
      ) : (
      <View style={{ flex: 1 }}>
      <ChatBotColor.Provider value={color}>
      <FindHighlight.Provider value={find.highlight}>
      <FlatList
        ref={list}
        inverted
        onScroll={onScroll}
        scrollEventThrottle={100}
        onScrollToIndexFailed={({ index, averageItemLength }) => {
          list.current?.scrollToOffset({ offset: index * averageItemLength, animated: false })
          setTimeout(() => list.current?.scrollToIndex({ index, viewPosition: 0.5, animated: true }), 100)
        }}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        initialNumToRender={THREAD_INITIAL_RENDER}
        maxToRenderPerBatch={THREAD_BATCH}
        windowSize={THREAD_WINDOW}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        // The list is inverted: flex-end is its visual top, so a short thread stacks under the header as the boards draw it.
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', gap: 18, paddingHorizontal: spacing[5], paddingVertical: spacing[4] }}
        ListFooterComponent={<View style={{ height: headerH }} />}
        ListHeaderComponent={
          chat.queue.length || showPanel ? (
            <View style={{ gap: 18 }}>
              {showPanel ? <WaitingLine approval={chat.approval!} color={color} /> : null}
              {chat.queue.map((item, i) => (
                <Queued key={`${i}-${item.text}`} text={item.text} />
              ))}
            </View>
          ) : undefined
        }
      />
      </FindHighlight.Provider>
      </ChatBotColor.Provider>
      {unseen > 0 && followScroll(atBottom, !!chat.working, reduceMotion) === 'fresh' ? <NewMessagesPill count={unseen} onPress={toBottom} /> : null}
      </View>
      )}
      {showPanel ? (
        <ApprovalPanel
          key={chat.approval!.id}
          approval={chat.approval!}
          expired={cardIs === 'expired'}
          onClose={() => closeApproval(id)}
          onRetry={() => retryApproval(id)}
          onAnswer={(text, choice) => answer(id, text, choice)}
          onSay={() => (setSayingFor(chat.approval?.id), setTimeout(() => input.current?.focus(), 50))}
          onMaterials={() => (setSayingFor(chat.approval?.id), router.push(botMaterialPath(id as BotId)))}
        />
      ) : (
        <>
        {limit.banner ? <CreditBanner banner={limit.banner} onAction={onUsage} /> : null}
        <View style={{ paddingHorizontal: spacing[3], paddingBottom: keyboard ? spacing[2] : insets.bottom + COMPOSER_BOTTOM }}>
          <ComposerArea
            botId={id}
            inputRef={input}
            placeholder={saying ? '어떻게 할지 말해 주세요' : placeholder}
            working={!!chat.working}
            disabled={!!limit.banner}
            onStop={() => stop(id)}
            onSend={(text, attachment) => send(id, text, attachment)}
            above={
              chat.working && !running ? (
                <StatusRow verbs={chat.working.verbs} startedAt={chat.working.startedAt} onStop={() => stop(id)} color={color} />
              ) : chat.awaiting ? (
                <AwaitingRow text={AWAITING_TEXT[chat.awaiting]} color={color} />
              ) : empty && kind ? (
                <QuickStartRow kind={kind} onChip={(key) => router.push(quickStartPath(key))} />
              ) : null
            }
          />
        </View>
        </>
      )}
      <ConsentSheet />
      </KeyboardAvoidingView>
    </View>
  )
}

export default BotChatScreen
