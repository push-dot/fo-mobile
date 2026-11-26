import type { BillingStatus } from '@push/api-client'
import { MICRO_CREDITS_PER_CREDIT } from '../constants'
import type { Account } from '../api/schemas'

const credits = (micro: number) => Math.round(micro / MICRO_CREDITS_PER_CREDIT)

export const accountFromBilling = (b: BillingStatus): Account => {
  const total = credits(b.monthlyMicroCredits)
  return {
    plan: b.plan ?? 'FREE',
    credits: total > 0 ? { used: credits(b.spentMicroCredits), total } : null,
    paymentsEnabled: b.paymentsEnabled,
    creditsRefillAt: b.creditsRefillAt,
  }
}
