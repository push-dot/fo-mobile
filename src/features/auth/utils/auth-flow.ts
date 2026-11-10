import { ApiError } from '@push/api-client'
import { FAILURE_BODY, OTP_LENGTH, PENDING_EXPIRED, PHONE_TAKEN, PHONE_UNAVAILABLE, PROVIDER_LABEL, PROVIDER_ORDER, TRY_AGAIN } from '../constants'

export const formatCountdown = (totalSeconds: number) => {
  const seconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return `${minutes}:${String(rest).padStart(2, '0')}`
}

export const countdownLabel = (totalSeconds: number) => `${formatCountdown(totalSeconds)} 후에 다시 받을 수 있어요`

// The boards keep a code error up while the code is edited; a newly completed code is a fresh attempt.
export const otpErrorAfterInput = <E>(error: E | null, prev: string, next: string) => (next.length === OTP_LENGTH && next !== prev ? null : error)

export const remainingSeconds = (endsAtMs: number, nowMs: number) => Math.max(0, Math.ceil((endsAtMs - nowMs) / 1000))

export type PhoneAuthFailure =
  | { kind: 'invalid' }
  | { kind: 'expired' }
  | { kind: 'too-many' }
  | { kind: 'cooldown'; retryAfterSec: number }
  | { kind: 'registered'; providers: string[] }
  | { kind: 'unavailable' }
  | { kind: 'pending-expired' }
  | { kind: 'taken' }
  | { kind: 'unknown' }

const COOLDOWN_FALLBACK_SEC = 168

const providersOf = (details: Record<string, unknown> | null | undefined) => {
  const raw = details?.existingProviders
  if (!Array.isArray(raw)) return []
  return raw.filter((item): item is string => typeof item === 'string')
}

export const mapPhoneAuthError = (error: unknown): PhoneAuthFailure => {
  if (!(error instanceof ApiError)) return { kind: 'unknown' }
  if (error.code === 'PHONE_CODE_INVALID') return { kind: 'invalid' }
  if (error.code === 'PHONE_CODE_EXPIRED') return { kind: 'expired' }
  if (error.code === 'PHONE_ALREADY_REGISTERED') return { kind: 'registered', providers: providersOf(error.details) }
  if (error.code === 'RATE_LIMITED' && error.message === 'too many attempts') return { kind: 'too-many' }
  if (error.code === 'RATE_LIMITED') {
    const retryAfterSec = Number(error.details?.retryAfterSec)
    return { kind: 'cooldown', retryAfterSec: Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec : COOLDOWN_FALLBACK_SEC }
  }
  if (error.code === 'PHONE_TAKEN') return { kind: 'taken' }
  if (error.code === 'NOT_CONFIGURED') return { kind: 'unavailable' }
  if (error.code === 'TOKEN_EXPIRED' || error.code === 'UNAUTHENTICATED') return { kind: 'pending-expired' }
  return { kind: 'unknown' }
}

export const formatProviderList = (providers: string[]) =>
  PROVIDER_ORDER.filter((provider) => providers.includes(provider)).map((provider) => PROVIDER_LABEL[provider]).join(' 또는 ')

export const registeredBody = (providers: string[]) => {
  const list = formatProviderList(providers)
  return `이 번호는 ${list} 계정으로 가입돼 있어요. ${list}로 로그인해 주세요.`
}

export const registeredButton = (providers: string[]) => `${formatProviderList(providers)}로 로그인`

export type LoginProvider = 'google' | 'apple' | 'github'

export const loginTarget = (providers: string[], canApple: boolean): LoginProvider | 'choose' | null => {
  const actionable = PROVIDER_ORDER.filter((provider) => providers.includes(provider) && (provider !== 'apple' || canApple))
  if (actionable.length === 1) return actionable[0]
  if (actionable.length > 1) return 'choose'
  return null
}

export const showAppleButton = (platform: string, available: boolean) => platform === 'ios' && available

export const isAppleCancel = (error: unknown) =>
  typeof error === 'object' && error !== null && 'code' in error && (error as { code?: unknown }).code === 'ERR_REQUEST_CANCELED'

export const loginFailureCopy = (provider: LoginProvider) => ({
  title: `${PROVIDER_LABEL[provider]} 로그인에 실패했어요`,
  body: FAILURE_BODY,
})

export const nationalDigits = (value: string) => value.replace(/\D/g, '').slice(0, 11)

export const formatNational = (value: string) => {
  const digits = nationalDigits(value)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export const toE164 = (value: string) => {
  const digits = nationalDigits(value)
  if (!/^01[016789]\d{7,8}$/.test(digits)) return null
  return `+82${digits.slice(1)}`
}

const decodeB64Url = (value: string) => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4))
  return atob(padded + pad)
}

export const emailFromPendingToken = (token: string) => {
  const [part, signature] = token.split('.')
  if (!part || !signature) return null
  try {
    const body = JSON.parse(decodeB64Url(part)) as { email?: unknown }
    return typeof body.email === 'string' && body.email ? body.email : null
  } catch {
    return null
  }
}

export { needsTerms } from '@push/api-client'

export const phoneFailureLine = (failure: PhoneAuthFailure) => {
  if (failure.kind === 'unavailable') return PHONE_UNAVAILABLE
  if (failure.kind === 'taken') return PHONE_TAKEN
  if (failure.kind === 'pending-expired') return PENDING_EXPIRED
  return TRY_AGAIN
}
