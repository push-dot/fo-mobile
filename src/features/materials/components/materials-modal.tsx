import { router } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { FlatList, Platform, View, type ListRenderItem } from 'react-native'
import { materialDetailPath, materialLinkAddPath, type BotId } from '@/features/bots'
import { pickResume, showImportMenu, useImportRequest, useUpload } from '@/features/my'
import { useSearchQuery } from '@/features/search'
import { Button, GlassButton, Skeleton, Text, ToastHost, showToast, type MenuAction } from '@/shared/components'
import { sheetHeaderTop } from '@/shared/navigation'
import { spacing, useColors } from '@/theme'
import { useMaterials, useRefreshMaterials } from '../api/hooks'
import { ADD_LABEL, EMPTY, LIST_LOADING, LOAD_ERROR, MATERIALS_TITLE, SEARCH_EMPTY_BODY, UPLOADED, type AddAction } from '../constants'
import type { Material, MaterialTab, SendContext } from '../types'
import { listView, searchEmptyTitle, sendContextOf, type ListRow } from '../utils/material-view'
import { sendMaterial } from './send-material'
import { MaterialItem, SectionTitle } from './material-item'
import { MaterialsTabs } from './materials-tabs'
import { MaterialsSearch, useSearchRoom } from './materials-search'

const ios = Platform.OS === 'ios'

/** What the + menu and the empty states' buttons open. 서류 올리기 opens UploadPick, as 마이 › 서류 does. */
const runAdd = (action: AddAction) => {
  if (action === 'link') return router.push(materialLinkAddPath())
  if (action === 'upload') return showImportMenu()
  router.back()
  router.push('/jobs')
}

/** RN has no `text-wrap: balance`; this width rebuilds the three lines MaterialsEmpty draws for its body. */
const NOTE_BODY_WIDTH = 252
/** The boards centre the note in the body, a little above the middle (the search field sits under it). */
const NOTE_RESERVE = 40

/** `.emp`: MaterialsEmpty*, MaterialsSearchEmpty, MaterialsError. */
const Note = ({ title, body, action, alert }: { title: string; body: string; action?: { label: string; onPress: () => void }; alert?: boolean }) => (
  <View accessibilityRole={alert ? 'alert' : undefined} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingHorizontal: 36, paddingBottom: NOTE_RESERVE }}>
    <Text v="h3" style={{ textAlign: 'center' }}>
      {title}
    </Text>
    <Text v="b2" color="t3" style={{ textAlign: 'center', maxWidth: NOTE_BODY_WIDTH }}>
      {body}
    </Text>
    {action ? <Button label={action.label} variant="secondary" size="sm" onPress={action.onPress} style={{ marginTop: spacing[3] }} /> : null}
  </View>
)

/** MaterialsLoading: a section title and seven rows, widths as drawn. */
const LINE_WIDTHS = [
  [170, 130],
  [140, 160],
  [190, 120],
  [120, 150],
  [160, 140],
  [150, 110],
  [180, 150],
] as const

const Loading = () => (
  <View accessible accessibilityRole="progressbar" accessibilityLabel={LIST_LOADING}>
    <View style={{ paddingTop: 18, paddingBottom: 6, paddingHorizontal: spacing[5] }}>
      <Skeleton width={40} height={12} />
    </View>
    {LINE_WIDTHS.map(([title, sub], i) => (
      <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: 68, paddingVertical: 10, paddingLeft: spacing[5], paddingRight: spacing[4] }}>
        <Skeleton width={44} height={44} radius={12} />
        <View style={{ flex: 1, gap: spacing[2] }}>
          <Skeleton width={title} height={14} />
          <Skeleton width={sub} height={12} />
        </View>
        <Skeleton width={96} height={34} radius={17} />
      </View>
    ))}
  </View>
)

/**
 * The 자료 modal (Materials and its states). `forBot` is the bot whose profile opened it: the list keeps only that bot's
 * materials (MaterialsFromProfile) and 보내기 attaches there.
 */
export const MaterialsModal = ({ forBot }: { forBot?: string }) => {
  const c = useColors()
  const [tab, setTab] = useState<MaterialTab>('all')
  const { text, q, setText } = useSearchQuery()
  const bot = forBot as BotId | undefined
  const list = useMaterials({ tab, q, bot })
  const view = listView(list, tab, q)
  const context = useMemo(() => sendContextOf(forBot), [forBot])
  const now = useMemo(() => new Date(), [])
  const refresh = useRefreshMaterials()
  const room = useSearchRoom()

  const { start } = useUpload(() => {
    refresh()
    showToast({ message: UPLOADED, tone: 'success', bottom: room.toast })
  })
  useImportRequest(() => void pickResume().then((file) => file && start(file)))

  const onOpen = useCallback((m: Material) => router.push(materialDetailPath(m.kind, m.id, bot)), [bot])
  const onSend = useCallback((m: Material) => sendMaterial(context, m), [context])
  const renderItem = useCallback<ListRenderItem<ListRow>>(
    ({ item }) => (item.type === 'section' ? <SectionTitle section={item.section} count={item.count} /> : <MaterialItem material={item.material} now={now} onOpen={onOpen} onSend={onSend} />),
    [now, onOpen, onSend],
  )

  const addMenu: MenuAction[] = [
    { key: 'link', label: ADD_LABEL.link, systemImage: 'link', icon: 'link', onPress: () => runAdd('link') },
    { key: 'upload', label: ADD_LABEL.upload, systemImage: 'square.and.arrow.up', icon: 'up', onPress: () => runAdd('upload') },
  ]

  const body = (() => {
    switch (view.state) {
      case 'loading':
        return <Loading />
      case 'error':
        return <Note alert title={LOAD_ERROR.title} body={LOAD_ERROR.body} action={{ label: LOAD_ERROR.retry, onPress: list.refetch }} />
      case 'empty': {
        if (view.empty === 'search') return <Note title={searchEmptyTitle(q)} body={SEARCH_EMPTY_BODY} />
        const empty = EMPTY[view.empty]
        return <Note title={empty.title} body={empty.body} action={{ label: ADD_LABEL[empty.action], onPress: () => runAdd(empty.action) }} />
      }
      case 'list':
        return (
          <FlatList
            data={view.rows}
            keyExtractor={(row) => row.key}
            renderItem={renderItem}
            onEndReached={list.loadMore}
            onEndReachedThreshold={0.5}
            initialNumToRender={12}
            windowSize={7}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: room.list }}
          />
        )
    }
  })()

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingTop: 14, paddingHorizontal: spacing[4], paddingBottom: spacing[1] }}>
        <GlassButton circle iconSize={20} actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
        <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
          {MATERIALS_TITLE}
        </Text>
        <GlassButton circle actions={[{ icon: 'plus', label: '자료 추가', menu: addMenu }]} />
      </View>
      <View style={{ paddingTop: 6, paddingHorizontal: spacing[4], paddingBottom: spacing[1] }}>
        <MaterialsTabs value={tab} onChange={setTab} />
      </View>
      <View style={{ flex: 1 }}>{body}</View>
      <MaterialsSearch value={text} onChange={setText} />
      {/* iOS: the root ToastHost sits under this modal; Android shows the root one. */}
      {ios ? <ToastHost /> : null}
    </View>
  )
}
