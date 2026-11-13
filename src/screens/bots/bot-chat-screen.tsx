import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { FlatList, KeyboardAvoidingView, View, type TextInputInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { usePersonalPurchase } from '@/features/billing'
import { materialPickerPath as botMaterialPath, useBot, useBotProfile, type BotId } from '@/features/bots'
import {
  AWAITING_TEXT,
  ApprovalPanel,
  AwaitingRow,
  ComposerArea,
  ConsentSheet,
  HeaderPill,
  Item,
  Onboarding,
  Queued,
  StatusRow,
  THREAD_BATCH,
  THREAD_INITIAL_RENDER,
  THREAD_WINDOW,
  accountPath,
  answer,
  closeApproval,
  composerPlaceholder,
  openBot,
  retryApproval,
  quickStartPath,
  send,
  stop,
  useCardState,
  useChat,
  WaitingLine,
  type ChatItem,
} from '@/features/chat'
import { useConvertDocument } from '@/features/my'
import { Button, Text, useKeyboardHeight } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const COMPOSER_BOTTOM = 6

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
  const placeholder = composerPlaceholder(chat, name)
  const empty = chat.items.length === 0 && chat.queue.length === 0
  const lastResultId = chat.items.findLast((i) => i.type === 'result')?.id
  const data = [...chat.items].reverse()

  const onAction = useCallback((text: string) => send(id, text), [id])
  const convertRef = useRef(convert.mutate)
  const buyCredits = useRef(purchase.buyCredits)
  useEffect(() => {
    convertRef.current = convert.mutate
    buyCredits.current = purchase.buyCredits
  }, [convert.mutate, purchase.buyCredits])
  const onConvert = useCallback((card: Extract<ChatItem, { type: 'result' }>) => {
    convertRef.current(card.documentId)
  }, [])
  const onView = useCallback((card: Extract<ChatItem, { type: 'result' }>) => {
    router.push(`/docs/push/${card.documentId}`)
  }, [])
  const onUsage = useCallback((action: 'plan' | 'credits') => {
    if (action === 'plan') router.push(accountPath('plan'))
    else buyCredits.current()
  }, [])
  const renderItem = useCallback(
    ({ item }: { item: ChatItem }) => (
      <Item
        item={item}
        onAction={onAction}
        onConvert={onConvert}
        onView={onView}
        resultPending={item.type === 'result' && item.id === lastResultId && convert.isPending}
        resultAwaiting={item.type === 'result' && item.id === lastResultId && !!chat.approval}
        onUsage={onUsage}
      />
    ),
    [onAction, onConvert, onView, onUsage, lastResultId, convert.isPending, chat.approval],
  )

  return (
    <View style={{ flex: 1 }}>
      <HeaderPill botId={id} name={name} kind={kind} color={color} />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
      {empty && kind && name ? (
        <Onboarding kind={kind} name={name} postingTitle={profile.data?.posting?.title} onChip={(key) => router.push(quickStartPath(key))} />
      ) : (
      <FlatList
        inverted
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        initialNumToRender={THREAD_INITIAL_RENDER}
        maxToRenderPerBatch={THREAD_BATCH}
        windowSize={THREAD_WINDOW}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ gap: 18, paddingHorizontal: spacing[5], paddingVertical: spacing[4] }}
        ListHeaderComponent={
          chat.queue.length || showPanel ? (
            <View style={{ gap: 18 }}>
              {showPanel ? <WaitingLine approval={chat.approval!} /> : null}
              {chat.queue.map((item, i) => (
                <Queued key={`${i}-${item.text}`} text={item.text} />
              ))}
            </View>
          ) : undefined
        }
      />
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
        <View style={{ paddingHorizontal: spacing[3], paddingBottom: keyboard ? spacing[2] : insets.bottom + COMPOSER_BOTTOM }}>
          <ComposerArea
            botId={id}
            inputRef={input}
            placeholder={saying ? '어떻게 할지 말해 주세요' : placeholder}
            working={!!chat.working}
            onStop={() => stop(id)}
            onSend={(text, attachment) => send(id, text, attachment)}
            onShortcut={(qs) => router.push(quickStartPath(qs.key))}
            above={
              chat.working ? (
                <StatusRow verbs={chat.working.verbs} startedAt={chat.working.startedAt} onStop={() => stop(id)} />
              ) : chat.awaiting ? (
                <AwaitingRow text={AWAITING_TEXT[chat.awaiting]} />
              ) : null
            }
          />
        </View>
      )}
      <ConsentSheet />
      </KeyboardAvoidingView>
    </View>
  )
}

export default BotChatScreen
