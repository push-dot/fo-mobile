import type { MenuSection } from '@/shared/components/menu-action'

export type PostsView = 'mine' | 'commented'

export const POSTS_VIEWS: { key: PostsView; label: string }[] = [
  { key: 'mine', label: '내가 쓴 글' },
  { key: 'commented', label: '댓글 단 글' },
]

export const postsTitle = (view: PostsView) => POSTS_VIEWS.find((v) => v.key === view)!.label

export const postsMenu = (view: PostsView, pick: (v: PostsView) => void): MenuSection[] => [
  {
    key: 'view',
    title: '보기',
    check: 'trailing',
    actions: POSTS_VIEWS.map((v) => ({ key: v.key, label: v.label, selected: v.key === view, onPress: () => pick(v.key) })),
  },
]
