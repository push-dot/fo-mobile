import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { monthDay } from '@push/shared'
import { Badge, Chip, ChipRow, Icon, Text } from '@/shared/components'
import { spacing } from '../../../theme'
import {
  useAppliedApplications,
  useMyCommentedPosts,
  useMyFollowers,
  useMyFollows,
  useMyPosts,
} from '../api/hooks'
import { ACTIVITY_LIST_PAD, FOLLOW_PREVIEW, POST_CATEGORIES, POST_PREVIEW } from '../constants'
import type { ActivitySub, ScrollUnderBar } from '../types'
import { appliedOnly, commentedSee, emptyCta, followSeeAll, followerSee, postsSeeAll, postedAt, stageBadge, stageTone } from '../utils'
import ActivityBookmarks from './activity-bookmarks'
import CalendarView from './calendar-view'
import Empty, { TAB_EMPTY_LIFT } from './empty'
import ListSkeleton from './list-skeleton'
import ListTitle from './list-title'
import Logo from './logo'
import PersonRow from './person-row'
import Row from './row'
import SectionHead from './section-head'

const EMPTY_LIFT = TAB_EMPTY_LIFT - ACTIVITY_LIST_PAD

const SUBS: { key: ActivitySub; label: string }[] = [
  { key: 'applications', label: '지원활동' },
  { key: 'calendar', label: '캘린더' },
  { key: 'bookmarks', label: '북마크' },
  { key: 'follows', label: '팔로우' },
  { key: 'posts', label: '게시글' },
]

const Applications = () => {
  const { data, isLoading } = useAppliedApplications()
  if (isLoading) return <ListSkeleton />
  const list = appliedOnly(data?.data ?? [])
  return (
    <>
      {list.length === 0 ? (
        <Empty
          text={emptyCta('applications').title}
          lift={EMPTY_LIFT}
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
          <View style={styles.body}>
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

const SeeAll = ({ label, onPress, divided }: { label: string; onPress: () => void; divided?: boolean }) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={[divided && styles.seeAllDivided, styles.seeAll]}>
    <Text v="b2" weight="600" color="t2">
      {label}
    </Text>
  </Pressable>
)

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
          lift={EMPTY_LIFT}
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
      {people.length || followerCount ? (
        <SeeAll
          divided
          label={followerSee(followerCount)}
          onPress={() => router.push({ pathname: '/activity/follows', params: { box: 'followers' } })}
        />
      ) : null}
    </>
  )
}

const Posts = () => {
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
          lift={EMPTY_LIFT}
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
          style={({ pressed }) => [styles.post, pressed && styles.postPressed]}
        >
          <Text v="c2" color="t3">
            {POST_CATEGORIES.find((k) => k.key === p.category)?.label} · {postedAt(p.createdAt)}
          </Text>
          <Text v="b1" weight="700" numberOfLines={1}>
            {p.title}
          </Text>
          <View style={styles.stats}>
            <View style={styles.stat}>
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
      {posts.length || commentCount ? (
        <SeeAll
          label={commentedSee(commentCount)}
          onPress={() => router.push({ pathname: '/activity/posts', params: { box: 'commented' } })}
        />
      ) : null}
    </>
  )
}

const ActivityTab = ({ sub, onSub, top = 0, onScroll, lead }: { sub: ActivitySub; onSub: (s: ActivitySub) => void } & ScrollUnderBar) => {
  return (
    <ScrollView style={styles.scroll} contentInsetAdjustmentBehavior="automatic" onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={styles.content(top)}>
      {lead}
      <ChipRow paddingTop={spacing[4]}>
        {SUBS.map((s) => (
          <Chip key={s.key} label={s.label} on={s.key === sub} onPress={() => onSub(s.key)} />
        ))}
      </ChipRow>
      {sub === 'applications' ? <Applications /> : null}
      {sub === 'calendar' ? <CalendarView /> : null}
      {sub === 'bookmarks' ? <ActivityBookmarks /> : null}
      {sub === 'follows' ? <Follows /> : null}
      {sub === 'posts' ? <Posts /> : null}
    </ScrollView>
  )
}

const styles = StyleSheet.create((theme) => ({
  body: { flex: 1, minWidth: 0 },
  seeAll: { paddingVertical: theme.spacing[4], paddingHorizontal: theme.spacing[5] },
  seeAllDivided: { marginTop: theme.spacing[1], borderTopWidth: 1, borderTopColor: theme.colors.line },
  post: {
    gap: theme.spacing[1],
    paddingVertical: theme.spacing[3],
    paddingHorizontal: theme.spacing[5],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
    backgroundColor: 'transparent',
  },
  postPressed: { backgroundColor: theme.colors.fill },
  stats: { flexDirection: 'row', gap: theme.spacing[3] },
  stat: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[1] },
  scroll: { backgroundColor: theme.colors.bg },
  content: (top: number) => ({ flexGrow: 1, paddingTop: top, paddingBottom: ACTIVITY_LIST_PAD }),
}))

export default ActivityTab
