import { Image, Linking } from 'react-native'
import { DESIGN_SOURCES, emptyBot, expireCard, fixtureOf, muteBot, resetBots, seedThread, setBotPlan, setBots } from './bots'
import { grantReference, setAccount } from './chat'
import { pendingSocialPhone, unreadDeadline } from './home'
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
const components = () => require('../shared/components') as typeof import('../shared/components')
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

// ChatErrUpload: the file the next 자료 고르기 › 파일에서 고르기 returns. The mock API skips uploads, so `upload-fail` also makes the send fail.
const RESUME_FILE = { uri: 'file:///mock/김서준_백엔드_이력서_2026.pdf', name: '김서준_백엔드_이력서_2026.pdf', mimeType: 'application/pdf', size: 2_400_000, lastModified: 0 }

// ChatBotHeaderNew: a bot line lands while the reader is scrolled up, so the thread keeps its place and shows 새 메시지 1개 and the green dot.
const lateAnswer = (botId: string) => {
  const id = fixtureOf(botId)?.bot.id ?? botId
  const text = '경력 섹션 3줄을 고쳤어요. 승인 API p95를 320ms에서 140ms로 줄인 내용을 맨 앞에 두었어요. PDF는 내 서류에 저장했어요.'
  const { emptyChat, useChatStore } = chat()
  useChatStore.setState((s) => {
    const current = s.chats[id] ?? emptyChat
    return { chats: { ...s.chats, [id]: { ...current, items: [...current.items, { type: 'agentText', id: `late-${current.items.length}`, text, sources: DESIGN_SOURCES }] } } }
  })
}

const MATERIAL_SET = /^materials:(?:(none|long)|(doc|bookmark|link):none)$/

// Tours reach states the fixtures can't hold through a link like push://social?mock=empty-feed (the router still opens the path).
// `mock=` takes comma-separated switches: empty-feed, unread-deadline (the 마감 임박 알림 arrives unread), phone-social (the phone screen opens as after a Google sign-in, PhoneInput), close-moapay (모아페이 백엔드 closes within a week), consent-on (참고 데이터 제공 already on), plan-ultra, credits-out (an ULTRA account / spent credits), payments-closed (chat/account says paymentsEnabled false: no buy button anywhere), few-materials (2 bookmarks, 2 documents, 1 link), pick-file (the next file pick returns the resume PDF, Uploading with `hang:POST:sources`), fit-comparing (a job's fit card stays on 비교하는 중, JobFit), fit-soon (a job's fit card says 적합도는 곧 볼 수 있어요, JobDetailStates.1), apple-fail (the Apple sign-in attempt fails, SignInErrors.4; Google and GitHub fail with a `fail:GET:auth/.*/start` rule), upload-fail (the next file pick in 자료 고르기 returns the resume PDF and sending it fails to upload, ChatErrUpload), two-photos (the next photo pick in 새 글 returns two images, ComposeSheet), clipboard-link (the pasteboard holds the 모아페이 posting link, QsLink), long-intro (the profile intro gets its second paragraph, EditIntro), blocked-by-them (오지현 and 최지우 blocked the viewer: their chats refuse messages, 최지우's hub offer sheet refuses), run:<chat token>, reset, or a rule (see toRule).
// Bot and material switches: bots:none (only the Push Bot), bots:long (AgentHomeLong), bots:limit (FREE at its limit), bot:<id>:muted, bot:<id>:empty (no thread yet, so the chat opens on its greeting), bot:<id>:thread / bot:<id>:done (ChatBotHeader's finished chat / ChatBotStatusDone's one request), step-next (the next line of run:st-steps, ChatBotStatusSteps), bot:<id>:late (a bot answer lands in the open chat, ChatBotHeaderNew),
// card:expired (모아페이's page-read card ran out, ChatBotStatusExpired), upload-toast (the 올렸어요 toast of a finished upload while the next file is still going up, Uploading), materials:none, materials:long, materials:<doc|bookmark|link>:none.
export const listenMockLinks = () =>
  Linking.addEventListener('url', ({ url }) => {
    const specs = decodeURIComponent(/[?&]mock=([^&#]*)/.exec(url)?.[1] ?? '').split(',').filter(Boolean)
    if (specs.includes('empty-feed')) emptyFeed()
    // The app writes its own pasteboard, so iOS shows no paste prompt when the link sheet reads it (Maestro setClipboard never reaches it).
    if (specs.includes('clipboard-link')) void infra().copyText('https://careers.moapay.co.kr/jobs/1042')
    if (specs.includes('two-photos'))
      infra().stubPickImage([photo(require('../../assets/icon.png'), 'photo-1.png'), photo(require('../../assets/splash-icon.png'), 'photo-2.png')])
    if (specs.includes('step-next')) chat().nextMockStep()
    if (specs.includes('pick-file')) infra().stubPickDocument([RESUME_FILE])
    // Uploading draws the toast of an earlier upload over a row still going up; the app holds one upload at a time, so the tour raises the toast itself.
    if (specs.includes('upload-toast')) {
      const { showToast, TOAST_ABOVE } = components()
      showToast({ message: '이력서 파일을 올렸어요', tone: 'success', bottom: TOAST_ABOVE.tabs })
    }
    if (specs.includes('upload-fail')) {
      infra().stubPickDocument([RESUME_FILE])
      infra().failMockUploads(true)
    }
    if (specs.includes('fit-comparing')) infra().holdMockFit(true)
    if (specs.includes('fit-soon')) infra().setMockFitSoon(true)
    if (specs.includes('apple-fail')) infra().failMockApple(true)
    if (specs.includes('reset')) {
      infra().failMockUploads(false)
      infra().holdMockFit(false)
      infra().setMockFitSoon(false)
      infra().failMockApple(false)
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
      const empty = /^bot:(.+):empty$/.exec(s)
      if (empty) {
        // A company chat has no clear-chat menu, so the open chat's client copy goes too: the next message draws on a bare thread.
        emptyBot(empty[1]!)
        chat().forget(fixtureOf(empty[1]!)?.bot.id ?? empty[1]!)
      }
      const late = /^bot:(.+):late$/.exec(s)
      if (late) lateAnswer(late[1]!)
      const seeded = /^bot:(.+):(thread|done)$/.exec(s)
      if (seeded) seedThread(seeded[1]!, seeded[2] as 'thread' | 'done')
      const materials = MATERIAL_SET.exec(s)
      if (materials) setMaterials((materials[1] ?? materials[2]) as Parameters<typeof setMaterials>[0])
    }
    if (specs.includes('card:expired')) expireCard()
    if (specs.includes('unread-deadline')) unreadDeadline()
    if (specs.includes('phone-social')) pendingSocialPhone()
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
