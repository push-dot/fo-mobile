export const redirectSystemPath = ({ path }: { path: string; initial: boolean }) =>
  path.includes('auth/callback') ? '/' : path
