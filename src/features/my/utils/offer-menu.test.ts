import type { Offer } from '@push/api-client'
import { describe, expect, it, vi } from 'vitest'
import { offerMenu, offerMenuSections, otherParty, viewerBox, type OfferMenuDeps } from './offer-menu'

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
    expect(otherParty(offer, 'received').id).toBe('them')
    expect(otherParty(offer, 'sent').id).toBe('me')
    const d = deps()
    await offerMenu(offer, 'received', d).block()
    expect(d.block).toHaveBeenCalledWith('them')
    expect(d.back).toHaveBeenCalled()
    expect(d.refresh).toHaveBeenCalled()
    expect(vi.mocked(d.toast).mock.calls[0]![0]).toEqual({ message: 'them 님을 차단했어요' })
  })

  it('archives with an undo that unarchives and re-reads', async () => {
    const d = deps()
    await offerMenu(offer, 'received', d).archive()
    expect(d.back).toHaveBeenCalled()
    const toast = vi.mocked(d.toast).mock.calls[0]![0]
    toast.action!.onPress()
    await flush()
    expect(d.unarchive).toHaveBeenCalledWith('o1')
    expect(d.refresh).toHaveBeenCalledTimes(2)
  })

  it('shows the error toast and re-reads when the undo fails', async () => {
    const d = deps({ unarchive: vi.fn(async () => Promise.reject(new Error('x'))) })
    await offerMenu(offer, 'received', d).archive()
    vi.mocked(d.toast).mock.calls[0]![0].action!.onPress()
    await flush()
    expect(vi.mocked(d.toast).mock.calls[1]![0].tone).toBe('error')
    expect(d.refresh).toHaveBeenCalledTimes(2)
  })

  it('stays on the screen and shows the error toast when an action fails', async () => {
    const d = deps({ archive: vi.fn(async () => Promise.reject(new Error('x'))) })
    await offerMenu(offer, 'received', d).archive()
    expect(d.back).not.toHaveBeenCalled()
    expect(vi.mocked(d.toast).mock.calls[0]![0].tone).toBe('error')
  })
})

describe('viewerBox', () => {
  const sent = { ...offer, sender: party('me'), recipient: party('them') } as Offer

  it('takes the side from the session, whatever the route box says', () => {
    expect(viewerBox(offer, 'me', 'sent')).toBe('received')
    expect(viewerBox(sent, 'me', 'received')).toBe('sent')
  })

  it('falls back to the route box when the session is neither party', () => {
    expect(viewerBox(offer, undefined, 'sent')).toBe('sent')
    expect(viewerBox(offer, 'stranger', 'received')).toBe('received')
  })
})

describe('the menu of an offer opened without a box (notification link)', () => {
  const sent = { ...offer, status: 'ACCEPTED', sender: party('me'), recipient: party('them') } as Offer
  const d = { ...deps(), profile: vi.fn(), confirm: vi.fn() }
  const menu = offerMenuSections(sent, viewerBox(sent, 'me', 'received'), d)

  it('offers no 제안 보관하기 on a sent offer', () => {
    expect(menu.map((s) => s.actions.map((a) => a.label))).toEqual([['허브 프로필 보기'], ['신고하기', '차단하기']])
  })

  it('opens the profile of the other person, never your own', () => {
    menu[0]!.actions[0]!.onPress()
    expect(d.profile).toHaveBeenCalledWith('them')
  })

  it('blocks the other person, never yourself', async () => {
    vi.mocked(d.confirm).mockImplementation((r) => r.onConfirm())
    menu[1]!.actions[1]!.onPress()
    await flush()
    expect(d.block).toHaveBeenCalledWith('them')
  })
})

