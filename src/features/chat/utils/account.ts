import type { BillingStatus } from '@push/api-client'
import { MICRO_CREDITS_PER_CREDIT } from '../constants'
import type { Account } from '../api/schemas'

const credits = (micro: number) => Math.round(micro / MICRO_CREDITS_PER_CREDIT)

/** Account from GET billing and the signed-in email; amounts are credits, billing sends micro credits. */
export const accountFromBilling = (b: BillingStatus, email: string | null | undefined): Account => {
  const total = credits(b.monthlyMicroCredits)
  return {
    email: email || null,
    plan: b.plan ?? 'FREE',
    credits: total > 0 ? { used: credits(b.spentMicroCredits), total } : null,
    paymentsEnabled: b.paymentsEnabled,
    creditsRefillAt: b.creditsRefillAt,
    usageByBot: b.usageByBot?.map((x) => ({ id: x.id, name: x.name, used: credits(x.usedMicroCredits) })),
  }
}
