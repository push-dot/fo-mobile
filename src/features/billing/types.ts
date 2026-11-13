export type StorePlatform = 'ios' | 'android'

export type StorePurchase = {
  productId: string
  purchaseToken?: string | null
  /** Play: `pending` until the buyer's slow payment clears; the store sends another update then. */
  purchaseState?: 'pending' | 'purchased' | 'unknown'
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
