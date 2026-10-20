import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Share, View, type ScrollViewInstance, type TextInputInstance } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { api } from '../../lib/api'
import { useColors, useShadow } from '../../theme'
import { BottomSheet, Glass, GlassButton, Icon, Text, TextField, type IconName } from '../../ui'
import { chatApi } from './api'
import { ApprovalPanel } from './ApprovalPanel'
import { ComposerArea } from './ComposerArea'
import { DocsModal } from './DocsModal'
import { ChatDrawer } from './Drawer'
import { Item, Queued } from './Items'
import { Appear, useReduceMotion } from './motion'
import { QuickStartSheet } from './QuickStartSheet'
import type { QuickStart } from './quickStarts'
import { answer, forget, hydrate, send, stop, useChat } from './store'
import { StatusRow } from './StatusRow'

/** AI 채팅 conversation (chat/[id], no tab bar): Claude Code-style transcript + composer or approval panel. */
export function ConversationScreen({ id }: { id: string }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const reduce = useReduceMotion()
  const qc = useQueryClient()
  const chat = useChat(id)
  const list = useQuery({ queryKey: ['conversations', 'all'], queryFn: () => chatApi.conversations({ limit: 100 }) })
  const conv = list.data?.data.find((x) => x.id === id)
  const [drawer, setDrawer] = useState(false)
  const [more, setMore] = useState(false)
  const [docs, setDocs] = useState(false)
  const [renaming, setRenaming] = useState<string | null>(null)
  const [qs, setQs] = useState<QuickStart | null>(null)
  // "말로 하기" applies to one approval; a new approval resets it.
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

  const rename = useMutation({
    mutationFn: (title: string) => api.conversations.rename(id, conv!.revision, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['conversations'] }),
    onError: () => Alert.alert('이름을 바꾸지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })
  const remove = useMutation({
    mutationFn: () => api.conversations.archive(id, conv!.revision),
    onSuccess: () => {
      forget(id)
      void qc.invalidateQueries({ queryKey: ['conversations'] })
      router.dismissTo('/chat')
    },
    onError: () => Alert.alert('대화를 지우지 못했어요', '잠시 뒤에 다시 해 주세요.'),
  })

  const shareText = () =>
    chat.items
      .map((i) => (i.type === 'user' ? `나: ${i.text}` : i.type === 'agentText' ? `AI: ${i.text.replace(/\*\*/g, '')}` : i.type === 'tool' ? `· ${i.action} ${i.result ?? i.error ?? ''}` : ''))
      .filter(Boolean)
      .join('\n')

  const menu: { icon: IconName; label: string; danger?: boolean; onPress: () => void }[] = [
    { icon: 'edit', label: '이름 바꾸기', onPress: () => setRenaming(conv?.title ?? '') },
    { icon: 'doc', label: '쓴 서류·공고 보기', onPress: () => setDocs(true) },
    { icon: 'share', label: '대화 공유', onPress: () => void Share.share({ title: conv?.title, message: shareText() }) },
    {
      icon: 'x',
      label: '대화 삭제',
      danger: true,
      onPress: () =>
        Alert.alert('대화를 삭제할까요?', '이 대화에서만 쓰던 자료도 함께 보관돼요.', [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: () => remove.mutate() },
        ]),
    },
  ]

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
          <Item key={it.id} item={it} onAction={(text) => send(id, text)} />
        ))}
        {chat.queue.map((t, i) => (
          <Queued key={`${i}-${t}`} text={t} />
        ))}
      </ScrollView>

      <Header
        title={conv?.title ?? ''}
        onDrawer={() => setDrawer(true)}
        onNew={() => router.dismissTo('/chat')}
        onMore={() => setMore(true)}
      />

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
            />
          ) : (
            <View style={{ paddingHorizontal: 12, paddingBottom: Math.max(insets.bottom, 6) }}>
              <ComposerArea
                inputRef={input}
                placeholder={saying ? '어떻게 할지 말해 주세요' : placeholder}
                working={!!chat.working}
                onStop={() => stop(id)}
                onSend={(text, attachment) => send(id, text, attachment)}
                onShortcut={setQs}
                above={chat.working ? <StatusRow verbs={chat.working.verbs} startedAt={chat.working.startedAt} onStop={() => stop(id)} /> : null}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>

      <MoreMenu visible={more} items={menu} onClose={() => setMore(false)} />
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
      <QuickStartSheet qs={qs} onClose={() => setQs(null)} />
      <ChatDrawer visible={drawer} onClose={() => setDrawer(false)} currentId={id} />
    </View>
  )
}

function Header({ title, onDrawer, onNew, onMore }: { title: string; onDrawer: () => void; onNew: () => void; onMore: () => void }) {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  return (
    <View style={{ position: 'absolute', left: 0, right: 0, top: 0 }} pointerEvents="box-none">
      {ios ? (
        // Content fades under the glass buttons instead of a hard bar.
        <LinearGradient colors={[c.bg, c.bg, `${c.bg}00`]} locations={[0, 0.6, 1]} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 76 }} pointerEvents="none" />
      ) : (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: insets.top + 56, backgroundColor: c.bg }} />
      )}
      <View style={{ marginTop: insets.top, height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: ios ? 12 : 8, gap: 8 }}>
        <GlassButton actions={[{ icon: 'side', label: '대화 목록 열기', onPress: onDrawer }]} />
        <Text v="h3" numberOfLines={1} accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
          {title}
        </Text>
        <GlassButton
          actions={[
            { icon: 'edit', label: '새 대화', onPress: onNew },
            { icon: 'more', label: '더 보기', onPress: onMore },
          ]}
        />
      </View>
    </View>
  )
}

/** ⋯ pop-up menu under the header capsule (ChatMore). */
function MoreMenu({ visible, items, onClose }: { visible: boolean; items: { icon: IconName; label: string; danger?: boolean; onPress: () => void }[]; onClose: () => void }) {
  const c = useColors()
  const shadow = useShadow()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const body = (
    <View style={{ padding: 6 }}>
      {items.map((m, i) => (
        <View key={m.label}>
          {m.danger && i > 0 ? <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4, marginHorizontal: 10 }} /> : null}
          <Pressable
            accessibilityRole="menuitem"
            onPress={() => (onClose(), m.onPress())}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, height: 44, paddingHorizontal: 14, borderRadius: 12, backgroundColor: pressed ? c.fill : 'transparent' })}
          >
            <View style={{ width: 22, alignItems: 'center' }}>
              <Icon name={m.icon} size={20} color={m.danger ? 'red' : 't1'} />
            </View>
            <Text v="b1" color={m.danger ? 'red' : 't1'}>
              {m.label}
            </Text>
          </Pressable>
        </View>
      ))}
    </View>
  )
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="메뉴 닫기" style={{ flex: 1 }} onPress={onClose} />
      <View accessibilityRole="menu" style={{ position: 'absolute', top: insets.top + 58, right: 12, width: 236 }}>
        {ios ? (
          <Glass surface="sheet" style={{ borderRadius: 26 }}>
            {body}
          </Glass>
        ) : (
          <View style={[shadow.pop, { borderRadius: 20, backgroundColor: c.card, elevation: 8 }]}>{body}</View>
        )}
      </View>
    </Modal>
  )
}
