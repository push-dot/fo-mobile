import { LinearGradient } from 'expo-linear-gradient'
import { router, useNavigation } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View, type ScrollViewInstance, type TextInputInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '@/theme'
import { BottomSheet, GlassButton, Icon, Mascot, Menu, Text, TextField } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { usePersonalPurchase } from '@/features/billing'
import { useConvertDocument } from '@/features/my'
import {
  answer,
  ApprovalPanel,
  AWAITING_TEXT,
  AccountModal,
  ComposerArea,
  ConsentSheet,
  OPEN_DRAWER,
  DELETE_CONFIRM,
  DocsModal,
  headerMenu,
  hydrate,
  Item,
  Queued,
  Appear,
  materialsPath,
  quickStartPath,
  send,
  StatusRow,
  stop,
  useChat,
  useConversationList,
  useArchiveConversation,
  useDeleteConversation,
  usePinConversation,
  useReduceMotion,
  useRenameConversation,
} from '@/features/chat'

const ConversationScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const reduce = useReduceMotion()
  const chat = useChat(id)
  const purchase = usePersonalPurchase()
  const convert = useConvertDocument((documentId) => {
    router.push(`/docs/push/${documentId}`)
  })
  const list = useConversationList()
  const conv = list.data?.data.find((x) => x.id === id)
  const navigation = useNavigation()
  const [planOpen, setPlanOpen] = useState(false)
  const [docs, setDocs] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [sayingFor, setSayingFor] = useState<string>()
  const [bottomH, setBottomH] = useState(160)
  const [fresh, setFresh] = useState(false)
  const scroll = useRef<ScrollViewInstance>(null)
  const atBottom = useRef(true)
  const input = useRef<TextInputInstance>(null)

  useEffect(() => {
    hydrate(id).catch(() => undefined)
  }, [id])
  const saying = !!chat.approval && sayingFor === chat.approval.id

  const rename = useRenameConversation(id, conv?.revision)
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
    destructive: action.destructive,
    onPress: () => {
      if (action.id === 'rename') setRenaming(conv?.title ?? '')
      else if (action.id === 'docs') setDocs(true)
      else if (action.id === 'share') void shareMessage({ title: conv?.title, message: shareText() })
      else if (action.id === 'pin' && conv) pin.mutate(conv)
      else if (action.id === 'archive' && conv) archive.mutate(conv, { onSuccess: () => router.dismissTo('/chat') })
      else if (action.id === 'delete')
        Alert.alert(DELETE_CONFIRM.title, DELETE_CONFIRM.body, [
          { text: DELETE_CONFIRM.cancel, style: 'cancel' },
          { text: DELETE_CONFIRM.confirm, style: 'destructive', onPress: () => remove.mutate(id, { onSuccess: () => router.dismissTo('/chat') }) },
        ])
    },
  }))

  const placeholder = chat.working ? '작업 중에도 말할 수 있어요' : chat.items.length ? '더 고칠 부분이 있으면 말해 주세요' : '공고 링크를 붙여넣어 보세요'
  const showPanel = chat.approval && !saying

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView
        ref={scroll}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end', gap: 18, paddingHorizontal: 20, paddingTop: insets.top + 64, paddingBottom: bottomH + 16 }}
        onScroll={(e) => {
          const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent
          atBottom.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 48
          if (atBottom.current) setFresh(false)
        }}
        scrollEventThrottle={64}
        // Follow new lines; stop following once the person scrolls up (feature-spec 15.4).
        onContentSizeChange={() => (atBottom.current ? scroll.current?.scrollToEnd({ animated: !reduce }) : setFresh(true))}
        keyboardDismissMode="interactive"
      >
        {chat.items.map((it) => (
          <Item
            key={it.id}
            item={it}
            onAction={(text) => send(id, text)}
            onConvert={(card) => convert.mutate(card.documentId)}
            onView={(card) => router.push(`/docs/push/${card.documentId}`)}
            resultPending={convert.isPending}
            onUsage={(action) => (action === 'plan' ? setPlanOpen(true) : purchase.buyCredits())}
          />
        ))}
        {chat.queue.map((item, i) => (
          <Queued key={`${i}-${item.text}`} text={item.text} />
        ))}
      </ScrollView>

      <Header onDrawer={() => navigation.dispatch(OPEN_DRAWER)} onNew={() => router.dismissTo('/chat')} menu={menu} />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} pointerEvents="box-none">
        {fresh ? (
          <Appear kind="fade" style={{ alignItems: 'center', paddingBottom: 8 }}>
            <Pressable
              accessibilityRole="button"
              onPress={() => (scroll.current?.scrollToEnd({ animated: !reduce }), setFresh(false))}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: c.t1 }}
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
            <View style={{ paddingHorizontal: 12, paddingBottom: Math.max(insets.bottom, 6) }}>
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
                    <Text v="c1" weight="600" color="t3" style={{ paddingHorizontal: 8 }}>
                      {AWAITING_TEXT[chat.awaiting]}
                    </Text>
                  ) : null
                }
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <BottomSheet
        visible={renaming !== null}
        onClose={() => setRenaming(null)}
        title="대화 이름을 바꿀까요?"
        action={{
          label: '이름 바꾸기',
          disabled: !renaming?.trim() || !conv,
          onPress: () => (rename.mutate(renaming!.trim()), setRenaming(null)),
        }}
      >
        <TextField value={renaming ?? ''} onChangeText={setRenaming} max={300} autoFocus accessibilityLabel="대화 이름" />
      </BottomSheet>
      <DocsModal visible={docs} onClose={() => setDocs(false)} />
      <AccountModal visible={planOpen} initialPage="plan" onClose={() => setPlanOpen(false)} />
      <ConsentSheet />
    </View>
  )
}

const Header = ({ onDrawer, onNew, menu }: { onDrawer: () => void; onNew: () => void; menu: { key: string; label: string; destructive?: boolean; onPress: () => void }[] }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0 }} pointerEvents="box-none">
      {ios ? (
        <LinearGradient colors={[c.bg, c.bg, `${c.bg}00`]} locations={[0, 0.6, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 76 }} pointerEvents="none" />
      ) : (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 56, backgroundColor: c.bg }} />
      )}
      <View style={{ marginTop: insets.top, height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ios ? 12 : 8, gap: 8 }}>
        <GlassButton actions={[{ icon: 'side', label: '대화 목록 열기', onPress: onDrawer }]} />
        <View accessibilityRole="header" accessibilityLabel="Push" style={{ flex: 1, alignItems: 'center' }}>
          <Mascot size={36} />
        </View>
        <GlassButton actions={[{ icon: 'edit', label: '새 대화', onPress: onNew }]} />
        <Menu accessibilityLabel="대화 더 보기" actions={menu}>
          <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="more" size={22} color="t1" />
          </View>
        </Menu>
      </View>
    </View>
  )
}

export default ConversationScreen
