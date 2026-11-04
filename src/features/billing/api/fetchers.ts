import { api } from '@/shared/infrastructure'
import type { VerifyPurchaseBody } from '../types'

export const verifyPurchase = (body: VerifyPurchaseBody) => api.billing.verifyIap(body)
