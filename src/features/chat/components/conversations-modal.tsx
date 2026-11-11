import { router } from 'expo-router'
import { memo, useCallback, useMemo, useState } from 'react'
import { FlatList, Pressable, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { searchHangul } from '@push/shared'
import { spacing, useColors } from '@/theme'
import { Badge, Button, ContextMenu, GlassButton, Icon, Text, TextField, askConfirm, type MenuAction } from '@/shared/components'
import {
  useArchiveConversation,
  useArchivedConversations,
  useConversationList,
  useDeleteConversation,
  usePinConversation,
  useUnarchiveConversation,
} from '../api/hooks'
import type { ConversationRow } from '../api/schemas'
import { ago, renamePath } from '../utils'
import { ARCHIVED_NOTE, ARCHIVED_TITLE, DELETE_CONFIRM, UNARCHIVE_LABEL, conversationRowMenu } from '../utils/conversation-menu'
import { flattenConversationGroups, type ConversationListRow as ListRow } from '../utils/conversation-list-rows'
import Note from './note'
import PageModal, { PageEmpty } from './page-modal'


export const statusBadge = (s: ConversationRow['status']) =>
  s === 'NEEDS_APPROVAL' || s === 'RUNNING' ? (
    <View style={{ alignSelf: 'center' }}>
      <Badge label={s === 'RUNNING' ? '작업 중' : '확인 필요'} tone={s === 'RUNNING' ? 'ac' : 'orange'} />
    </View>
  ) : null

const dayStart = () => new Date(new Date().setHours(0, 0, 0, 0)).getTime()

const groups = (rows: ConversationRow[]) => {
  const today = dayStart()
  const week = today - 6 * 86_400_000
  const out: { title?: string; rows: ConversationRow[] }[] = [
    { rows: [] },
    { title: '오늘', rows: [] },
    { title: '이번 주', rows: [] },
    { title: '이전', rows: [] },
  ]
  for (const r of rows) {
    const t = new Date(r.updatedAt).getTime()
    out[r.pinned ? 0 : t >= today ? 1 : t >= week ? 2 : 3]!.rows.push(r)
  }
  return out.filter((g) => g.rows.length)
}

/** Title, last line and time; the long-press preview reuses it (iOS only). */
const RowBody = ({ row: r, archived }: { row: ConversationRow; archived?: boolean }) => (
  <View style={{ gap: spacing[1] }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      {r.pinned && !archived ? <Icon name="pin" size={16} color="acText" /> : null}
      <Text v="b1" weight="700" numberOfLines={1} style={{ flexShrink: 1 }}>
        {r.title}
      </Text>
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

// Under the search field the boards keep 160pt clear below the note, 20 more than a page.
const LIST_EMPTY_RESERVE = 160

const ROW = { paddingVertical: spacing[4], paddingHorizontal: spacing[5] } as const

const startNew = (onClose: () => void) => {
  onClose()
  router.dismissTo('/chat')
}

const ConversationItem = memo(
  ({
    row,
    width,
    menu,
    cardBg,
  }: {
    row: ConversationRow
    width: number
    menu: (row: ConversationRow) => MenuAction[]
    cardBg: string
  }) => (
    <ContextMenu
      accessibilityLabel={row.title}
      actions={menu(row)}
      onPress={() => router.push(`/chat/${row.id}`)}
      preview={
        <View style={{ ...ROW, paddingHorizontal: spacing[4], width: width - 24, borderRadius: 18, backgroundColor: cardBg }}>
          <RowBody row={row} />
        </View>
      }
    >
      <View style={ROW}>
        <RowBody row={row} />
      </View>
    </ContextMenu>
  ),
)
ConversationItem.displayName = 'ConversationItem'

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
  const { width } = useWindowDimensions()
  const [q, setQ] = useState('')
  const [archivedView, setArchivedView] = useState(false)
  const list = useConversationList()
  const archived = useArchivedConversations(archivedView)
  const pin = usePinConversation()
  const archive = useArchiveConversation()
  const unarchive = useUnarchiveConversation()
  const remove = useDeleteConversation()
  const source = archivedView ? archived : list
  const rows = searchHangul(source.data?.data ?? [], archivedView ? '' : q, (r) => [r.title, r.lastLine ?? '']).map((x) => x.item)

  const insets = useSafeAreaInsets()

  const confirmDelete = useCallback(
    (row: ConversationRow) =>
      askConfirm({
        ...DELETE_CONFIRM,
        danger: true,
        onConfirm: () =>
          remove.mutate(row.id, {
            onSuccess: () => {
              if (row.id === currentId) onDeleted?.()
            },
          }),
      }),
    [currentId, onDeleted, remove],
  )

  const menu = useCallback(
    (row: ConversationRow) =>
      conversationRowMenu(row.pinned).map((a) => ({
        key: a.id,
        label: a.label,
        systemImage: a.systemImage,
        destructive: a.destructive,
        onPress: () => {
          if (a.id === 'pin') pin.mutate(row)
          else if (a.id === 'archive') archive.mutate(row)
          else if (a.id === 'delete') confirmDelete(row)
          else router.push(renamePath(row.id))
        },
      })),
    [archive, confirmDelete, pin],
  )

  const grouped = useMemo(() => groups(rows), [rows])
  const listRows = useMemo(() => flattenConversationGroups(grouped), [grouped])
  const empty = !!source.data && rows.length === 0

  const renderItem = useCallback(
    ({ item }: { item: ListRow }) => {
      if (item.kind === 'header') {
        return (
          <Text
            v="c1"
            weight="700"
            color="t3"
            style={{
              paddingTop: item.firstTitled ? spacing[4] : 22,
              paddingHorizontal: spacing[6],
              paddingBottom: spacing[2],
            }}
          >
            {item.title}
          </Text>
        )
      }
      return <ConversationItem row={item.row} width={width} menu={menu} cardBg={c.card} />
    },
    [c.card, menu, width],
  )

  const listEmpty = useMemo(
    () => (
      <PageEmpty reserve={LIST_EMPTY_RESERVE}>
        <Text v="b1" weight="700" color="t2" style={{ textAlign: 'center' }}>
          {q ? `“${q}”에 맞는 대화가 없어요` : '아직 대화가 없어요'}
        </Text>
        {!q ? <Button label="새 대화 시작" variant="secondary" size="pill" onPress={() => startNew(onClose)} style={{ marginTop: spacing[3] }} /> : null}
      </PageEmpty>
    ),
    [onClose, q],
  )

  const listFooter = useMemo(
    () => (
      <Pressable
        accessibilityRole="button"
        onPress={() => setArchivedView(true)}
        style={{ ...ROW, flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}
      >
        <Icon name="archive" size={18} color="t2" />
        <Text v="b2" weight="600" color="t2" style={{ flex: 1 }}>
          {ARCHIVED_TITLE}
        </Text>
        <Icon name="chev" size={16} color="t2" />
      </Pressable>
    ),
    [],
  )

  if (archivedView)
    return (
      <PageModal title={ARCHIVED_TITLE} onClose={() => setArchivedView(false)}>
        <View>
          {rows.map((r) => (
            <View key={r.id} style={{ ...ROW, flexDirection: 'row', alignItems: 'center', gap: spacing[3] }}>
              <Pressable accessibilityRole="button" onPress={() => router.push(`/chat/${r.id}`)} style={{ flex: 1, minWidth: 0 }}>
                <RowBody row={r} archived />
              </Pressable>
              <Button label={UNARCHIVE_LABEL} variant="secondary" size="sm" onPress={() => unarchive.mutate(r)} />
            </View>
          ))}
          <Note>{ARCHIVED_NOTE}</Note>
        </View>
      </PageModal>
    )

  return (
    <PageModal
      scroll={false}
      title="대화"
      onClose={onClose}
      right={<GlassButton actions={[{ icon: 'edit', label: '새 대화', onPress: () => startNew(onClose) }]} />}
    >
      <View style={{ flex: 1 }}>
        <View style={{ paddingTop: spacing[1], paddingHorizontal: spacing[5], paddingBottom: spacing[2] }}>
          <TextField variant="search" placeholder="대화 검색" value={q} onChangeText={setQ} returnKeyType="search" accessibilityLabel="대화 검색" />
        </View>
        {empty ? null : <View style={{ height: 6 }} />}
        <FlatList
          data={listRows}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom + spacing[6] }}
          ListEmptyComponent={empty ? listEmpty : undefined}
          ListFooterComponent={!q && rows.length > 0 ? listFooter : undefined}
        />
      </View>
    </PageModal>
  )
}
