import { beforeEach, describe, expect, it, vi } from 'vitest'
import { IAP_FAILED_MESSAGE, IAP_PRODUCT_TOPUP } from './constants'

type Listener<T> = (value: T) => void
const h = vi.hoisted(() => ({
  alert: vi.fn(),
  requestPurchase: vi.fn(),
  onUpdate: null as Listener<unknown> | null,
  onError: null as Listener<{ code?: string }> | null,
}))

vi.mock('react', () => ({ useSyncExternalStore: (_subscribe: unknown, get: () => boolean) => get() }))
vi.mock('react-native', () => ({ Alert: { alert: h.alert }, Platform: { OS: 'ios' } }))
vi.mock('@/providers/query-client', () => ({ queryClient: { invalidateQueries: vi.fn() } }))
vi.mock('./api/fetchers', () => ({ verifyPurchase: vi.fn() }))
vi.mock('expo-iap', () => ({
  fetchProducts: vi.fn(),
  finishTransaction: vi.fn(),
  getAvailablePurchases: vi.fn(),
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

const { usePersonalPurchase } = await import('./hooks')

beforeEach(() => {
  h.alert.mockClear()
  h.requestPurchase.mockReset()
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
