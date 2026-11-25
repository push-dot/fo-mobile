import { Image, Linking } from 'react-native'
import { DESIGN_SOURCES, allowSites, emptyBot, fixtureOf, muteBot, readBot, resetBots, seedThread, setBotPlan, setBots } from './bots'
import { resetDeadlineEvents } from './calendar-deadlines'
import { setAccount } from './chat'
import { grantReference } from './chat-state'
import { hidePhonePad, pendingSocialPhone, unreadDeadline } from './home'
import { lateSpec } from './late-spec'
import { longIntro, setBlockedByThem } from './me'
import { setMaterials } from './materials'
import { closeMoapay, fewBookmarks } from './postings'
import { setRules, type Rule } from './server'
import { emptyFeed } from './social'

/* eslint-disable @typescript-eslint/no-require-imports */
const chat = () => require('../features/chat') as typeof import('../features/chat')
const infra = () => require('../shared/infrastructure') as typeof import('../shared/infrastructure')
const queryClient = () => (require('../providers/query-client') as typeof import('../providers/query-client')).queryClient
/* eslint-enable @typescript-eslint/no-require-imports */

const toRule = (spec: string): Rule | null => {
  const [kind, method, ...path] = spec.split(':')
  if (kind !== 'hang' && kind !== 'fail' && kind !== 'empty') return null
  return { kind, method: method!, re: new RegExp(`^${path.join(':')}`) }
}

const photo = (module: number, fileName: string) => {
  const source = Image.resolveAssetSource(module)
  if (!source) throw new Error(`mock photo ${fileName} did not resolve`)
  return { uri: source.uri, fileName, mimeType: 'image/png', fileSize: 100_000, width: source.width ?? 1024, height: source.height ?? 1024 }
}

const HUGE_FILE = { uri: 'file:///mock/포트폴리오_전체.pdf', name: '포트폴리오_전체.pdf', mimeType: 'application/pdf', size: 25_000_000, lastModified: 0 }
const CAREER_FILE = { uri: 'file:///mock/경력기술서_결제플랫폼.pdf', name: '경력기술서_결제플랫폼.pdf', mimeType: 'application/pdf', size: 1_800_000, lastModified: 0 }
const RESUME_FILE = { uri: 'file:///mock/김서준_백엔드_이력서_2026.pdf', name: '김서준_백엔드_이력서_2026.pdf', mimeType: 'application/pdf', size: 2_400_000, lastModified: 0 }

const lateAnswer = (botId: string) => {
  const id = fixtureOf(botId)?.bot.id ?? botId
  const text = '경력 섹션 3줄을 고쳤어요. 승인 API p95를 320ms에서 140ms로 줄인 내용을 맨 앞에 두었어요.'
  const { emptyChat, useChatStore } = chat()
  useChatStore.setState((s) => {
    const current = s.chats[id] ?? emptyChat
    return { chats: { ...s.chats, [id]: { ...current, items: [...current.items, { type: 'agentText', id: `late-${current.items.length}`, text, sources: DESIGN_SOURCES }] } } }
  })
}

const MATERIAL_SET = /^materials:(?:(none|long)|(doc|bookmark|link):none)$/

