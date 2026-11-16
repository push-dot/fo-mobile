import type { MenuAction } from '@/shared/components/menu-action'
import { SAVE_COPY } from '../constants'

export const SAVED_POSTS_KEY = ['me', 'saved-posts'] as const

type Invalidator = { invalidateQueries: (arg: { queryKey: readonly string[] }) => Promise<unknown> }

/** The 저장한 글 lists and the saved ids behind the ⋯ menu share the ['me', 'saved-posts'] prefix. */
export const invalidateAfterPostSaveToggle = (qc: Invalidator) => qc.invalidateQueries({ queryKey: SAVED_POSTS_KEY })

export const saveMenuAction = (saved: boolean, onPress: () => void): MenuAction => ({
  key: 'save',
  label: saved ? SAVE_COPY.unsave : SAVE_COPY.save,
  systemImage: saved ? 'bookmark.fill' : 'bookmark',
  icon: 'bookmark',
  onPress,
})
