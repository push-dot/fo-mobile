import { useMutation, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { searchHangul } from '@push/shared'
import { useColors } from '@/theme'
import { Badge, BottomSheet, Button, ContextMenu, GlassButton, Text, TextField, TopBar } from '@/shared/components'
import { renameConversation } from '../api/fetchers'
import {
  useArchiveConversation,
  useArchivedConversations,
  useConversationList,
  useDeleteConversation,
  usePinConversation,
  useUnarchiveConversation,
} from '../api/hooks'
import type { ConversationRow } from '../api/schemas'
import { ago } from '../utils'
import { ARCHIVED_NOTE, ARCHIVED_TITLE, DELETE_CONFIRM, UNARCHIVE_LABEL, conversationRowMenu } from '../utils/conversation-menu'

export const statusBadge = (s: ConversationRow['status']) =>
  s === 'NEEDS_APPROVAL' ? <Badge label="확인 필요" tone="orange" /> : s === 'RUNNING' ? <Badge label="작업 중" tone="ac" /> : null

const dayStart = () => new Date(new Date().setHours(0, 0, 0, 0)).getTime()

const groups = (rows: ConversationRow[]) => {
  const today = dayStart()
  const week = today - 6 * 86_400_000
  const out: { title: string; rows: ConversationRow[] }[] = [
    { title: '오늘', rows: [] },
    { title: '이번 주', rows: [] },
    { title: '이전', rows: [] },
  ]
  for (const r of rows) {
    const t = new Date(r.updatedAt).getTime()
    out[t >= today ? 0 : t >= week ? 1 : 2]!.rows.push(r)
  }
  return out.filter((g) => g.rows.length)
}

/** Title, last line and time; the long-press preview reuses it (iOS only). */
const RowBody = ({ row: r, archived, preview }: { row: ConversationRow; archived?: boolean; preview?: boolean }) => {
  const c = useColors()
  return (
    <View style={{ gap: 3, ...(preview ? { width: 320, padding: 16, backgroundColor: c.card } : {}) }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Text v="b1" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
          {r.title}
        </Text>
        {r.pinned && !archived ? (
          <Text v="c2" weight="700" color="acText">
            고정
          </Text>
        ) : null}
        {statusBadge(r.status)}
        <Text v="c2" color="t3" style={{ marginLeft: 'auto' }}>
          {ago(r.updatedAt)}
        </Text>
      </View>
      {r.lastLine ? (
        <Text v="b2" color="t3" numberOfLines={1}>
          {r.lastLine}
        </Text>
      ) : null}
    </View>
  )
}

const startNew = (onClose: () => void) => {
  onClose()
  router.dismissTo('/chat')
}

export const ConversationList = ({
  onClose,
  currentId,
  onDeleted,
}: {
  onClose: () => void
  currentId?: string
  onDeleted?: () => void
}) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const [q, setQ] = useState('')
  const [renaming, setRenaming] = useState<ConversationRow | null>(null)
  const [nextTitle, setNextTitle] = useState('')
  const qc = useQueryClient()
  const rename = useMutation({
    mutationFn: () => renameConversation(renaming!.id, renaming!.revision, nextTitle.trim()),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversations'] })
      setRenaming(null)
    },
  })
  const [archivedView, setArchivedView] = useState(false)
  const list = useConversationList()
  const archived = useArchivedConversations(archivedView)
  const pin = usePinConversation()
  const archive = useArchiveConversation()
  const unarchive = useUnarchiveConversation()
  const remove = useDeleteConversation()
  const source = archivedView ? archived : list
  const rows = searchHangul(source.data?.data ?? [], q, (r) => [r.title, r.lastLine ?? '']).map((x) => x.item)

  const confirmDelete = (row: ConversationRow) =>
    Alert.alert(DELETE_CONFIRM.title, DELETE_CONFIRM.body, [
      { text: DELETE_CONFIRM.cancel, style: 'cancel' },
      {
        text: DELETE_CONFIRM.confirm,
        style: 'destructive',
        onPress: () =>
          remove.mutate(row.id, {
            onSuccess: () => {
              if (row.id === currentId) onDeleted?.()
            },
          }),
      },
    ])

  const menu = (row: ConversationRow) =>
    conversationRowMenu(row.pinned).map((a) => ({
      key: a.id,
      label: a.label,
      destructive: a.destructive,
      onPress: () => {
        if (a.id === 'pin') pin.mutate(row)
        else if (a.id === 'archive') archive.mutate(row)
        else if (a.id === 'delete') confirmDelete(row)
        else {
          setNextTitle(row.title)
          setRenaming(row)
        }
      },
    }))

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: Platform.OS === 'ios' ? 8 : insets.top }}>
      <TopBar
        title={archivedView ? ARCHIVED_TITLE : '대화'}
        onBack={archivedView ? () => setArchivedView(false) : onClose}
        right={archivedView ? undefined : <GlassButton actions={[{ icon: 'edit', label: '새 대화', onPress: () => startNew(onClose) }]} />}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} keyboardDismissMode="on-drag">
        <View style={{ paddingTop: 4, paddingHorizontal: 20, paddingBottom: 6 }}>
          <TextField icon="search" placeholder="대화 검색" value={q} onChangeText={setQ} returnKeyType="search" accessibilityLabel="대화 검색" />
        </View>
        {groups(rows).map((g) => (
          <View key={g.title}>
            <Text v="c1" weight="700" color="t3" style={{ paddingTop: 14, paddingHorizontal: 24, paddingBottom: 8 }}>
              {g.title}
            </Text>
            {g.rows.map((r) => (
              <View key={r.id} style={{ paddingVertical: 14, paddingHorizontal: 20, gap: 3 }}>
                {archivedView ? (
                  <Pressable accessibilityRole="button" onPress={() => router.push(`/chat/${r.id}`)}>
                    <RowBody row={r} archived />
                  </Pressable>
                ) : (
                  <ContextMenu
                    accessibilityLabel={r.title}
                    actions={menu(r)}
                    onPress={() => router.push(`/chat/${r.id}`)}
                    preview={<RowBody row={r} preview />}
                  >
                    <RowBody row={r} />
                  </ContextMenu>
                )}
                {archivedView ? (
                  <Pressable accessibilityRole="button" accessibilityLabel={UNARCHIVE_LABEL} onPress={() => unarchive.mutate(r)} hitSlop={8}>
                    <Text v="c1" weight="700" color="acText">
                      {UNARCHIVE_LABEL}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>
        ))}
        {source.data && rows.length === 0 && (q || !archivedView) ? (
          <View style={{ padding: 32, alignItems: 'center', gap: 12 }}>
            <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
              {q ? `“${q}”에 맞는 대화가 없어요` : '아직 대화가 없어요'}
            </Text>
            {!q && !archivedView ? <Button label="새 대화 시작" onPress={() => startNew(onClose)} /> : null}
          </View>
        ) : null}
        {!q && !archivedView && (source.data?.data.length ?? 0) > 0 ? (
          <Pressable accessibilityRole="button" onPress={() => setArchivedView(true)} style={{ paddingVertical: 16, paddingHorizontal: 24 }}>
            <Text v="b1" weight="700">
              {ARCHIVED_TITLE}
            </Text>
          </Pressable>
        ) : null}
        {archivedView ? (
          <Text v="c1" color="t3" style={{ paddingHorizontal: 24, paddingTop: 8 }}>
            {ARCHIVED_NOTE}
          </Text>
        ) : null}
      </ScrollView>
      <BottomSheet
        visible={!!renaming}
        onClose={() => setRenaming(null)}
        title="대화 이름을 바꿀까요?"
        action={{ label: '이름 바꾸기', disabled: !nextTitle.trim() || rename.isPending, onPress: () => rename.mutate() }}
      >
        <TextField value={nextTitle} onChangeText={setNextTitle} max={300} accessibilityLabel="대화 이름" />
      </BottomSheet>
    </View>
  )
}

export const ConversationsModal = ({
  visible,
  onClose,
  currentId,
  onDeleted,
}: {
  visible: boolean
  onClose: () => void
  currentId?: string
  onDeleted?: () => void
}) => (
  <Modal visible={visible} animationType="slide" presentationStyle={Platform.OS === 'ios' ? 'pageSheet' : 'fullScreen'} onRequestClose={onClose}>
    <ConversationList onClose={onClose} currentId={currentId} onDeleted={onDeleted} />
  </Modal>
)
