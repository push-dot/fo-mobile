import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IAP_FAILED_MESSAGE, IAP_PRODUCT_TOPUP } from './constants'

type Listener<T> = (value: T) => void
const h = vi.hoisted(() => ({
  alert: vi.fn(),
  requestPurchase: vi.fn(),
  verify: vi.fn(),
  finish: vi.fn(),
  invalidate: vi.fn(),
  pendingIOS: vi.fn(),
  available: vi.fn(),
  platform: { OS: 'ios' as 'ios' | 'android' },
  onUpdate: null as Listener<unknown> | null,
  onError: null as Listener<{ code?: string }> | null,
}))

vi.mock('react', () => ({ useSyncExternalStore: (_subscribe: unknown, get: () => boolean) => get() }))
vi.mock('react-native', () => ({ Alert: { alert: h.alert }, Platform: h.platform }))
vi.mock('@/providers/query-client', () => ({ queryClient: { invalidateQueries: h.invalidate } }))
vi.mock('./api/fetchers', () => ({ verifyPurchase: h.verify }))
vi.mock('expo-iap', () => ({
  fetchProducts: vi.fn(),
  finishTransaction: h.finish,
  getAvailablePurchases: h.available,
  getPendingTransactionsIOS: h.pendingIOS,
  initConnection: vi.fn(async () => true),
  restorePurchases: vi.fn(),
  requestPurchase: h.requestPurchase,
  purchaseUpdatedListener: (listener: Listener<unknown>) => {
    h.onUpdate = listener
  },
  purchaseErrorListener: (listener: Listener<{ code?: string }>) => {
    h.onError = listener
  },
}))

const { recoverPurchases, usePersonalPurchase } = await import('./hooks')

beforeEach(() => {
  h.alert.mockClear()
  h.requestPurchase.mockReset()
  h.verify.mockReset()
  h.finish.mockReset()
  h.invalidate.mockClear()
  h.pendingIOS.mockReset()
  h.available.mockReset()
  h.platform.OS = 'ios'
})

describe('usePersonalPurchase', () => {
  it('clears pending and alerts once when the store sends a purchase without a token', async () => {
    h.requestPurchase.mockResolvedValue(undefined)
    usePersonalPurchase().buyCredits()
    expect(usePersonalPurchase().pending).toBe(true)
    await vi.waitFor(() => expect(h.requestPurchase).toHaveBeenCalled())
    h.onUpdate?.({ productId: IAP_PRODUCT_TOPUP, purchaseState: 'purchased', purchaseToken: null })
    await vi.waitFor(() => expect(usePersonalPurchase().pending).toBe(false))
    expect(h.alert).toHaveBeenCalledTimes(1)
    expect(h.alert).toHaveBeenCalledWith(IAP_FAILED_MESSAGE)
  })

  it('alerts once when the error listener fires and the request also rejects', async () => {
    h.requestPurchase.mockImplementation(async () => {
      h.onError?.({ code: 'network-error' })
      throw Object.assign(new Error('network'), { code: 'network-error' })
    })
    usePersonalPurchase().buyCredits()
    await vi.waitFor(() => expect(usePersonalPurchase().pending).toBe(false))
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(h.alert).toHaveBeenCalledTimes(1)
  })
})

