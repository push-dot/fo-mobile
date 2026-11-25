import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { LegendList } from '@legendapp/list/react-native'
import { Platform, View } from 'react-native'
import { materialDetailPath, materialLinkAddPath, type BotId } from '@/features/bots'
import { pickResume, showImportMenu, useImportRequest, useUpload } from '@/features/my'
import { useSearchQuery } from '@/features/search'
import { Button, GlassButton, Skeleton, Text, ToastHost, type MenuAction } from '@/shared/components'
import { XlBoardChrome } from '@/shared/components/xl-chrome'
import { spacing, useColors } from '@/theme'
import { useMaterials, useRefreshMaterials } from '../api/hooks'
import { ADD_LABEL, EMPTY, LIST_LOADING, LOAD_ERROR, MATERIALS_TITLE, SEARCH_EMPTY_BODY, type AddAction } from '../constants'
import type { Material, MaterialTab } from '../types'
import { listView, searchEmptyTitle, sendContextOf, type ListRow } from '../utils/material-view'
import { useConfirmDeleteMaterial } from './confirm-delete-material'
import { sendMaterial } from './send-material'
import { MaterialItem, SectionTitle } from './material-item'
import { MaterialsTabs } from './materials-tabs'
import { MaterialsSearch, useSearchRoom } from './materials-search'

const ios = Platform.OS === 'ios'

const runAdd = (action: AddAction) => {
  if (action === 'link') return router.push(materialLinkAddPath())
  if (action === 'upload') return showImportMenu()
  router.back()
  router.push('/jobs')
}

const Note = ({ title, body, action, alert, bottom }: { title: string; body: string; action?: { label: string; onPress: () => void }; alert?: boolean; bottom: number }) => (
  <View accessibilityRole={alert ? 'alert' : undefined} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingHorizontal: 36, paddingBottom: bottom }}>
    <Text v="h3" style={{ textAlign: 'center' }}>
      {title}
    </Text>
    <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
      {body}
    </Text>
    {action ? <Button label={action.label} variant="secondary" size="sm" onPress={action.onPress} style={{ marginTop: spacing[3] }} /> : null}
  </View>
)

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

export const MaterialsModal = ({ forBot }: { forBot?: string }) => {
  const c = useColors()
  const [tab, setTab] = useState<MaterialTab>('all')
  const { text, q, setText } = useSearchQuery()
  const bot = forBot as BotId | undefined
  const list = useMaterials({ tab, q, bot })
  const view = listView(list, tab, q)
  const context = sendContextOf(forBot)
  const now = new Date()
  const refresh = useRefreshMaterials()
  const room = useSearchRoom()

  const { start } = useUpload(refresh)
  useImportRequest(() => void pickResume().then((file) => file && start(file)))

  const onOpen = (m: Material) => router.push(materialDetailPath(m.kind, m.id, bot))
  const onSend = (m: Material) => sendMaterial(context, m)
  const confirmDelete = useConfirmDeleteMaterial(room.toast)
  const confirmRef = useRef(confirmDelete)
  useEffect(() => {
    confirmRef.current = confirmDelete
  })
  const onDelete = (m: Material) => confirmRef.current(m)
  const renderItem = ({ item }: { item: ListRow }) =>
    item.type === 'section' ? <SectionTitle section={item.section} count={item.count} /> : <MaterialItem material={item.material} now={now} onOpen={onOpen} onSend={onSend} onDelete={onDelete} />

  const addMenu: MenuAction[] = [
    { key: 'link', label: ADD_LABEL.link, systemImage: 'link', icon: 'link', onPress: () => runAdd('link') },
    { key: 'upload', label: ADD_LABEL.upload, systemImage: 'square.and.arrow.up', icon: 'up', onPress: () => runAdd('upload') },
  ]

  const body = (() => {
    switch (view.state) {
      case 'loading':
        return <Loading />
      case 'error':
        return <Note alert bottom={room.list} title={LOAD_ERROR.title} body={LOAD_ERROR.body} action={{ label: LOAD_ERROR.retry, onPress: list.refetch }} />
      case 'empty': {
        if (view.empty === 'search') return <Note bottom={room.list} title={searchEmptyTitle(q)} body={SEARCH_EMPTY_BODY} />
        const empty = EMPTY[view.empty]
        return <Note bottom={room.list} title={empty.title} body={empty.body} action={{ label: ADD_LABEL[empty.action], onPress: () => runAdd(empty.action) }} />
      }
      case 'list':
        return (
          <LegendList
            data={view.rows}
            keyExtractor={(row) => row.key}
            renderItem={renderItem}
            getItemType={(row) => row.type}
            recycleItems
            estimatedItemSize={72}
            onEndReached={list.loadMore}
            onEndReachedThreshold={0.5}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: room.list }}
          />
        )
    }
  })()

  return (
    <XlBoardChrome>
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
        {ios ? <ToastHost /> : null}
      </View>
    </XlBoardChrome>
  )
}
