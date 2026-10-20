import * as WebBrowser from 'expo-web-browser'
import { api } from './api'
import { createPkce } from './pkce'
import { useSession } from './session'

const REDIRECT_URI = 'push://auth/callback'

/** Google/GitHub OAuth with PKCE, returning to push://auth/callback (already allowed by push-be). */
export const signIn = async (provider: 'google' | 'github') => {
  const { verifier, challenge } = await createPkce()
  const { authorizationUrl } = await api.auth.start(provider, { codeChallenge: challenge, redirectUri: REDIRECT_URI })
  const result = await WebBrowser.openAuthSessionAsync(authorizationUrl, REDIRECT_URI)
  if (result.type !== 'success') return false
  const code = new URL(result.url).searchParams.get('code')
  if (!code) return false
  await useSession.getState().set(await api.auth.exchange({ code, codeVerifier: verifier }))
  return true
}

/** The server revokes every token, so only the local session needs clearing. */
export const deleteAccount = async () => {
  await api.me.deleteAccount()
  await useSession.getState().set(null)
}

export const signOut = async () => {
  const { session, set } = useSession.getState()
  if (session?.refreshToken) await api.auth.logout(session.refreshToken).catch(() => undefined)
  await set(null)
}
