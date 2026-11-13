import { Linking } from 'react-native'
import { clearCards, expireCard, freshPushBot, muteBot, resetBots, setBotPlan, setBots } from './bots'
import { grantReference, setAccount } from './chat'
import { pendingSocialPhone, unreadDeadline } from './home'
import { setBlockedByThem } from './me'
import { setMaterials } from './materials'
import { closeMoapay, fewBookmarks } from './postings'
import { setRules, type Rule } from './server'
import { emptyFeed } from './social'

// `kind:METHOD:path-regex`, e.g. fail:GET:postings or hang:POST:postings/.*/apply; `reset` drops every rule.
const toRule = (spec: string): Rule | null => {
  const [kind, method, ...path] = spec.split(':')
  if (kind !== 'hang' && kind !== 'fail' && kind !== 'empty') return null
  return { kind, method: method!, re: new RegExp(`^${path.join(':')}`) }
}

const MATERIAL_SET = /^materials:(?:(none|long)|(doc|bookmark|link):none)$/

// Tours reach states the fixtures can't hold through a link like push://social?mock=empty-feed (the router still opens the path).
// `mock=` takes comma-separated switches: empty-feed, unread-deadline (the 마감 임박 알림 arrives unread), phone-social (the phone screen opens as after a Google sign-in, PhoneInput), close-moapay (모아페이 백엔드 closes within a week), consent-on (참고 데이터 제공 already on), plan-ultra, credits-out (an ULTRA account / spent credits), payments-closed (chat/account says paymentsEnabled false: no buy button anywhere), few-materials (2 bookmarks, 2 documents, 1 link), blocked-by-them (오지현 and 최지우 blocked the viewer: their chats refuse messages, 최지우's hub offer sheet refuses), run:<chat token>, reset, or a rule (see toRule).
// Bot and material switches: bots:none (only the Push Bot), bots:long (AgentHomeLong), bots:limit (FREE at its limit), push:fresh (the Push Bot chat starts empty, on its onboarding chips), bot:<id>:muted,
// card:none (no bot waits on an answer), card:expired (모아페이's page-read card ran out, ChatBotStatusExpired), materials:none, materials:long, materials:<doc|bookmark|link>:none.
export const listenMockLinks = () =>
  Linking.addEventListener('url', ({ url }) => {
    const specs = decodeURIComponent(/[?&]mock=([^&#]*)/.exec(url)?.[1] ?? '').split(',').filter(Boolean)
    if (specs.includes('empty-feed')) emptyFeed()
    if (specs.includes('reset')) {
      setRules([])
      setAccount({ ultra: false, spent: false, closed: false, run: undefined })
      setBlockedByThem(false)
      resetBots()
      setMaterials('default')
    }
    if (specs.includes('bots:none')) setBots('none')
    if (specs.includes('bots:long')) setBots('long')
    if (specs.includes('bots:outcome')) setBots('outcome')
    if (specs.includes('bots:limit')) setBotPlan('FREE')
    for (const s of specs) {
      const muted = /^bot:(.+):muted$/.exec(s)
      if (muted) muteBot(muted[1]!)
      const materials = MATERIAL_SET.exec(s)
      if (materials) setMaterials((materials[1] ?? materials[2]) as Parameters<typeof setMaterials>[0])
    }
    if (specs.includes('push:fresh')) freshPushBot()
    if (specs.includes('card:none')) clearCards()
    if (specs.includes('card:expired')) expireCard()
    if (specs.includes('unread-deadline')) unreadDeadline()
    if (specs.includes('phone-social')) pendingSocialPhone()
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
    if (specs.includes('plan-ultra')) {
      setAccount({ ultra: true })
      setBotPlan('ULTRA')
    }
    if (specs.includes('credits-out')) setAccount({ spent: true })
    if (specs.includes('payments-closed')) setAccount({ closed: true })
    const next = specs.flatMap((s) => toRule(s) ?? [])
    if (next.length) setRules(next)
  })
