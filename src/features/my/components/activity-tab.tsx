import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { POST_CATEGORIES, stageBadge, type Profile } from '@push/api-client'
import { careerLabel, monthDay } from '@push/shared'
import { Badge, Chip, Icon, SegmentedControl, Text } from '@/shared/components'
import { useColors } from '../../../theme'
import {
  useFollowToggle,
  useMyApplications,
  useMyBookmarks,
  useMyCommentedPosts,
  useMyFollowers,
  useMyFollows,
  useMyPosts,
} from '../api/hooks'
import type { ActivitySub } from '../types'
import { followState, stageTone, timeAgo } from '../utils'
import Avatar from './avatar'
import CalendarView from './calendar-view'
import Empty from './empty'
import ListTitle from './list-title'
import Logo from './logo'
import Row from './row'

const SUBS: { key: ActivitySub; label: string }[] = [
  { key: 'applications', label: '지원활동' },
  { key: 'calendar', label: '캘린더' },
  { key: 'bookmarks', label: '북마크' },
  { key: 'follows', label: '팔로우' },
  { key: 'posts', label: '게시글' },
]

const Loading = () => <ActivityIndicator style={{ marginTop: 40 }} />

const Applications = () => {
  const { data, isLoading } = useMyApplications()
  if (isLoading) return <Loading />
  const list = data?.data ?? []
  return (
    <>
      <ListTitle title="지원한 공고" count={data?.page.total ?? list.length} />
      {list.length === 0 ? <Empty text="아직 지원한 공고가 없어요." /> : null}
      {list.map((a) => (
        <Row
          key={a.id}
          label={`${a.company} ${a.title} ${stageBadge(a.stage)}`}
          onPress={() => router.push(`/postings/${a.jobId}`)}
        >
          <Logo name={a.company} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text v="b1" weight="700" numberOfLines={1}>
              {a.title}
            </Text>
            <Text v="c1" color="t3" numberOfLines={1}>
              {a.company} · {monthDay(a.appliedAt ?? a.createdAt)}
            </Text>
          </View>
          <Badge label={stageBadge(a.stage)} tone={stageTone(a.stage)} />
        </Row>
      ))}
    </>
  )
}

const Bookmarks = () => {
  const c = useColors()
  const { query, unbookmark } = useMyBookmarks()
  const { data, isLoading } = query
  if (isLoading) return <Loading />
  const list = (data?.data ?? []).filter(
    (p) => !(unbookmark.isPending && unbookmark.variables?.id === p.id),
  )
  return (
    <>
      <ListTitle title="북마크한 공고" count={list.length} />
      {list.length === 0 ? <Empty text="북마크한 공고가 없어요." /> : null}
      {list.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={`${p.company} ${p.title}`}
          onPress={() => router.push(`/postings/${p.id}`)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 14,
            paddingVertical: 12,
            paddingHorizontal: 20,
          }}
        >
          <Logo name={p.company} size={56} />
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <Text v="c1" weight="600" color="t3">
              {p.company}
            </Text>
            <Text v="b1" weight="700" numberOfLines={1}>
              {p.title}
            </Text>
            <Text v="c1" color="t3">
              {p.location} · {careerLabel(p)}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="북마크 해제"
            accessibilityState={{ selected: true }}
            onPress={() => unbookmark.mutate(p)}
            style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="bookmark" size={22} color={c.acText} filled />
          </Pressable>
        </Pressable>
      ))}
    </>
  )
}

const PersonRow = ({ p, known }: { p: Profile; known: boolean | undefined }) => {
  const c = useColors()
  const [picked, setPicked] = useState<boolean>()
  const following = picked ?? known
  const toggle = useFollowToggle(p.userId, setPicked)
  return (
    <Row label={p.displayName} onPress={() => router.push(`/profiles/${p.userId}`)}>
      <Avatar name={p.displayName} url={p.avatarUrl} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b1" weight="700">
          {p.displayName}
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          {p.headline}
        </Text>
      </View>
      {following === undefined ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: following }}
          onPress={() => toggle.mutate(!following)}
          hitSlop={5}
          style={{
            height: 34,
            borderRadius: 17,
            paddingHorizontal: 14,
            justifyContent: 'center',
            backgroundColor: following ? c.fill : c.ac,
          }}
        >
          <Text v="c1" weight="700" style={{ fontSize: 14, color: following ? c.t1 : '#FFFFFF' }}>
            {following ? '팔로잉' : '팔로우'}
          </Text>
        </Pressable>
      )}
    </Row>
  )
}

