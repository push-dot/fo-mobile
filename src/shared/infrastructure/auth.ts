import { api } from './api-client'
import { AUTH_REDIRECT_URI } from './constants'
import { createPkce } from './pkce'
import { openAuthSession } from './platform'
import { useSession } from './session-store'

export const signIn = async (provider: 'google' | 'github') => {
  const { verifier, challenge } = await createPkce()
  const { authorizationUrl } = await api.auth.start(provider, { codeChallenge: challenge, redirectUri: AUTH_REDIRECT_URI })
  const result = await openAuthSession(authorizationUrl, AUTH_REDIRECT_URI)
  if (result.type !== 'success') return false
  const code = new URL(result.url).searchParams.get('code')
  if (!code) return false
  await useSession.getState().set(await api.auth.exchange({ code, codeVerifier: verifier }))
  return true
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