describe('recoverPurchases', () => {
  const unacked = { productId: IAP_PRODUCT_TOPUP, purchaseToken: 'tok-a', isAcknowledgedAndroid: false }
  const acked = { productId: IAP_PRODUCT_TOPUP, purchaseToken: 'tok-b', isAcknowledgedAndroid: true }

  it('settles an unacknowledged android purchase and refreshes the account', async () => {
    h.platform.OS = 'android'
    h.available.mockResolvedValue([unacked, acked])
    await recoverPurchases()
    expect(h.verify).toHaveBeenCalledTimes(1)
    expect(h.verify).toHaveBeenCalledWith({ platform: 'GOOGLE_PLAY', productId: IAP_PRODUCT_TOPUP, purchaseToken: 'tok-a' })
    expect(h.finish).toHaveBeenCalledTimes(1)
    expect(h.invalidate).toHaveBeenCalledTimes(1)
  })

  it('settles unfinished ios transactions', async () => {
    h.pendingIOS.mockResolvedValue([{ productId: IAP_PRODUCT_TOPUP, purchaseToken: 'jws' }])
    await recoverPurchases()
    expect(h.verify).toHaveBeenCalledWith({ platform: 'APP_STORE', productId: IAP_PRODUCT_TOPUP, signedTransaction: 'jws' })
    expect(h.available).not.toHaveBeenCalled()
  })

  it('recovers instead of alerting when the top-up is already owned', async () => {
    h.pendingIOS.mockResolvedValue([{ productId: IAP_PRODUCT_TOPUP, purchaseToken: 'owned-jws' }])
    h.requestPurchase.mockRejectedValue(Object.assign(new Error('owned'), { code: 'already-owned' }))
    usePersonalPurchase().buyCredits()
    await vi.waitFor(() => expect(h.verify).toHaveBeenCalled())
    await vi.waitFor(() => expect(usePersonalPurchase().pending).toBe(false))
    expect(h.finish).toHaveBeenCalledTimes(1)
    expect(h.alert).not.toHaveBeenCalled()
  })

  it('holds pending and then alerts once when recovery settles nothing', async () => {
    let empty: (purchases: unknown[]) => void = () => {}
    h.pendingIOS.mockImplementation(() => new Promise((resolve) => { empty = resolve }))
    h.requestPurchase.mockImplementation(async () => {
      h.onError?.({ code: 'already-owned' })
      throw Object.assign(new Error('owned'), { code: 'already-owned' })
    })
    usePersonalPurchase().buyCredits()
    await vi.waitFor(() => expect(h.pendingIOS).toHaveBeenCalled())
    expect(usePersonalPurchase().pending).toBe(true)
    empty([])
    await vi.waitFor(() => expect(usePersonalPurchase().pending).toBe(false))
    expect(h.pendingIOS).toHaveBeenCalledTimes(1)
    expect(h.alert).toHaveBeenCalledTimes(1)
    expect(h.alert).toHaveBeenCalledWith(IAP_FAILED_MESSAGE)
  })

  it('skips android purchases the store still holds as pending', async () => {
    h.platform.OS = 'android'
    h.available.mockResolvedValue([{ ...unacked, purchaseState: 'pending' }])
    await expect(recoverPurchases()).resolves.toBe(false)
    expect(h.verify).not.toHaveBeenCalled()
  })

  it('stays silent when verify fails', async () => {
    h.platform.OS = 'android'
    h.available.mockResolvedValue([unacked])
    h.verify.mockRejectedValue(new Error('verify down'))
    await expect(recoverPurchases()).resolves.toBe(false)
    expect(h.alert).not.toHaveBeenCalled()
    expect(h.finish).not.toHaveBeenCalled()
    expect(h.invalidate).not.toHaveBeenCalled()
    expect(usePersonalPurchase().pending).toBe(false)
  })
})

describe('restore', () => {
  it('refreshes the account even when one restored purchase fails', async () => {
    h.available.mockResolvedValue([
      { productId: IAP_PRODUCT_TOPUP, purchaseToken: 'r1' },
      { productId: IAP_PRODUCT_TOPUP, purchaseToken: 'r2' },
    ])
    h.verify.mockRejectedValueOnce(new Error('first fails'))
    usePersonalPurchase().restore()
    await vi.waitFor(() => expect(usePersonalPurchase().pending).toBe(false))
    expect(h.verify).toHaveBeenCalledTimes(2)
    expect(h.invalidate).toHaveBeenCalledTimes(1)
    expect(h.alert).toHaveBeenCalledTimes(1)
  })
})
