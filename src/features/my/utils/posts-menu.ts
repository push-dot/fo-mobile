import type { MyPostsSort } from '@push/api-client'
import type { MenuAction, MenuSection } from '@/shared/components/menu-action'

export type PostsView = 'mine' | 'commented' | 'saved'

const POSTS_VIEWS: (MenuAction & { key: PostsView })[] = [
  { key: 'mine', label: '내가 쓴 글', systemImage: 'square.and.pencil', icon: 'edit', onPress: () => {} },
  { key: 'commented', label: '댓글 단 글', systemImage: 'bubble.left', icon: 'chat', onPress: () => {} },
  { key: 'saved', label: '저장한 글', systemImage: 'bookmark', icon: 'bookmark', onPress: () => {} },
]

const POSTS_SORTS: (MenuAction & { key: MyPostsSort })[] = [
  { key: 'latest', label: '최신순', systemImage: 'clock', icon: 'clock', onPress: () => {} },
  { key: 'views', label: '조회 많은 순', systemImage: 'eye', icon: 'eye-2', onPress: () => {} },
  { key: 'comments', label: '댓글 많은 순', systemImage: 'bubble.left', icon: 'chat', onPress: () => {} },
]

export const postsTitle = (view: PostsView) => POSTS_VIEWS.find((v) => v.key === view)!.label

export const postsMenu = (
  current: { view: PostsView; sort: MyPostsSort },
  pick: { view: (v: PostsView) => void; sort: (s: MyPostsSort) => void },
): MenuSection[] => [
  {
    key: 'view',
    title: '보기',
    check: 'trailing',
    actions: POSTS_VIEWS.map((v) => ({ ...v, selected: v.key === current.view, onPress: () => pick.view(v.key) })),
  },
  {
    key: 'sort',
    title: '정렬',
    check: 'trailing',
    actions: POSTS_SORTS.map((s) => ({ ...s, selected: s.key === current.sort, onPress: () => pick.sort(s.key) })),
  },
]