export const listenMockLinks = () =>
  Linking.addEventListener('url', ({ url }) => {
    const specs = decodeURIComponent(/[?&]mock=([^&#]*)/.exec(url)?.[1] ?? '').split(',').filter(Boolean)
    if (specs.includes('empty-feed')) emptyFeed()
    if (specs.includes('clipboard-link')) void infra().copyText('https://careers.moapay.kr/jobs/1182')
    if (specs.includes('two-photos'))
      infra().stubPickImage([photo(require('../../assets/icon.png'), 'photo-1.png'), photo(require('../../assets/splash-icon.png'), 'photo-2.png')])
    if (specs.includes('step-next')) chat().nextMockStep()
    if (specs.includes('stop-hold')) chat().holdMockStop()
    if (specs.includes('pick-file')) infra().stubPickDocument([RESUME_FILE])
    if (specs.includes('pick-big')) infra().stubPickDocument([HUGE_FILE])
    if (specs.includes('pick-career')) {
      infra().stubPickDocument([CAREER_FILE])
      infra().holdMockUpload(0.61)
    }
    if (specs.includes('upload-fail')) {
      infra().stubPickDocument([RESUME_FILE])
      infra().failMockUploads(true)
    }
    if (specs.includes('fit-comparing')) infra().holdMockFit(true)
    if (specs.includes('fit-soon')) infra().setMockFitSoon(true)
    if (specs.includes('plan-free')) infra().setMockWebPlan('FREE')
    if (specs.includes('fit-three')) infra().setMockFitThree(true)
    if (specs.includes('apple-fail')) infra().failMockApple(true)
    if (specs.includes('reset')) {
      infra().failMockUploads(false)
      infra().holdMockUpload(undefined)
      infra().holdMockFit(false)
      infra().setMockFitSoon(false)
      infra().setMockFitThree(false)
      infra().setMockWebPlan(undefined)
      infra().failMockApple(false)
      setRules([])
      setAccount({ ultra: false, spent: false, closed: false, run: undefined, once: false })
      setBlockedByThem(false)
      resetBots()
      resetDeadlineEvents()
      setMaterials('default')
    }
    if (specs.includes('bots:none')) setBots('none')
    if (specs.includes('bots:long')) setBots('long')
    if (specs.includes('bots:many')) setBots('many')
    if (specs.includes('bots:outcome')) setBots('outcome')
    if (specs.includes('bots:limit')) {
      setBots('limit')
      setBotPlan('FREE')
    }
    for (const s of specs) {
      const muted = /^bot:(.+):muted$/.exec(s)
      if (muted) muteBot(muted[1]!)
      const allowed = /^bot:(.+):allowed$/.exec(s)
      if (allowed) allowSites(allowed[1]!)
      const read = /^bot:(.+):read$/.exec(s)
      if (read) readBot(read[1]!)
      const empty = /^bot:(.+):empty$/.exec(s)
      if (empty) {
        emptyBot(empty[1]!)
        const id = fixtureOf(empty[1]!)?.bot.id ?? empty[1]!
        chat().dropRun(id)
        chat().forget(id)
      }
      const reload = /^bot:(.+):reload$/.exec(s)
      if (reload) chat().forget(fixtureOf(reload[1]!)?.bot.id ?? reload[1]!)
      const from = /^bot:(.+):from:(user|notice|todo|agentText|fit)(?::(\d+|last))?$/.exec(s)
      if (from) chat().showFrom(fixtureOf(from[1]!)?.bot.id ?? from[1]!, from[2] === 'todo' || from[2] === 'fit' ? 'surface' : (from[2] as 'user' | 'notice' | 'agentText'), from[3] === 'last' ? 'last' : Number(from[3] ?? 1))
      const late = lateSpec(s)
      if (late) setTimeout(() => lateAnswer(late.bot), late.delayMs)
      const seeded = /^bot:(.+):(thread|done|resume|sent)$/.exec(s)
      if (seeded) {
        seedThread(seeded[1]!, seeded[2] as 'thread' | 'done' | 'resume' | 'sent')
        chat().forget(fixtureOf(seeded[1]!)?.bot.id ?? seeded[1]!)
      }
      const materials = MATERIAL_SET.exec(s)
      if (materials) setMaterials((materials[1] ?? materials[2]) as Parameters<typeof setMaterials>[0])
    }
    if (specs.includes('unread-deadline')) unreadDeadline()
    if (specs.includes('phone-social')) pendingSocialPhone()
    if (specs.includes('no-pad')) hidePhonePad()
    if (specs.includes('blocked-by-them')) setBlockedByThem(true)
    if (specs.includes('long-intro')) {
      longIntro()
      void queryClient().invalidateQueries({ queryKey: ['me', 'profile'] })
    }
    if (specs.includes('close-moapay')) closeMoapay()
    if (specs.includes('consent-on')) grantReference()
    if (specs.includes('few-materials')) {
      setAccount({ few: true })
      fewBookmarks()
    }
    const run = specs.find((s) => s.startsWith('run:'))
    const once = specs.find((s) => s.startsWith('run1:'))
    if (run) setAccount({ run: run.slice(4), once: false })
    if (once) setAccount({ run: once.slice(5), once: true })
    if (specs.includes('plan-ultra')) {
      setAccount({ ultra: true })
      setBotPlan('ULTRA')
      infra().setMockWebPlan('ULTRA')
    }
    if (specs.includes('credits-out')) setAccount({ spent: true })
    if (specs.includes('payments-closed')) setAccount({ closed: true })
    const next = specs.flatMap((s) => toRule(s) ?? [])
    if (next.length) setRules(next)
  })
