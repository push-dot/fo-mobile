import type { MenuAction } from '@/shared/components/menu-action'
import { SAVE_COPY } from '../constants'

export const SAVED_POSTS_KEY = ['me', 'saved-posts'] as const

type Invalidator = { invalidateQueries: (arg: { queryKey: readonly string[] }) => Promise<unknown> }

export const invalidateAfterPostSaveToggle = (qc: Invalidator, id: string) =>
  Promise.all([qc.invalidateQueries({ queryKey: SAVED_POSTS_KEY }), qc.invalidateQueries({ queryKey: ['post', id] })])

export const saveMenuAction = (saved: boolean, onPress: () => void): MenuAction => ({
  key: 'save',
  label: saved ? SAVE_COPY.unsave : SAVE_COPY.save,
  systemImage: saved ? 'bookmark.fill' : 'bookmark',
  icon: 'bookmark',
  onPress,
})
