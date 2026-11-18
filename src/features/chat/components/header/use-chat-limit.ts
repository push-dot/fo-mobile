import { paymentsOpen } from '@/features/billing'
import { useChatAccount } from '../../api/hooks'
import type { ChatItem } from '../../types'
import { isUsageExhausted } from '../../utils/usage'
import { creditBanner } from './state'

/**
 * Out of credits when the account shows nothing left, or the last send was refused for it. A refusal stays until the next
 * line lands, so a small balance shows no red lamp until the server turns a send away.
 */
export const useChatLimit = (items: readonly ChatItem[]) => {
  const account = useChatAccount(true).data
  const last = items.at(-1)
  const refused = last?.type === 'error' && isUsageExhausted(last.code)
  const spent = !!account?.credits && account.credits.used >= account.credits.total
  const out = refused || spent
  const banner = out
    ? creditBanner({
        plan: account?.plan,
        refillAt: account?.creditsRefillAt ? new Date(account.creditsRefillAt) : null,
        paymentsEnabled: paymentsOpen(account),
      })
    : null
  return { out, banner }
}
