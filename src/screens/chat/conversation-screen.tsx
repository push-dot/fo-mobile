import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type ScrollViewInstance, type TextInputInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, spacing, useColors } from '@/theme'
import { askConfirm, Button, Glass, GlassButton, Icon, Mascot, Menu, Text, useKeyboardHeight, useReduceMotion, type MenuAction } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { usePersonalPurchase } from '@/features/billing'
import { useConvertDocument } from '@/features/my'
import {
  answer,
  ApprovalPanel,
  AWAITING_TEXT,
  AwaitingRow,
  ComposerArea,
  composerPlaceholder,
  ConsentSheet,
  DELETE_CONFIRM,
  headerMenu,
  headerCompany,
  hydrate,
  Item,
  Queued,
  Appear,
  accountPath,
  docsPath,
  materialsPath,
  quickStartPath,
  renamePath,
  send,
  sidebarPath,
  StatusRow,
  stop,
  threadInset,
  useChat,
  useConversation,
  useArchiveConversation,
  useDeleteConversation,
  usePinConversation,
} from '@/features/chat'
import { followScroll } from '@/features/chat/utils/follow-scroll'
import type { ChatItem } from '@/features/chat/types'


// The boards seat the composer box 6pt above the home-indicator inset (`bottom: calc(var(--bot) + 6px)`).
const COMPOSER_BOTTOM = 6

const ConversationScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const reduce = useReduceMotion()
  const chat = useChat(id)
  const purchase = usePersonalPurchase()
  const convert = useConvertDocument((documentId) => {
    router.push(`/docs/push/${documentId}`)
  })
  const one = useConversation(id)
  const conv = one.data
  const [sayingFor, setSayingFor] = useState<string>()
  const [bottomH, setBottomH] = useState(160)
  const [fresh, setFresh] = useState(false)
  const [failedHydrateId, setFailedHydrateId] = useState<string | null>(null)
  const historyError = failedHydrateId === id
  const scroll = useRef<ScrollViewInstance>(null)
  const atBottom = useRef(true)
  const input = useRef<TextInputInstance>(null)

  const idRef = useRef(id)
  useEffect(() => {
    idRef.current = id
  }, [id])

  useEffect(() => {
    void hydrate(id)
      .then(() => setFailedHydrateId((failed) => (failed === id ? null : failed)))
      .catch(() => setFailedHydrateId(id))
  }, [id])
  const saying = !!chat.approval && sayingFor === chat.approval.id

  const remove = useDeleteConversation()
  const pin = usePinConversation()
  const archive = useArchiveConversation()

  const shareText = () =>
    chat.items
      .map((i) => (i.type === 'user' ? `나: ${i.text}` : i.type === 'agentText' ? `AI: ${i.text.replace(/\*\*/g, '')}` : i.type === 'tool' ? `· ${i.action} ${i.result ?? i.error ?? ''}` : ''))
      .filter(Boolean)
      .join('\n')

  const menu = headerMenu(!!conv?.pinned).map((action) => ({
    key: action.id,
    label: action.label,
    systemImage: action.systemImage,
    destructive: action.destructive,
    onPress: () => {
      if (action.id === 'rename') router.push(renamePath(id))
      else if (action.id === 'docs') router.push(docsPath())
      else if (action.id === 'share') void shareMessage({ title: conv?.title, message: shareText() })
      else if (action.id === 'pin' && conv) pin.mutate(conv)
      else if (action.id === 'archive' && conv) archive.mutate(conv, { onSuccess: () => router.dismissTo('/chat') })
      else if (action.id === 'delete')
        askConfirm({ ...DELETE_CONFIRM, danger: true, onConfirm: () => remove.mutate(id, { onSuccess: () => router.dismissTo('/chat') }) })
    },
  }))

  const company = headerCompany(chat.items, conv?.company)
  const placeholder = composerPlaceholder(chat)
  // The keyboard covers the nav bar / home indicator, so its inset below the composer would leave a gap.
  const keyboard = useKeyboardHeight()
  const showPanel = chat.approval && !saying
  const lastResultId = chat.items.findLast((i) => i.type === 'result')?.id

  const onAction = useCallback((text: string) => send(idRef.current, text), [])

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

  const retryHistory = useCallback(() => {
    void hydrate(id)
      .then(() => setFailedHydrateId((failed) => (failed === id ? null : failed)))
      .catch(() => setFailedHydrateId(id))
  }, [id])

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', gap: 18, paddingHorizontal: spacing[5], paddingTop: insets.top + 64, paddingBottom: threadInset({ bottomH, keyboard, navBar: insets.bottom, approval: !!showPanel, android: Platform.OS === 'android', status: !!chat.working || !!chat.awaiting }) }}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
          atBottom.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 48
          if (atBottom.current) setFresh(false)
        }}
        scrollEventThrottle={64}
        // Follow new lines; stop following once the person scrolls up (feature-spec 15.4).
        onContentSizeChange={() => {
          const mode = followScroll(atBottom.current, !!chat.working, reduce)
          if (mode === 'fresh') setFresh(true)
          else scroll.current?.scrollToEnd({ animated: mode === 'animated' })
        }}
        keyboardDismissMode="interactive"
      >
        {historyError ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingVertical: spacing[2] }}>
            <Text v="c1" color="t2" style={{ flex: 1 }}>
              대화를 불러오지 못했어요
            </Text>
            <Button label="다시 불러오기" size="sm" variant="secondary" onPress={retryHistory} />
          </View>
        ) : null}
        {chat.items.map((it) => (
          <Item
            key={it.id}
            item={it}
            onAction={onAction}
            onConvert={onConvert}
            onView={onView}
            resultPending={it.type === 'result' && it.id === lastResultId && convert.isPending}
            resultAwaiting={it.type === 'result' && it.id === lastResultId && !!chat.approval}
            onUsage={onUsage}
          />
        ))}
        {chat.queue.map((item, i) => (
          <Queued key={`${i}-${item.text}`} text={item.text} />
        ))}
      </ScrollView>

      <Header onSidebar={() => router.push(sidebarPath(id))} title={company} menu={menu} />

      <KeyboardAvoidingView behavior="padding" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
        {fresh ? (
          <Appear kind="fade" style={{ alignItems: 'center', paddingBottom: spacing[2] }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => (scroll.current?.scrollToEnd({ animated: !reduce }), setFresh(false))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1], height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: c.t1 }}
            >
              <Icon name="down" size={16} color={c.bg} />
              <Text v="c1" weight="700" style={{ color: c.bg }}>
                새 내용
              </Text>
            </Pressable>
          </Appear>
        ) : null}
        <View onLayout={(e) => setBottomH(e.nativeEvent.layout.height)}>
          {showPanel ? (
            <ApprovalPanel
              key={chat.approval!.id}
              approval={chat.approval!}
              onAnswer={(text, choice) => answer(id, text, choice)}
              onSay={() => (setSayingFor(chat.approval?.id), setTimeout(() => input.current?.focus(), 50))}
              // The picked material lands in the composer; sending it re-asks the gate with that material.
              onMaterials={() => (setSayingFor(chat.approval?.id), router.push(materialsPath()))}
            />
          ) : (
            <View style={{ paddingHorizontal: spacing[3], paddingBottom: keyboard ? spacing[2] : insets.bottom + COMPOSER_BOTTOM }}>
              <ComposerArea
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
        </View>
      </KeyboardAvoidingView>

      <ConsentSheet />
    </View>
  )
}

