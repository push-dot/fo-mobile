import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { ActivityTab, DocsTab, MyHeader, ProfileTab, type ActivitySub } from '@/features/my'
import { SegmentedControl } from '@/shared/components'
import { useColors } from '@/theme'

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

export default MyScreen
