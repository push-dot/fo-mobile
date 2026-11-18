import { describe, expect, it } from 'vitest'
import type { BillingStatus } from '@push/api-client'
import { MICRO_CREDITS_PER_CREDIT } from '../constants'
import { accountFromBilling } from '../utils/account'

const M = MICRO_CREDITS_PER_CREDIT
const billing = (more: Partial<BillingStatus> = {}): BillingStatus => ({
  subscriptionStatus: 'ACTIVE',
  plan: 'PRO',
  periodEndsAt: null,
  balanceMicroCredits: 0,
  reservedMicroCredits: 0,
  monthlyMicroCredits: 5000 * M,
  spentMicroCredits: 3200 * M,
  ...more,
})

describe('accountFromBilling', () => {
  it('turns micro credits into credits', () => {
    expect(accountFromBilling(billing(), 'a@b.c').credits).toEqual({ used: 3200, total: 5000 })
  })

  it('carries plan, email, payments and refill date as before', () => {
    const account = accountFromBilling(billing({ plan: null, monthlyMicroCredits: 0, paymentsEnabled: false, creditsRefillAt: '2026-12-01T00:00:00Z' }), '')
    expect(account).toMatchObject({ email: null, plan: 'FREE', credits: null, paymentsEnabled: false, creditsRefillAt: '2026-12-01T00:00:00Z' })
  })
})
