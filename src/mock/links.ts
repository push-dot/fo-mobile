import { Linking } from 'react-native'
import { emptyFeed } from './social'

// Tours reach states the fixtures can't hold through a link like push://social?mock=empty-feed (the router still opens the path).
export const listenMockLinks = () =>
  Linking.addEventListener('url', ({ url }) => {
    if (url.includes('mock=empty-feed')) emptyFeed()
  })
