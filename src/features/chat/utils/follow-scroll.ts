export type FollowScroll = 'instant' | 'animated' | 'fresh'

export const followScroll = (atBottom: boolean, working: boolean, reduceMotion: boolean): FollowScroll => {
  if (!atBottom) return 'fresh'
  if (working || reduceMotion) return 'instant'
  return 'animated'
}
