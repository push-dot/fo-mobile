import { useSyncExternalStore } from 'react'
import { Alert, Platform } from 'react-native'
import {
  deepLinkToSubscriptions,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  restorePurchases,
  type Purchase,
} from 'expo-iap'
import Constants from 'expo-constants'
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

const report = (code?: string) => {
  setPending(false)
  const outcome = outcomeFromCode(code)
  if (outcome.kind === 'cancelled') return
  Alert.alert(outcome.message ?? IAP_FAILED_MESSAGE)
}

const accept = async (purchase: Purchase) => {
  if (!claim(purchase)) return
  try {
    await settlePurchase(purchase, deps)
    refreshAccount()
  } catch (error) {
    release(purchase)
    Alert.alert(verifyFailedMessage(error))
  } finally {
    setPending(false)
  }
}

const ready = () => {
  if (!started) {
    started = true
    purchaseUpdatedListener((purchase) => {
      void accept(purchase)
    })
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
  try {
    await ready()
    if (type === 'subs' && Platform.OS === 'android') {
      const products = await fetchProducts({ skus: [sku], type: 'subs' })
      const token = androidOfferToken(Array.isArray(products) ? (products as SubscriptionProduct[]) : [], sku)
      if (!token) throw new Error('missing offer')
      await requestPurchase({
        type: 'subs',
        request: { google: { skus: [sku], subscriptionOffers: [{ sku, offerToken: token }] } },
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

export const usePersonalPurchase = () => {
  const isPending = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => pending,
    () => pending,
  )

  return {
    pending: isPending,
    buyPlan: (plan: 'PRO' | 'ULTRA') => {
      void buy(plan === 'PRO' ? IAP_PRODUCT_PRO : IAP_PRODUCT_ULTRA, 'subs')
    },
    manage: (plan: 'PRO' | 'ULTRA') => {
      void deepLinkToSubscriptions({ skuAndroid: plan === 'PRO' ? IAP_PRODUCT_PRO : IAP_PRODUCT_ULTRA, packageNameAndroid: Constants.expoConfig?.android?.package }).catch(() => Alert.alert(IAP_FAILED_MESSAGE))
    },
    buyCredits: () => {
      void buy(IAP_PRODUCT_TOPUP, 'in-app')
    },
    restore: () => {
      if (pending) return
      setPending(true)
      void (async () => {
        const fresh: Purchase[] = []
        try {
          await ready()
          await restorePurchases()
          const purchases = await getAvailablePurchases()
          for (const purchase of purchases ?? []) {
            if (claim(purchase)) fresh.push(purchase)
          }
          // shortcut: a mid-batch failure releases every token in the batch, upgrade when finishTransaction is idempotent
          await settleRestored(fresh, deps)
          refreshAccount()
        } catch (error) {
          fresh.forEach(release)
          Alert.alert(verifyFailedMessage(error))
        } finally {
          setPending(false)
        }
      })()
    },
  }
}
