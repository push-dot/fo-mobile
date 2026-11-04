export type StorePlatform = 'ios' | 'android'

export type StorePurchase = {
  productId: string
  purchaseToken?: string | null
}

export type VerifyPurchaseBody = {
  platform: 'APP_STORE' | 'GOOGLE_PLAY'
  productId: string
  signedTransaction?: string
  purchaseToken?: string
}

export type PurchaseFeedback = {
  kind: 'cancelled' | 'failed' | 'already-owned'
  message?: string
}

export type SubscriptionProduct = {
  id: string
  subscriptionOffers?: { offerTokenAndroid?: string | null }[] | null
}
