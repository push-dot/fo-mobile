import { ApiError } from '@push/api-client'
import { describe, expect, it } from 'vitest'
import {
  countdownLabel,
  emailFromPendingToken,
  formatCountdown,
  formatNational,
  formatProviderList,
  isAppleCancel,
  loginFailureCopy,
  loginTarget,
  mapPhoneAuthError,
  registeredBody,
  registeredButton,
  remainingSeconds,
  showAppleButton,
  toE164,
} from './auth-flow'

const pending = (email: string | null) => {
  const json = JSON.stringify({ v: 1, provider: 'google', subject: 'sub', email, exp: 1 })
  const body = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
  return `${body}.sig`
}

describe('countdown', () => {
  it('formats the server cooldown as m:ss', () => {
    expect(formatCountdown(168)).toBe('2:48')
    expect(formatCountdown(61)).toBe('1:01')
    expect(formatCountdown(0)).toBe('0:00')
    expect(countdownLabel(168)).toBe('2:48 후에 다시 받을 수 있어요')
  })

  it('counts down to zero and stays there', () => {
    expect(remainingSeconds(10_000, 5_000)).toBe(5)
    expect(remainingSeconds(10_000, 10_000)).toBe(0)
    expect(remainingSeconds(10_000, 15_000)).toBe(0)
  })
})

describe('phone auth errors', () => {
  it('maps invalid, expired, five attempts, cooldown, and 409', () => {
    expect(mapPhoneAuthError(new ApiError('code is invalid', 'PHONE_CODE_INVALID', 400))).toEqual({ kind: 'invalid' })
    expect(mapPhoneAuthError(new ApiError('code is expired', 'PHONE_CODE_EXPIRED', 400))).toEqual({ kind: 'expired' })
    expect(mapPhoneAuthError(new ApiError('too many attempts', 'RATE_LIMITED', 429))).toEqual({ kind: 'too-many' })
    expect(mapPhoneAuthError(new ApiError('resend cooldown', 'RATE_LIMITED', 429, { retryAfterSec: 40 }))).toEqual({
      kind: 'cooldown',
      retryAfterSec: 40,
    })
    expect(
      mapPhoneAuthError(new ApiError('phone is already registered', 'PHONE_ALREADY_REGISTERED', 409, {
        existingProviders: ['github', 'google', 1],
      })),
    ).toEqual({ kind: 'registered', providers: ['github', 'google'] })
  })
})

describe('provider list', () => {
  it('lists Google, Apple, and GitHub with 또는', () => {
    expect(formatProviderList(['github', 'google'])).toBe('Google 또는 GitHub')
    expect(formatProviderList(['apple', 'github', 'google'])).toBe('Google 또는 Apple 또는 GitHub')
    expect(formatProviderList(['apple'])).toBe('Apple')
    expect(registeredBody(['google'])).toBe('이 번호는 Google 계정으로 가입돼 있어요. Google로 로그인해 주세요.')
    expect(registeredButton(['google', 'github'])).toBe('Google 또는 GitHub로 로그인')
  })

  it('starts the only provider the device can use', () => {
    expect(loginTarget(['apple'], false)).toBeNull()
    expect(loginTarget(['apple'], true)).toBe('apple')
    expect(loginTarget(['google', 'github'], true)).toBe('choose')
    expect(loginTarget(['apple', 'github'], false)).toBe('github')
  })
})

describe('apple sign-in gating', () => {
  it('shows the Apple button only on iOS when the system can present it', () => {
    expect(showAppleButton('ios', true)).toBe(true)
    expect(showAppleButton('ios', false)).toBe(false)
    expect(showAppleButton('android', true)).toBe(false)
    expect(showAppleButton('android', false)).toBe(false)
  })

  it('maps a cancel and a failure line per provider', () => {
    expect(isAppleCancel({ code: 'ERR_REQUEST_CANCELED' })).toBe(true)
    expect(isAppleCancel({ code: 'ERR_REQUEST_FAILED' })).toBe(false)
    expect(isAppleCancel(new Error('no'))).toBe(false)
    expect(loginFailureCopy('apple')).toEqual({
      title: 'Apple 로그인에 실패했어요',
      body: '잠시 후 다시 시도하거나 다른 방법으로 계속해 주세요.',
    })
    expect(loginFailureCopy('google').title).toBe('Google 로그인에 실패했어요')
    expect(loginFailureCopy('github').title).toBe('GitHub 로그인에 실패했어요')
    expect(loginFailureCopy('github').body).toBe('잠시 후 다시 시도하거나 다른 방법으로 계속해 주세요.')
  })
})

describe('phone number', () => {
  it('formats a Korean mobile number and builds E.164', () => {
    expect(formatNational('01012345678')).toBe('010-1234-5678')
    expect(formatNational('010-12')).toBe('010-12')
    expect(toE164('01012345678')).toBe('+821012345678')
    expect(toE164('1234')).toBeNull()
  })

  it('reads the email from a pending token', () => {
    expect(emailFromPendingToken(pending('seojun.kim@gmail.com'))).toBe('seojun.kim@gmail.com')
    expect(emailFromPendingToken(pending(null))).toBeNull()
    expect(emailFromPendingToken('not-a-token')).toBeNull()
  })
})
