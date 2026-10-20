import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { useColors } from '../../theme'
import { SegmentedControl } from '../../ui'
import { ActivityTab, type ActivitySub } from './ActivityTab'
import { DocsTab } from './DocsTab'
import { MyHeader } from './parts'
import { ProfileTab } from './ProfileTab'

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

/** 마이: 프로필 | 서류 | 내 활동. Other areas deep-link with `?tab=activity&sub=bookmarks`. */
export function MyScreen() {
  const c = useColors()
  const params = useLocalSearchParams<{ tab?: string; sub?: string }>()
  const [tab, setTab] = useState<Tab>(asTab(params.tab))
  const [sub, setSub] = useState<ActivitySub>(asSub(params.sub))

  // Apply new deep-link params (adjusting state during render, not in an effect).
  const [seen, setSeen] = useState(params)
  if (seen.tab !== params.tab || seen.sub !== params.sub) {
    setSeen(params)
    if (params.tab) setTab(asTab(params.tab))
    if (params.sub) setSub(asSub(params.sub))
  }

  // Keep params in sync so a later deep link with the same values still applies.
  const pick = (t: Tab) => {
    setTab(t)
    router.setParams({ tab: t })
  }
  const pickSub = (s: ActivitySub) => {
    setSub(s)
    router.setParams({ sub: s })
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <MyHeader />
      <View style={{ paddingTop: 4, paddingHorizontal: 20 }}>
        <SegmentedControl items={TABS} value={tab} onChange={pick} />
      </View>
      {tab === 'profile' ? (
        <ScrollView>
          <ProfileTab />
        </ScrollView>
      ) : null}
      {tab === 'docs' ? <DocsTab /> : null}
      {tab === 'activity' ? <ActivityTab sub={sub} onSub={pickSub} /> : null}
    </View>
  )
}
