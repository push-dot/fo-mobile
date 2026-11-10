import { needsTerms, type AuthResult } from '@push/api-client'
import * as Crypto from 'expo-crypto'
import { router } from 'expo-router'
import { Platform } from 'react-native'
import { usePhoneAuth } from '../../features/auth/stores'
import { isAppleCancel } from '../../features/auth/utils/auth-flow'
import { api } from './api-client'
import { AUTH_REDIRECT_URI } from './constants'
import { createPkce } from './pkce'
import { openAuthSession } from './platform'
import { useSession } from './session-store'

export type SignInOutcome =
  | { kind: 'session' }
  | { kind: 'terms' }
  | { kind: 'phone'; pendingToken: string }
  | { kind: 'cancelled' }
  | { kind: 'failed' }

const applyAuthResult = async (result: AuthResult): Promise<SignInOutcome> => {
  if (!('accessToken' in result)) return { kind: 'phone', pendingToken: result.pendingToken }
  // Same gate as the phone code screen: a stale or missing terms version stays signed out until consent.
  const consent = await api.me.consents(result.accessToken)
  if (needsTerms(consent)) {
    usePhoneAuth.getState().hold(result)
    router.push('/signup-terms')
    return { kind: 'terms' }
  }
  await useSession.getState().set(result)
  return { kind: 'session' }
}

const bytesToBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

export const signIn = async (provider: 'google' | 'github'): Promise<SignInOutcome> => {
  const { verifier, challenge } = await createPkce()
  const { authorizationUrl } = await api.auth.start(provider, { codeChallenge: challenge, redirectUri: AUTH_REDIRECT_URI })
  const result = await openAuthSession(authorizationUrl, AUTH_REDIRECT_URI)
  if (result.type !== 'success') return { kind: 'cancelled' }
  const code = new URL(result.url).searchParams.get('code')
  if (!code) return { kind: 'failed' }
  return applyAuthResult(await api.auth.exchange({ code, codeVerifier: verifier }))
}

export const signInWithApple = async (): Promise<SignInOutcome> => {
  if (Platform.OS !== 'ios') return { kind: 'failed' }
  const AppleAuthentication = await import('expo-apple-authentication')
  const raw = bytesToBase64Url(Crypto.getRandomBytes(32))
  const hashed = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, raw, {
    encoding: Crypto.CryptoEncoding.HEX,
  })
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashed,
    })
    if (!credential.identityToken) return { kind: 'failed' }
    return applyAuthResult(await api.auth.appleNative({ identityToken: credential.identityToken, nonce: raw }))
  } catch (error) {
    if (isAppleCancel(error)) return { kind: 'cancelled' }
    return { kind: 'failed' }
  }
}

export const deleteAccount = async () => {
  await api.me.deleteAccount()
  await useSession.getState().set(null)
}

export const signOut = async () => {
  const { session, set } = useSession.getState()
  if (session?.refreshToken) await api.auth.logout(session.refreshToken).catch(() => undefined)
  await set(null)
}

export const signInWithDevToken = (accessToken: string) =>
  useSession.getState().set({
    accessToken,
    refreshToken: '',
    expiresIn: 0,
    user: { id: 'dev', displayName: '개발자', locale: 'ko' },
  })
