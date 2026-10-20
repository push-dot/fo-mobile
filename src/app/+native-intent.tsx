// Android also routes the OAuth redirect (push://auth/callback?code=…) through the router;
// signIn() already consumes it via openAuthSessionAsync, so just land on home.
export function redirectSystemPath({ path }: { path: string; initial: boolean }) {
  return path.includes('auth/callback') ? '/' : path
}
