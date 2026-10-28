import type { ListEnvelope, Profile } from '@push/api-client'

export const followState = (follows: ListEnvelope<Profile> | undefined, userId: string) => {
  if (!follows) return undefined
  if (follows.data.some((p) => p.userId === userId)) return true
  return follows.page.hasMore ? undefined : false
}
