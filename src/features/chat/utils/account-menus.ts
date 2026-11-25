import type { Tone } from '@push/api-client'
import type { Account } from '../api/schemas'
import { TONES } from '@/features/my'
import type { MenuAction } from '@/shared/components'

export const toneMenu = (current: Tone | undefined, onPick: (tone: Tone) => void): MenuAction[] =>
  TONES.map((t) => ({ key: t.key, label: t.label, selected: t.key === (current ?? 'as_is'), onPress: () => onPick(t.key) }))

export const usagePercent = (credits: Account['credits'] | undefined) =>
  credits && credits.total > 0 ? Math.min(100, Math.max(0, Math.round((credits.used / credits.total) * 100))) : null

export const toneLabel = (tone?: { key: Tone; label: string }) => (tone && tone.key !== 'as_is' ? `${tone.label} 말투` : '그대로')

export const currentRole = (profile?: { headline: string; careers: { role: string; endedOn?: string | null }[] }) =>
  profile?.careers.find((c) => !c.endedOn)?.role ?? profile?.headline
