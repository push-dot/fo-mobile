import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import { useSession } from '../../lib/session'

/** Me: name for the drawer and account modal (profile when available, session otherwise). */
export function useMe() {
  const session = useSession((s) => s.session)
  const profile = useQuery({ queryKey: ['me', 'profile'], queryFn: api.me.profile })
  const name = profile.data?.displayName ?? session?.user.displayName ?? '나'
  return { name, given: name.length > 2 ? name.slice(-2) : name, profile: profile.data }
}
