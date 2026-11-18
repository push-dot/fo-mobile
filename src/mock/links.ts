import { Image, Linking } from 'react-native'
import { DESIGN_SOURCES, allowSites, emptyBot, fixtureOf, muteBot, readBot, resetBots, seedThread, setBotPlan, setBots } from './bots'
import { resetDeadlineEvents } from './calendar-deadlines'
import { grantReference, setAccount } from './chat'
import { hidePhonePad, pendingSocialPhone, unreadDeadline } from './home'
import { lateSpec } from './late-spec'
import { longIntro, setBlockedByThem } from './me'
import { setMaterials } from './materials'
import { closeMoapay, fewBookmarks } from './postings'
import { setRules, type Rule } from './server'
import { emptyFeed } from './social'

/* eslint-disable @typescript-eslint/no-require-imports */
// Loaded when a link arrives, not when this file loads: api-client requires this file while @/shared/infrastructure is still being
// set up, and these modules import it back. A top-level import here left `http` undefined and crashed every launch of a mock build.
const chat = () => require('../features/chat') as typeof import('../features/chat')
const infra = () => require('../shared/infrastructure') as typeof import('../shared/infrastructure')
const queryClient = () => (require('../providers/query-client') as typeof import('../providers/query-client')).queryClient
/* eslint-enable @typescript-eslint/no-require-imports */

// `kind:METHOD:path-regex`, e.g. fail:GET:postings or hang:POST:postings/.*/apply; `reset` drops every rule.
const toRule = (spec: string): Rule | null => {
  const [kind, method, ...path] = spec.split(':')
  if (kind !== 'hang' && kind !== 'fail' && kind !== 'empty') return null
  return { kind, method: method!, re: new RegExp(`^${path.join(':')}`) }
}

// The two photos ComposeSheet draws (2/4): the app's own icon and splash images stand in for the library.
const photo = (module: number, fileName: string) => {
  const source = Image.resolveAssetSource(module)
  if (!source) throw new Error(`mock photo ${fileName} did not resolve`)
  return { uri: source.uri, fileName, mimeType: 'image/png', fileSize: 100_000, width: source.width ?? 1024, height: source.height ?? 1024 }
}

const HUGE_FILE = { uri: 'file:///mock/포트폴리오_전체.pdf', name: '포트폴리오_전체.pdf', mimeType: 'application/pdf', size: 25_000_000, lastModified: 0 }
const CAREER_FILE = { uri: 'file:///mock/경력기술서_결제플랫폼.pdf', name: '경력기술서_결제플랫폼.pdf', mimeType: 'application/pdf', size: 1_800_000, lastModified: 0 }
// ChatErrUpload: the file the next 자료 고르기 › 파일에서 고르기 returns. The mock API skips uploads, so `upload-fail` also makes the send fail.
const RESUME_FILE = { uri: 'file:///mock/김서준_백엔드_이력서_2026.pdf', name: '김서준_백엔드_이력서_2026.pdf', mimeType: 'application/pdf', size: 2_400_000, lastModified: 0 }

// ChatBotHeaderNew: a bot line lands while the reader is scrolled up, so the thread keeps its place and shows 새 메시지 1개 and the green dot.
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

