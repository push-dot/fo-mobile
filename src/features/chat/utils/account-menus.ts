import type { AccessMode, Tone } from '@push/api-client'
import type { Account } from '../api/schemas'
import { TONES } from '@/features/my'
import type { MenuAction } from '@/shared/components'
import { ACCESS_MODES } from '../constants'

/** 계정 › 말투: inline menu, the saved tone checked (그대로 when none is saved). */
export const toneMenu = (current: Tone | undefined, onPick: (tone: Tone) => void): MenuAction[] =>
  TONES.map((t) => ({ key: t.key, label: t.label, selected: t.key === (current ?? 'as_is'), onPress: () => onPick(t.key) }))

/** 계정 › 실행 방식: inline menu, the current mode checked. */
export const accessMenu = (current: AccessMode, onPick: (mode: AccessMode) => void): MenuAction[] =>
  ACCESS_MODES.map((m) => ({ key: m.key, label: m.label, selected: m.key === current, onPress: () => onPick(m.key) }))

export const usagePercent = (credits: Account['credits'] | undefined) =>
  credits && credits.total > 0 ? Math.min(100, Math.max(0, Math.round((credits.used / credits.total) * 100))) : null

/** ChatAccountUsage 'Bot별': each Bot's share of the month's allowance as a whole percent, biggest first. Empty when the server sends no split. */
export const botUsageRows = (account: Pick<Account, 'credits' | 'usageByBot'> | undefined) => {
  const total = account?.credits?.total ?? 0
  if (!account?.usageByBot || total <= 0) return []
  return account.usageByBot
    .map((b) => ({ id: b.id, name: b.name, percent: Math.min(100, Math.max(0, Math.round((b.used / total) * 100))), used: b.used }))
    .sort((a, b) => b.used - a.used)
}

export const toneLabel = (tone?: { key: Tone; label: string }) => (tone && tone.key !== 'as_is' ? `${tone.label} 말투` : '그대로')

export const currentRole = (profile?: { headline: string; careers: { role: string; endedOn?: string | null }[] }) =>
  profile?.careers.find((c) => !c.endedOn)?.role ?? profile?.headline
