import { ApiError } from '@push/api-client'
import { IAP_ALREADY_OWNED_MESSAGE, IAP_FAILED_MESSAGE, IAP_PRODUCT_TOPUP, PAYMENTS_CLOSED_MESSAGE } from '../constants'
import type { PurchaseFeedback, StorePlatform, StorePurchase, SubscriptionProduct, VerifyPurchaseBody } from '../types'

export const verifyBody = (platform: StorePlatform, productId: string, token: string): VerifyPurchaseBody =>
  platform === 'ios'
    ? { platform: 'APP_STORE', productId, signedTransaction: token }
    : { platform: 'GOOGLE_PLAY', productId, purchaseToken: token }

export const isConsumable = (productId: string) => productId === IAP_PRODUCT_TOPUP

export const androidOfferToken = (products: SubscriptionProduct[] | null | undefined, sku: string) =>
  products?.find((item) => item.id === sku)?.subscriptionOffers?.find((offer) => offer.offerTokenAndroid)?.offerTokenAndroid ?? null

type SettleDeps<T extends StorePurchase> = {
  platform: StorePlatform
  verify: (body: VerifyPurchaseBody) => Promise<unknown>
  finish: (purchase: T, isConsumable: boolean) => Promise<unknown>
}

export const settlePurchase = async <T extends StorePurchase>(purchase: T, deps: SettleDeps<T>) => {
  const token = purchase.purchaseToken
  if (!token) throw new Error('missing purchase token')
  await deps.verify(verifyBody(deps.platform, purchase.productId, token))
  await deps.finish(purchase, isConsumable(purchase.productId))
}

export const settleRestored = async <T extends StorePurchase>(purchases: T[], deps: SettleDeps<T>) => {
  for (const purchase of purchases) {
    if (!purchase.purchaseToken) continue
    await settlePurchase(purchase, deps)
  }
}

export const outcomeFromCode = (code: string | undefined): PurchaseFeedback => {
  const value = (code ?? '').toLowerCase()
  if (value.includes('cancel')) return { kind: 'cancelled' }
  if (value.includes('already') && value.includes('own')) return { kind: 'already-owned', message: IAP_ALREADY_OWNED_MESSAGE }
  return { kind: 'failed', message: IAP_FAILED_MESSAGE }
}

// Servers before push-be #246 send no paymentsEnabled and keep payments open; no account data at all (loading, error) stays closed.
export const paymentsOpen = (status: { paymentsEnabled?: boolean } | undefined) => status !== undefined && status.paymentsEnabled !== false

export const verifyFailedMessage = (error: unknown) =>
  error instanceof ApiError && error.code === 'PAYMENTS_DISABLED' ? PAYMENTS_CLOSED_MESSAGE : IAP_FAILED_MESSAGE