const Follows = () => {
  const [tab, setTab] = useState<'following' | 'followers'>('following')
  const following = useMyFollows()
  const followers = useMyFollowers()
  const q = tab === 'following' ? following : followers
  const n = (r: typeof following) => r.data?.page.total ?? r.data?.data.length ?? 0
  const known = (userId: string) =>
    tab === 'following' ? true : followState(following.data, userId)
  return (
    <>
      <View style={{ paddingTop: 14, paddingBottom: 4, paddingHorizontal: 20 }}>
        <SegmentedControl
          items={[
            { key: 'following', label: `팔로잉 ${n(following)}` },
            { key: 'followers', label: `팔로워 ${n(followers)}` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {q.isLoading ? <Loading /> : null}
      {q.data?.data.length === 0 ? (
        <Empty
          text={
            tab === 'following'
              ? '아직 팔로우한 사람이 없어요.'
              : '아직 나를 팔로우한 사람이 없어요.'
          }
        />
      ) : null}
      {q.data?.data.map((p) => (
        <PersonRow key={`${tab}-${p.userId}`} p={p} known={known(p.userId)} />
      ))}
    </>
  )
}

const Posts = () => {
  const c = useColors()
  const [tab, setTab] = useState<'mine' | 'commented'>('mine')
  const mine = useMyPosts()
  const commented = useMyCommentedPosts()
  const q = tab === 'mine' ? mine : commented
  const n = (r: typeof mine) => r.data?.page.total ?? r.data?.data.length ?? 0
  return (
    <>
      <View style={{ paddingTop: 14, paddingBottom: 4, paddingHorizontal: 20 }}>
        <SegmentedControl
          items={[
            { key: 'mine', label: `내가 쓴 글 ${n(mine)}` },
            { key: 'commented', label: `댓글 단 글 ${n(commented)}` },
          ]}
          value={tab}
          onChange={setTab}
        />
      </View>
      {q.isLoading ? <Loading /> : null}
      {q.data?.data.length === 0 ? (
        <Empty text={tab === 'mine' ? '아직 쓴 글이 없어요.' : '아직 댓글 단 글이 없어요.'} />
      ) : null}
      {q.data?.data.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          onPress={() => router.push(`/posts/${p.id}`)}
          style={({ pressed }) => ({
            gap: 4,
            paddingVertical: 14,
            paddingHorizontal: 20,
            borderBottomWidth: 1,
            borderBottomColor: c.line,
            backgroundColor: pressed ? c.fill : 'transparent',
          })}
        >
          <Text v="c2" color="t3">
            {POST_CATEGORIES.find((k) => k.key === p.category)?.label} · {timeAgo(p.createdAt)}
          </Text>
          <Text v="b1" weight="700" numberOfLines={1}>
            {p.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Icon name="chat" size={14} color="t3" />
              <Text v="c1" color="t3">
                댓글 {p.commentCount}
              </Text>
            </View>
            <Text v="c1" color="t3">
              조회 {p.viewCount}
            </Text>
          </View>
        </Pressable>
      ))}
    </>
  )
}

const ActivityTab = ({ sub, onSub }: { sub: ActivitySub; onSub: (s: ActivitySub) => void }) => {
  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingTop: 18, paddingBottom: 4, paddingHorizontal: 20 }}
      >
        {SUBS.map((s) => (
          <Chip key={s.key} label={s.label} on={s.key === sub} onPress={() => onSub(s.key)} />
        ))}
      </ScrollView>
      {sub === 'applications' ? <Applications /> : null}
      {sub === 'calendar' ? <CalendarView /> : null}
      {sub === 'bookmarks' ? <Bookmarks /> : null}
      {sub === 'follows' ? <Follows /> : null}
      {sub === 'posts' ? <Posts /> : null}
    </ScrollView>
  )
}

export default ActivityTab
