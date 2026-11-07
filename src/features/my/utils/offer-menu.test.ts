import type { Offer } from '@push/api-client'
import { describe, expect, it, vi } from 'vitest'
import { offerMenu, otherParty, type OfferMenuDeps } from './offer-menu'

const party = (id: string) => ({ id, displayName: id, avatarUrl: null, companyName: null, headline: '' })
const offer = { id: 'o1', sender: party('them'), recipient: party('me') } as Offer
const flush = () => new Promise((r) => setTimeout(r, 0))

const deps = (over: Partial<OfferMenuDeps> = {}): OfferMenuDeps => ({
  archive: vi.fn(async () => undefined),
  unarchive: vi.fn(async () => undefined),
  report: vi.fn(async () => undefined),
  block: vi.fn(async () => undefined),
  refresh: vi.fn(async () => undefined),
  back: vi.fn(),
  toast: vi.fn(),
  ...over,
})

describe('offerMenu', () => {
  it('blocks the other party, whichever box the offer came from', async () => {
    expect(otherParty(offer, 'me').id).toBe('them')
    expect(otherParty(offer, 'them').id).toBe('me')
    const d = deps()
    await offerMenu(offer, 'me', d).block()
    expect(d.block).toHaveBeenCalledWith('them')
    expect(d.back).toHaveBeenCalled()
    expect(d.refresh).toHaveBeenCalled()
  })

  it('archives with an undo that unarchives and re-reads', async () => {
    const d = deps()
    await offerMenu(offer, 'me', d).archive()
    expect(d.back).toHaveBeenCalled()
    const toast = vi.mocked(d.toast).mock.calls[0]![0]
    toast.action!.onPress()
    await flush()
    expect(d.unarchive).toHaveBeenCalledWith('o1')
    expect(d.refresh).toHaveBeenCalledTimes(2)
  })

  it('shows the error toast and re-reads when the undo fails', async () => {
    const d = deps({ unarchive: vi.fn(async () => Promise.reject(new Error('x'))) })
    await offerMenu(offer, 'me', d).archive()
    vi.mocked(d.toast).mock.calls[0]![0].action!.onPress()
    await flush()
    expect(vi.mocked(d.toast).mock.calls[1]![0].tone).toBe('error')
    expect(d.refresh).toHaveBeenCalledTimes(2)
  })

  it('stays on the screen and shows the error toast when an action fails', async () => {
    const d = deps({ archive: vi.fn(async () => Promise.reject(new Error('x'))) })
    await offerMenu(offer, 'me', d).archive()
    expect(d.back).not.toHaveBeenCalled()
    expect(vi.mocked(d.toast).mock.calls[0]![0].tone).toBe('error')
  })
})
