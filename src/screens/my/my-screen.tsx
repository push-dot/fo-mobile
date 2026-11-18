import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { ActivityTab, DocsTab, MyHeader, ProfileTab, type ActivitySub } from '@/features/my'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import { FloatingHeader, SegmentedControl, useFloatingHeader } from '@/shared/components'
import { spacing, useColors } from '@/theme'

type Tab = 'profile' | 'docs' | 'activity'
const TABS: { key: Tab; label: string }[] = [
  { key: 'profile', label: '프로필' },
  { key: 'docs', label: '서류' },
  { key: 'activity', label: '내 활동' },
]
const SUBS: ActivitySub[] = ['applications', 'calendar', 'bookmarks', 'follows', 'posts']
const asTab = (t?: string): Tab => (TABS.some((x) => x.key === t) ? (t as Tab) : 'profile')
const asSub = (s?: string): ActivitySub =>
  SUBS.includes(s as ActivitySub) ? (s as ActivitySub) : 'applications'

const MyScreen = () => {
  const c = useColors()
  const { scrolled, onHeight, onScroll: onHeaderScroll, inset } = useFloatingHeader()
  // The glass tab row is drawn above the header's fade, so it fades itself out over its first 48pt of scroll instead of showing through the title.
  const [rowOpacity, setRowOpacity] = useState(1)
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    onHeaderScroll(e)
    setRowOpacity(Math.round(Math.max(0, 1 - e.nativeEvent.contentOffset.y / 48) * 8) / 8)
  }
  const params = useLocalSearchParams<{ tab?: string; sub?: string }>()
  const [tab, setTab] = useState<Tab>(asTab(params.tab))
  const [sub, setSub] = useState<ActivitySub>(asSub(params.sub))

  const [seen, setSeen] = useState(params)
  if (seen.tab !== params.tab || seen.sub !== params.sub) {
    setSeen(params)
    if (params.tab) setTab(asTab(params.tab))
    if (params.sub) setSub(asSub(params.sub))
  }

  const pick = (t: Tab) => {
    setRowOpacity(1)
    setTab(t)
    router.setParams({ tab: t })
  }
  const pickSub = (s: ActivitySub) => {
    setSub(s)
    router.setParams({ sub: s })
  }

  // The tab row scrolls away with the content; only the header floats.
  const lead = (
    <View pointerEvents={rowOpacity < 0.25 ? 'none' : 'auto'} style={{ paddingTop: spacing[1], paddingHorizontal: spacing[5], opacity: rowOpacity }}>
      <SegmentedControl items={TABS} value={tab} onChange={pick} />
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {tab === 'profile' ? (
        <ScrollView contentInsetAdjustmentBehavior="automatic" onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={{ paddingTop: inset }}>
          {lead}
          <ProfileTab />
        </ScrollView>
      ) : null}
      {tab === 'docs' ? <DocsTab top={inset} onScroll={onScroll} lead={lead} /> : null}
      {tab === 'activity' ? <ActivityTab sub={sub} onSub={pickSub} top={inset} onScroll={onScroll} lead={lead} /> : null}
      <FloatingHeader scrolled={scrolled} onHeight={onHeight}>
        <MyHeader />
      </FloatingHeader>
    </View>
  )
}

export default MyScreen
