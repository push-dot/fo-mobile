import { describe, expect, it, vi } from 'vitest'
import { IAP_ALREADY_OWNED_MESSAGE, IAP_FAILED_MESSAGE, IAP_PRODUCT_PRO, IAP_PRODUCT_TOPUP, IAP_PRODUCT_ULTRA } from '../constants'
import { androidOfferToken, outcomeFromCode, settlePurchase, settleRestored, verifyBody } from './settle'

const purchase = (productId: string, purchaseToken: string | null) => ({ productId, purchaseToken })

describe('settlePurchase', () => {
  it('verifies the store token before it finishes the transaction', async () => {
    const order: string[] = []
    const verify = vi.fn(async () => {
      order.push('verify')
    })
    const finish = vi.fn(async () => {
      order.push('finish')
    })
    const item = purchase(IAP_PRODUCT_PRO, 'jws-pro')
    await settlePurchase(item, { platform: 'ios', verify, finish })
    expect(order).toEqual(['verify', 'finish'])
    expect(verify).toHaveBeenCalledWith(verifyBody('ios', IAP_PRODUCT_PRO, 'jws-pro'))
    expect(finish).toHaveBeenCalledWith(item, false)
  })

  it('sends an android purchase token and does not finish when verify fails', async () => {
    const finish = vi.fn()
    const verify = vi.fn(async () => {
      throw new Error('rejected')
    })
    const item = purchase(IAP_PRODUCT_TOPUP, 'play-token')
    await expect(settlePurchase(item, { platform: 'android', verify, finish })).rejects.toThrow('rejected')
    expect(verify).toHaveBeenCalledWith(verifyBody('android', IAP_PRODUCT_TOPUP, 'play-token'))
    expect(finish).not.toHaveBeenCalled()
  })

  it('finishes a credit purchase as a consumable', async () => {
    const finish = vi.fn(async () => undefined)
    const item = purchase(IAP_PRODUCT_TOPUP, 'jws-topup')
    await settlePurchase(item, { platform: 'ios', verify: async () => undefined, finish })
    expect(finish).toHaveBeenCalledWith(item, true)
  })
})

describe('outcomeFromCode', () => {
  it('stays quiet when the person cancels', () => {
    expect(outcomeFromCode('user-cancelled')).toEqual({ kind: 'cancelled' })
    expect(outcomeFromCode('E_USER_CANCELED')).toEqual({ kind: 'cancelled' })
  })

  it('names an already owned plan', () => {
    expect(outcomeFromCode('already-owned')).toEqual({ kind: 'already-owned', message: IAP_ALREADY_OWNED_MESSAGE })
  })

  it('uses the failed payment copy for every other store error', () => {
    expect(outcomeFromCode('network-error')).toEqual({ kind: 'failed', message: IAP_FAILED_MESSAGE })
    expect(outcomeFromCode(undefined)).toEqual({ kind: 'failed', message: IAP_FAILED_MESSAGE })
  })
})

describe('settleRestored', () => {
  it('verifies then finishes each owned purchase and skips an empty token', async () => {
    const order: string[] = []
    const verify = vi.fn(async (body: { productId: string }) => {
      order.push(`verify:${body.productId}`)
    })
    const finish = vi.fn(async (item: { productId: string }) => {
      order.push(`finish:${item.productId}`)
    })
    const kept = [purchase(IAP_PRODUCT_PRO, 'jws-pro'), purchase(IAP_PRODUCT_TOPUP, null), purchase(IAP_PRODUCT_TOPUP, 'jws-topup')]
    await settleRestored(kept, { platform: 'ios', verify, finish })
    expect(order).toEqual(['verify:push.pro.monthly', 'finish:push.pro.monthly', 'verify:push.credits.topup', 'finish:push.credits.topup'])
    expect(finish).toHaveBeenNthCalledWith(1, kept[0], false)
    expect(finish).toHaveBeenNthCalledWith(2, kept[2], true)
  })
})

describe('androidOfferToken', () => {
  it('reads the play offer token for the selected plan', () => {
    expect(androidOfferToken([{ id: IAP_PRODUCT_ULTRA, subscriptionOffers: [{ offerTokenAndroid: 'offer-1' }] }], IAP_PRODUCT_ULTRA)).toBe('offer-1')
    expect(androidOfferToken([{ id: IAP_PRODUCT_PRO, subscriptionOffers: [] }], IAP_PRODUCT_PRO)).toBeNull()
  })
})