describe('offerMenuSections', () => {
  const sectionDeps = (over: Partial<OfferMenuDeps> = {}) => ({ ...deps(over), profile: vi.fn(), confirm: vi.fn() })
  const labels = (o: Offer, box: 'received' | 'sent' = 'received') =>
    offerMenuSections(o, box, sectionDeps()).map((s) => s.actions.map((a) => a.label))

  it('offers 보관 for a received offer and 보관 풀기 once it is archived', () => {
    expect(labels(offer)).toEqual([['허브 프로필 보기', '제안 보관하기'], ['신고하기', '차단하기']])
    expect(labels({ ...offer, archivedAt: '2026-10-01T00:00:00Z' })).toEqual([['허브 프로필 보기', '보관 풀기'], ['신고하기', '차단하기']])
  })

  it('does not archive an offer the viewer sent, but still releases an archived one', () => {
    const sent = { ...offer, sender: party('me'), recipient: party('them') } as Offer
    expect(labels(sent, 'sent')).toEqual([['허브 프로필 보기'], ['신고하기', '차단하기']])
    expect(labels({ ...sent, archivedAt: '2026-10-01T00:00:00Z' }, 'sent')[0]).toEqual(['허브 프로필 보기', '보관 풀기'])
  })

  it('reports and confirms with a plain toast, staying on the offer', async () => {
    const d = sectionDeps()
    offerMenuSections(offer, 'received', d)[1]!.actions[0]!.onPress()
    await flush()
    expect(d.report).toHaveBeenCalledWith('o1')
    expect(d.back).not.toHaveBeenCalled()
    expect(vi.mocked(d.toast).mock.calls[0]![0]).toMatchObject({ message: '신고가 접수됐어요' })
    expect(vi.mocked(d.toast).mock.calls[0]![0].tone).toBeUndefined()
  })

  it('lifts the report toast above the bottom bar only when the offer has one', async () => {
    const bottomOf = async (o: Offer, box: 'received' | 'sent') => {
      const d = sectionDeps()
      offerMenuSections(o, box, d)[1]!.actions[0]!.onPress()
      await flush()
      return vi.mocked(d.toast).mock.calls[0]![0].bottom
    }
    expect(await bottomOf({ ...offer, status: 'SENT' } as Offer, 'received')).toBe(92)
    expect(await bottomOf({ ...offer, status: 'ACCEPTED' } as Offer, 'received')).toBe(92)
    expect(await bottomOf({ ...offer, status: 'DECLINED' } as Offer, 'received')).toBeUndefined()
    expect(await bottomOf({ ...offer, status: 'SENT' } as Offer, 'sent')).toBeUndefined()
  })

  it('blocks the sender of a received offer and the recipient of a sent one', async () => {
    const d = sectionDeps()
    const sent = { ...offer, sender: party('me'), recipient: party('them') } as Offer
    vi.mocked(d.confirm).mockImplementation((r) => r.onConfirm())
    offerMenuSections(sent, 'sent', d)[1]!.actions[1]!.onPress()
    await flush()
    expect(d.block).toHaveBeenCalledWith('them')
  })

  it('opens the other party hub profile', () => {
    const d = sectionDeps()
    offerMenuSections(offer, 'received', d)[0]!.actions[0]!.onPress()
    expect(d.profile).toHaveBeenCalledWith('them')
  })

  it('asks before blocking and blocks only after the confirm', async () => {
    const d = sectionDeps()
    const block = offerMenuSections(offer, 'received', d)[1]!.actions[1]!
    expect(block.destructive).toBe(true)
    block.onPress()
    expect(d.block).not.toHaveBeenCalled()
    const ask = vi.mocked(d.confirm).mock.calls[0]![0]
    expect(ask).toMatchObject({ title: 'them 님을 차단할까요?', confirm: '차단', danger: true, note: '설정 › 차단한 사람에서 언제든 풀 수 있어요.' })
    ask.onConfirm()
    await flush()
    expect(d.block).toHaveBeenCalledWith('them')
    expect(d.back).toHaveBeenCalled()
  })

  it('archives, and unarchives without leaving the screen', async () => {
    const d = sectionDeps()
    offerMenuSections(offer, 'received', d)[0]!.actions[1]!.onPress()
    await flush()
    expect(d.archive).toHaveBeenCalledWith('o1')
    expect(d.back).toHaveBeenCalled()
    const e = sectionDeps()
    offerMenuSections({ ...offer, archivedAt: '2026-10-01T00:00:00Z' }, 'received', e)[0]!.actions[1]!.onPress()
    await flush()
    expect(e.unarchive).toHaveBeenCalledWith('o1')
    expect(e.back).not.toHaveBeenCalled()
    expect(e.toast).not.toHaveBeenCalled()
    expect(e.refresh).toHaveBeenCalled()
  })
})
