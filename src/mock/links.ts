import { Linking } from 'react-native'
import { grantReference, setAccount } from './chat'
import { unreadDeadline } from './home'
import { setBlockedByThem } from './me'
import { closeMoapay, fewBookmarks } from './postings'
import { setRules, type Rule } from './server'
import { emptyFeed } from './social'

// `kind:METHOD:path-regex`, e.g. fail:GET:postings or hang:POST:postings/.*/apply; `reset` drops every rule.
const toRule = (spec: string): Rule | null => {
  const [kind, method, ...path] = spec.split(':')
  if (kind !== 'hang' && kind !== 'fail' && kind !== 'empty') return null
  return { kind, method: method!, re: new RegExp(`^${path.join(':')}`) }
}

// Tours reach states the fixtures can't hold through a link like push://social?mock=empty-feed (the router still opens the path).
// `mock=` takes comma-separated switches: empty-feed, unread-deadline (the 마감 임박 알림 arrives unread), close-moapay (모아페이 백엔드 closes within a week), consent-on (참고 데이터 제공 already on), plan-ultra, credits-out (an ULTRA account / spent credits), few-materials (2 bookmarks, 2 documents, 1 link), blocked-by-them (오지현 and 최지우 blocked the viewer: their chats refuse messages, 최지우's hub offer sheet refuses), run:<chat token>, reset, or a rule (see toRule).
export const listenMockLinks = () =>
  Linking.addEventListener('url', ({ url }) => {
    const specs = decodeURIComponent(/[?&]mock=([^&#]*)/.exec(url)?.[1] ?? '').split(',').filter(Boolean)
    if (specs.includes('empty-feed')) emptyFeed()
    if (specs.includes('reset')) {
      setRules([])
      setAccount({ ultra: false, spent: false, run: undefined })
      setBlockedByThem(false)
    }
    if (specs.includes('unread-deadline')) unreadDeadline()
    if (specs.includes('blocked-by-them')) setBlockedByThem(true)
    if (specs.includes('close-moapay')) closeMoapay()
    if (specs.includes('consent-on')) grantReference()
    if (specs.includes('few-materials')) {
      setAccount({ few: true })
      fewBookmarks()
    }
    // `run:err-other` plays that chat token for the next messages (see pick in chat.ts).
    const run = specs.find((s) => s.startsWith('run:'))
    if (run) setAccount({ run: run.slice(4) })
    if (specs.includes('plan-ultra')) setAccount({ ultra: true })
    if (specs.includes('credits-out')) setAccount({ spent: true })
    const next = specs.flatMap((s) => toRule(s) ?? [])
    if (next.length) setRules(next)
  })