const Header = ({ onSidebar, title, menu }: { onSidebar: () => void; title?: string; menu: MenuAction[] }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const pill = (
    <View style={{ height: 44, minWidth: 76, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingLeft: title ? spacing[3] : 0, paddingRight: title ? spacing[4] : 0 }}>
      <Mascot size={36} />
      {title ? (
        <Text v="b2" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
          {title}
        </Text>
      ) : null}
    </View>
  )
  const more = (
    <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name="more" size={22} color="t1" />
    </View>
  )
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0 }} pointerEvents="box-none">
      {ios ? (
        <LinearGradient colors={[c.bg, c.bg, `${c.bg}00`]} locations={[0, 0.6, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 76 }} pointerEvents="none" />
      ) : (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 56, backgroundColor: c.bg }} />
      )}
      <View style={{ marginTop: insets.top, height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: ios ? spacing[3] : spacing[2] }}>
        <GlassButton actions={[{ icon: 'side', label: '대화 목록 열기', onPress: onSidebar }]} />
        <View accessibilityRole="header" accessibilityLabel={title ? `Push · ${title}` : 'Push'} style={{ flex: 1, alignItems: 'center', paddingHorizontal: spacing[2] }}>
          {ios ? <Glass style={{ borderRadius: radius.pill, maxWidth: '100%' }}>{pill}</Glass> : pill}
        </View>
        <Menu accessibilityLabel="대화 더 보기" actions={menu}>
          {ios ? <Glass interactive style={{ borderRadius: radius.pill }}>{more}</Glass> : more}
        </Menu>
      </View>
    </View>
  )
}

export default ConversationScreen
