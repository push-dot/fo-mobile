import { useSession } from '../../shared/infrastructure'

export const useViewerId = () => useSession((s) => s.session?.user.id)
