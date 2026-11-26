import { useSyncExternalStore } from 'react'
import { Alert, Platform } from 'react-native'
import {
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  getPendingTransactionsIOS,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from 'expo-iap'
import { queryClient } from '@/providers/query-client'
import { verifyPurchase } from './api/fetchers'
import { IAP_FAILED_MESSAGE, IAP_PRODUCT_PRO, IAP_PRODUCT_TOPUP, IAP_PRODUCT_ULTRA } from './constants'
import type { StorePurchase, SubscriptionProduct } from './types'
import { androidOfferToken, outcomeFromCode, settlePurchase, settleRestored, verifyFailedMessage } from './utils/settle'

let pending = false
const listeners = new Set<() => void>()
const claimed = new Set<string>()
let connecting: Promise<unknown> | null = null
let started = false
let lastSku: string | null = null
let recovering: Promise<string[]> | null = null

const setPending = (value: boolean) => {
  pending = value
  listeners.forEach((listener) => listener())
}

const claim = (purchase: StorePurchase) => {
  const token = purchase.purchaseToken
  if (!token || claimed.has(token)) return false
  claimed.add(token)
  return true
}

const release = (purchase: StorePurchase) => {
  if (purchase.purchaseToken) claimed.delete(purchase.purchaseToken)
}

const deps = {
  get platform() {
    return Platform.OS === 'android' ? ('android' as const) : ('ios' as const)
  },
  verify: verifyPurchase,
  finish: (purchase: Purchase, isConsumable: boolean) => finishTransaction({ purchase, isConsumable }),
}

const refreshAccount = () => {
  void queryClient.invalidateQueries({ queryKey: ['chat', 'account'] })
}

const fail = (message: string) => {
  if (!pending) return
  setPending(false)
  Alert.alert(message)
}

const report = (code?: string) => {
  const outcome = outcomeFromCode(code)
  if (outcome.kind === 'cancelled') return setPending(false)
  if (outcome.kind === 'already-owned' && lastSku === IAP_PRODUCT_TOPUP) {
    if (!pending) return
    void recoverPurchases().then((settled) => (settled.includes(IAP_PRODUCT_TOPUP) ? setPending(false) : fail(IAP_FAILED_MESSAGE)))
    return
  }
  fail(outcome.message ?? IAP_FAILED_MESSAGE)
}

const accept = async (purchase: Purchase) => {
  if (purchase.purchaseState === 'pending') return setPending(false)
  if (!purchase.purchaseToken) return fail(IAP_FAILED_MESSAGE)
  if (!claim(purchase)) return
  try {
    await settlePurchase(purchase, deps)
    refreshAccount()
  } catch (error) {
    fail(verifyFailedMessage(error))
  } finally {
    release(purchase)
    setPending(false)
  }
}

const ready = () => {
  if (!started) {
    started = true
    purchaseUpdatedListener(
      (purchase) => {
        void accept(purchase)
      },
      { dedupeTransactionIOS: false },
    )
    purchaseErrorListener((error) => report(error.code))
  }
  connecting ??= initConnection().catch((error: unknown) => {
    connecting = null
    throw error
  })
  return connecting
}

const buy = async (sku: string, type: 'in-app' | 'subs') => {
  if (pending) return
  setPending(true)
  lastSku = sku
  try {
    await ready()
    if (type === 'subs' && Platform.OS === 'android') {
      const products = await fetchProducts({ skus: [sku], type: 'subs' })
      const token = androidOfferToken(Array.isArray(products) ? (products as SubscriptionProduct[]) : [], sku)
      if (!token) throw new Error('missing offer')
      const owned = (await getAvailablePurchases()).find(
        (p) =>
          p.productId !== sku &&
          (p.productId === IAP_PRODUCT_PRO || p.productId === IAP_PRODUCT_ULTRA) &&
          p.purchaseToken,
      )
      const replacement = owned && {
        purchaseToken: owned.purchaseToken,
        subscriptionProductReplacementParams: {
          oldProductId: owned.productId,
          replacementMode: sku === IAP_PRODUCT_ULTRA ? ('charge-prorated-price' as const) : ('deferred' as const),
        },
      }
      await requestPurchase({
        type: 'subs',
        request: {
          google: { skus: [sku], subscriptionOffers: [{ sku, offerToken: token }], ...replacement },
        },
      })
      return
    }
    if (type === 'subs') {
      await requestPurchase({ type: 'subs', request: { apple: { sku } } })
      return
    }
    await requestPurchase({
      type: 'in-app',
      request: { apple: { sku }, google: { skus: [sku] } },
    })
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined
    report(code)
  }
}

const restoreAll = async () => {
  const fresh: Purchase[] = []
  try {
    await ready()
    await restorePurchases()
    const purchases = await getAvailablePurchases()
    for (const purchase of purchases ?? []) {
      if (claim(purchase)) fresh.push(purchase)
    }
    await settleRestored(fresh, deps)
  } catch (error) {
    fail(verifyFailedMessage(error))
  } finally {
    fresh.forEach(release)
    refreshAccount()
    setPending(false)
  }
}

const settleQuietly = async (purchase: Purchase) => {
  if (!claim(purchase)) return false
  try {
    await settlePurchase(purchase, deps)
    return true
  } catch {
    return false
  } finally {
    release(purchase)
  }
}

const unsettledPurchases = async (): Promise<Purchase[]> => {
  if (Platform.OS === 'ios') return getPendingTransactionsIOS()
  const purchases = await getAvailablePurchases()
  return purchases.filter(
    (purchase) =>
      purchase.purchaseState !== 'pending' && 'isAcknowledgedAndroid' in purchase && purchase.isAcknowledgedAndroid === false,
  )
}

const recoverOnce = async () => {
  const settled: string[] = []
  try {
    await ready()
    for (const purchase of await unsettledPurchases()) {
      if (await settleQuietly(purchase)) settled.push(purchase.productId)
    }
  } catch {
  }
  if (settled.length) refreshAccount()
  return settled
}

export const recoverPurchases = () => {
  recovering ??= recoverOnce().finally(() => {
    recovering = null
  })
  return recovering
}

const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

const getPending = () => pending

const buyPlan = (plan: 'PRO' | 'ULTRA') => {
  void buy(plan === 'PRO' ? IAP_PRODUCT_PRO : IAP_PRODUCT_ULTRA, 'subs')
}

const buyCredits = () => {
  void buy(IAP_PRODUCT_TOPUP, 'in-app')
}

const restore = () => {
  if (pending) return
  setPending(true)
  void restoreAll()
}

export const usePersonalPurchase = () => ({ pending: useSyncExternalStore(subscribe, getPending, getPending), buyPlan, buyCredits, restore })
