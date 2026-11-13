import { BOT_COLORS } from '../constants'
import type { BotColor, BotLimit } from '../types'

const PLAN_ORDER = ['FREE', 'PRO', 'ULTRA'] as const
const EN_DASH = '–'

export type PostingPick = { postingId: string; company: string; title: string }

export type CreatePhase =
  | { kind: 'idle' }
  | { kind: 'searching'; query: string }
  | { kind: 'linkChecking'; url: string }
  | { kind: 'linkFinding'; url: string }
  | { kind: 'linkRetry'; url: string }
  | { kind: 'linkOk'; url: string; posting: PostingPick; host: string; meta: string }
  | { kind: 'linkBad'; url: string }
  | { kind: 'picked'; posting: PostingPick }
  | { kind: 'creating'; posting: PostingPick }
  | { kind: 'error'; posting: PostingPick }
  | { kind: 'limit' }

export type CreateForm = { phase: CreatePhase; color: BotColor; consent: boolean }

export type CreateAction = { action: 'none' } | { action: 'create'; posting: PostingPick; color: BotColor }

export type PostingChoice = { type: 'open'; botId: string } | { type: 'pick'; posting: PostingPick }

export type LimitCopy = {
  title: string
  body: string
  rows: { plan: (typeof PLAN_ORDER)[number]; value: string; current: boolean }[]
}

type PostingFacts = {
  deadline: Date | null
  careerMin: number | null
  careerMax: number | null
  location?: string | null
}

export const postingOf = (phase: CreatePhase): PostingPick | null => ('posting' in phase ? phase.posting : null)

export const initialForm = (): CreateForm => ({
  phase: { kind: 'idle' },
  color: BOT_COLORS[0],
  consent: false,
})

export const chooseColor = (form: CreateForm, color: BotColor): CreateForm => ({ ...form, color })

export const focusSearch = (form: CreateForm): CreateForm => ({ ...form, phase: { kind: 'searching', query: '' } })

export const closeSearch = (form: CreateForm): CreateForm => ({ ...form, phase: { kind: 'idle' } })

export const clearPosting = (form: CreateForm): CreateForm => ({ ...form, phase: { kind: 'idle' } })

export const setQuery = (form: CreateForm, query: string): CreateForm =>
  form.phase.kind === 'searching' ? { ...form, phase: { kind: 'searching', query } } : form

export const startLinkCheck = (form: CreateForm, url: string): CreateForm => ({
  ...form,
  phase: { kind: 'linkChecking', url },
})

const linkUrl = (form: CreateForm) =>
  form.phase.kind === 'linkChecking' || form.phase.kind === 'linkFinding' ? form.phase.url : null

export const markFinding = (form: CreateForm): CreateForm => {
  const url = linkUrl(form)
  return form.phase.kind === 'linkChecking' && url ? { ...form, phase: { kind: 'linkFinding', url } } : form
}

export const linkFound = (form: CreateForm, found: PostingPick & { host: string; meta: string }): CreateForm => {
  const url = linkUrl(form)
  if (!url) return form
  const { host, meta, ...posting } = found
  return { ...form, phase: { kind: 'linkOk', url, posting, host, meta } }
}

export const linkMissing = (form: CreateForm): CreateForm => {
  const url = linkUrl(form)
  return url ? { ...form, phase: { kind: 'linkBad', url } } : form
}

export const linkFailed = (form: CreateForm): CreateForm => {
  const url = linkUrl(form)
  return url ? { ...form, phase: { kind: 'linkRetry', url } } : form
}

export const pickPosting = (form: CreateForm, posting: PostingPick): CreateForm => ({
  ...form,
  phase: { kind: 'picked', posting },
})

export const onPostingChosen = (existing: { id: string } | null, posting: PostingPick): PostingChoice =>
  existing ? { type: 'open', botId: existing.id } : { type: 'pick', posting }

export const submitCreate = (form: CreateForm): CreateAction => {
  if (form.consent || form.phase.kind !== 'picked') return { action: 'none' }
  return { action: 'create', posting: form.phase.posting, color: form.color }
}

export const retryCreate = (form: CreateForm): CreateAction => {
  if (form.phase.kind !== 'error') return { action: 'none' }
  return { action: 'create', posting: form.phase.posting, color: form.color }
}

export const beginCreate = (form: CreateForm): CreateForm => {
  const action = form.phase.kind === 'error' ? retryCreate(form) : submitCreate(form)
  if (action.action !== 'create') return form
  return { ...form, consent: false, phase: { kind: 'creating', posting: action.posting } }
}

export const dismissConsent = (form: CreateForm): CreateForm => ({ ...form, consent: false })

export const failCreate = (form: CreateForm, reason: 'limit' | 'error' | 'consent'): CreateForm => {
  if (reason === 'limit') return { ...form, phase: { kind: 'limit' } }
  if (reason === 'consent') return { ...form, consent: true }
  const posting = postingOf(form.phase)
  if (!posting) return form
  return { ...form, phase: { kind: 'error', posting } }
}

const countLabel = (max: number | null): string => (max === null ? '무제한' : `${max}개`)

export const limitCopy = (limit: BotLimit): LimitCopy => ({
  title: limit.max === null ? 'Bot을 무제한으로 만들 수 있어요' : `Bot을 ${limit.max}개까지 만들 수 있어요`,
  body: limit.max === null ? '지금 플랜은 Bot 수에 제한이 없어요.' : `지금 플랜의 Bot ${limit.max}개를 모두 쓰고 있어요.`,
  rows: PLAN_ORDER.map((plan) => ({
    plan,
    value: countLabel(limit.table[plan]),
    current: plan === limit.plan,
  })),
})

const deadlineLine = (deadline: Date | null): string => {
  if (!deadline) return '상시 채용'
  return `마감 ${deadline.getMonth() + 1}월 ${deadline.getDate()}일`
}

const careerLine = (min: number | null, max: number | null): string | null => {
  if (min === null) return null
  if (min === 0 && (max === null || max === 0)) return '신입 가능'
  if (max === null) return `경력 ${min}년 이상`
  if (max === min) return min === 0 ? '신입 가능' : `경력 ${min}년`
  return `경력 ${min}${EN_DASH}${max}년`
}

export const postingMeta = (facts: PostingFacts, options?: { location?: boolean }): string => {
  const parts = [deadlineLine(facts.deadline)]
  const career = careerLine(facts.careerMin, facts.careerMax)
  if (career) parts.push(career)
  if (options?.location && facts.location) parts.push(facts.location)
  return parts.join(' · ')
}

export const asLink = (query: string): string | null => {
  const value = query.trim()
  if (/^https?:\/\//i.test(value)) return value
  if (/\s/.test(value) || !value.includes('.') || !value.includes('/')) return null
  return `https://${value}`
}

export const linkLabel = (url: string): string => url.replace(/^https?:\/\//i, '')
