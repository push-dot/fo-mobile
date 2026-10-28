import type { Profile } from '@push/api-client'
import { WEB_BASE_URL } from '../../../shared/infrastructure'

export const profileShareMessage = (id: string, profile?: Profile | null) =>
  `${profile ? `${profile.displayName} · ${profile.headline}\n` : ''}${WEB_BASE_URL}/profiles/${id}`