// Tours reach states the fixtures can't hold through a link like push://social?mock=empty-feed (the router still opens the path).
// `mock=` takes comma-separated switches: empty-feed, unread-deadline (the 마감 임박 알림 arrives unread), phone-social (the phone screen opens as after a Google sign-in, PhoneInput), no-pad (the focused phone field keeps the system pad down, PhoneInputDirect and PhoneInput), close-moapay (모아페이 백엔드 closes within a week), consent-on (참고 데이터 제공 already on), plan-free (a FREE account's job fit card is locked, JobDetail.1), plan-ultra, credits-out (an ULTRA account / spent credits), payments-closed (chat/account says paymentsEnabled false: no buy button anywhere), few-materials (2 bookmarks, 2 documents, 1 link), pick-file (the next file pick returns the resume PDF, Uploading with `hang:POST:sources`), fit-comparing (a job's fit card stays on 비교하는 중, JobFit), fit-soon (a job's fit card says 적합도는 곧 볼 수 있어요, JobDetailStates.1), fit-three (the fit card draws three parts, ApplySheet and Applied), apple-fail (the Apple sign-in attempt fails, SignInErrors.4; Google and GitHub fail with a `fail:GET:auth/.*/start` rule), upload-fail (the next file pick in 자료 고르기 returns the resume PDF and sending it fails to upload, ChatErrUpload), two-photos (the next photo pick in 새 글 returns two images, ComposeSheet), clipboard-link (the pasteboard holds the 모아페이 posting link, QsLink), long-intro (the profile intro gets its second paragraph, EditIntro), blocked-by-them (오지현 and 최지우 blocked the viewer: their chats refuse messages, 최지우's hub offer sheet refuses), run:<chat token> (every next message) / run1:<chat token> (the next message only), reset, or a rule (see toRule).
// Bot and material switches: bots:none (only the Push Bot), bots:long (AgentHomeLong), bots:limit (FREE at its limit, with the three bots BotNewLimitDelete lists), bot:<id>:muted, bot:<id>:allowed (two allowed sites: BotProfileAllowed, BotProfileChiefAllowed), bot:<id>:read (no unread dot on its row, AgentHomeError), bot:<id>:empty (no thread yet, so the chat opens on its greeting), bot:<id>:reload (the open chat's client copy goes, so the next open reads the stored turns), bot:<id>:thread / bot:<id>:done / bot:<id>:resume (ChatBotHeader's finished chat / ChatBotStatusDone's one request / ChatResume's lapsed review card and the resume offer), step-next (the next line of run:st-steps, ChatBotStatusSteps; also ends a held stop), stop-hold (the next 중지 stays on 중지하는 중 until step-next, ChatBotStatusStopped), bot:<id>:late[:<ms>] (a bot answer lands in the open chat, at once or after <ms>: ChatBotHeaderNew), bot:<id>:from:<user|notice|todo|agentText|fit>[:n|last] (the thread from its first (nth, or the last) such line, however many lines come after it, the lines before it are older turns: ChatPh1, ChatInterrupt, ChatDone*, ChatPh6Result*),
// pick-big (the next file pick returns a 25MB PDF, so the upload refuses it, MyResumeStates), pick-career (the next file pick returns the career statement PDF and its upload row stays at 1.1 of 1.8MB, Uploading), materials:none, materials:long, materials:<doc|bookmark|link>:none.
export const listenMockLinks = () =>
  Linking.addEventListener('url', ({ url }) => {
    const specs = decodeURIComponent(/[?&]mock=([^&#]*)/.exec(url)?.[1] ?? '').split(',').filter(Boolean)
    if (specs.includes('empty-feed')) emptyFeed()
    // The app writes its own pasteboard, so iOS shows no paste prompt when the link sheet reads it.
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
        // A company chat has no clear-chat menu, so the open chat's client copy goes too: the next message draws on a bare thread.
        emptyBot(empty[1]!)
        const id = fixtureOf(empty[1]!)?.bot.id ?? empty[1]!
        chat().dropRun(id)
        chat().forget(id)
      }
      // The open chat's client copy goes, so the next open reads the stored turns (a reopened chat).
      const reload = /^bot:(.+):reload$/.exec(s)
      if (reload) chat().forget(fixtureOf(reload[1]!)?.bot.id ?? reload[1]!)
      const from = /^bot:(.+):from:(user|notice|todo|agentText|fit)(?::(\d+|last))?$/.exec(s)
      if (from) chat().showFrom(fixtureOf(from[1]!)?.bot.id ?? from[1]!, from[2] as 'user' | 'notice' | 'todo' | 'agentText' | 'fit', from[3] === 'last' ? 'last' : Number(from[3] ?? 1))
      const late = lateSpec(s)
      if (late) setTimeout(() => lateAnswer(late.bot), late.delayMs)
      const seeded = /^bot:(.+):(thread|done|resume|sent)$/.exec(s)
      if (seeded) {
        seedThread(seeded[1]!, seeded[2] as 'thread' | 'done' | 'resume' | 'sent')
        // The open chat's client copy goes too, so the room reads the seeded turns on its next open (as for :empty).
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
    // `run:err-other` plays that chat token for the next messages (see pick in chat.ts).
    // `run1:ext-done` plays the token for the next message only, so a tour types a natural line (no token text in the user bubble)
    // and the messages after it (바로 지원해 줘) take the normal route.
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
