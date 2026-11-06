import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { POST_CATEGORIES, stageBadge } from '@push/api-client'
import { careerLabel, monthDay } from '@push/shared'
import { Badge, Chip, Icon, Text } from '@/shared/components'
import { spacing, useColors } from '../../../theme'
import {
  useMyApplications,
  useMyBookmarks,
  useMyCommentedPosts,
  useMyFollowers,
  useMyFollows,
  useMyPosts,
} from '../api/hooks'
import { FOLLOW_PREVIEW, POST_PREVIEW } from '../constants'
import type { ActivitySub } from '../types'
import { commentedSee, emptyCta, followSeeAll, followerSee, postsSeeAll, postedAt, stageTone } from '../utils'
import CalendarView from './calendar-view'
import Empty from './empty'
import ListSkeleton from './list-skeleton'
import ListTitle from './list-title'
import Logo from './logo'
import PersonRow from './person-row'
import Row from './row'
import SectionHead from './section-head'


const SUBS: { key: ActivitySub; label: string }[] = [
  { key: 'applications', label: '지원활동' },
  { key: 'calendar', label: '캘린더' },
  { key: 'bookmarks', label: '북마크' },
  { key: 'follows', label: '팔로우' },
  { key: 'posts', label: '게시글' },
]

const Applications = () => {
  const { data, isLoading } = useMyApplications()
  if (isLoading) return <ListSkeleton />
  const list = data?.data ?? []
  return (
    <>
      {list.length === 0 ? (
        <Empty
          text={emptyCta('applications').title}
          action={emptyCta('applications').action}
          onAction={() => router.push(emptyCta('applications').href)}
        />
      ) : (
        <ListTitle title="지원한 공고" count={data?.page.total ?? list.length} />
      )}
      {list.map((a) => (
        <Row
          key={a.id}
          label={`${a.company} ${a.title} ${stageBadge(a.stage)}`}
          onPress={() => router.push(`/activity/applications/${a.id}`)}
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
  if (isLoading) return <ListSkeleton />
  const list = (data?.data ?? []).filter(
    (p) => !(unbookmark.isPending && unbookmark.variables?.id === p.id),
  )
  return (
    <>
      {list.length === 0 ? (
        <Empty
          text={emptyCta('bookmarks').title}
          action={emptyCta('bookmarks').action}
          onAction={() => router.push(emptyCta('bookmarks').href)}
        />
      ) : (
        <ListTitle title="북마크한 공고" count={data?.page.total ?? list.length} />
      )}
      {list.map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          accessibilityLabel={`${p.company} ${p.title}`}
          onPress={() => router.push(`/postings/${p.id}`)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacing[4],
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[5],
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
            <Icon name="bookmark" size={20} color={c.acText} filled />
          </Pressable>
        </Pressable>
      ))}
    </>
  )
}

const SeeAll = ({ label, onPress }: { label: string; onPress: () => void }) => {
  const c = useColors()
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={{ marginTop: spacing[1], borderTopWidth: 1, borderTopColor: c.line, paddingVertical: spacing[4], paddingHorizontal: spacing[5] }}
    >
      <Text v="b2" weight="600" color="t2">
        {label}
      </Text>
    </Pressable>
  )
}

const Follows = () => {
  const following = useMyFollows()
  const followers = useMyFollowers()
  const people = following.data?.data ?? []
  const followingCount = following.data?.page.total ?? people.length
  const followerCount = followers.data?.page.total ?? followers.data?.data.length ?? 0
  return (
    <>
      {following.isLoading ? <ListSkeleton /> : null}
      {people.length === 0 && !following.isLoading ? (
        <Empty
          text={emptyCta('follows').title}
          action={emptyCta('follows').action}
          onAction={() => router.push(emptyCta('follows').href)}
        />
      ) : (
        <SectionHead
          title="팔로잉"
          link={followSeeAll(followingCount)}
          onLink={() => router.push({ pathname: '/activity/follows', params: { box: 'following' } })}
        />
      )}
      {people.slice(0, FOLLOW_PREVIEW).map((p) => (
        <PersonRow key={p.userId} p={p} known />
      ))}
      <SeeAll
        label={followerSee(followerCount)}
        onPress={() => router.push({ pathname: '/activity/follows', params: { box: 'followers' } })}
      />
    </>
  )
}

const Posts = () => {
  const c = useColors()
  const mine = useMyPosts()
  const commented = useMyCommentedPosts()
  const posts = mine.data?.data ?? []
  const postCount = mine.data?.page.total ?? posts.length
  const commentCount = commented.data?.page.total ?? commented.data?.data.length ?? 0
  return (
    <>
      {mine.isLoading ? <ListSkeleton /> : null}
      {posts.length === 0 && !mine.isLoading ? (
        <Empty
          text={emptyCta('posts').title}
          action={emptyCta('posts').action}
          onAction={() => router.push(emptyCta('posts').href)}
        />
      ) : (
        <SectionHead
          title="내가 쓴 글"
          link={postsSeeAll(postCount)}
          onLink={() => router.push({ pathname: '/activity/posts', params: { box: 'mine' } })}
        />
      )}
      {posts.slice(0, POST_PREVIEW).map((p) => (
        <Pressable
          key={p.id}
          accessibilityRole="button"
          onPress={() => router.push(`/posts/${p.id}`)}
          style={({ pressed }) => ({
            gap: spacing[1],
            paddingVertical: spacing[3],
            paddingHorizontal: spacing[5],
            borderBottomWidth: 1,
            borderBottomColor: c.line,
            backgroundColor: pressed ? c.fill : 'transparent',
          })}
        >
          <Text v="c2" color="t3">
            {POST_CATEGORIES.find((k) => k.key === p.category)?.label} · {postedAt(p.createdAt)}
          </Text>
          <Text v="b1" weight="700" numberOfLines={1}>
            {p.title}
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[1] }}>
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
      <SeeAll
        label={commentedSee(commentCount)}
        onPress={() => router.push({ pathname: '/activity/posts', params: { box: 'commented' } })}
      />
    </>
  )
}

const ActivityTab = ({ sub, onSub }: { sub: ActivitySub; onSub: (s: ActivitySub) => void }) => {
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0 }}
        contentContainerStyle={{ gap: spacing[2], paddingTop: spacing[5], paddingBottom: spacing[1], paddingHorizontal: spacing[5] }}
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
