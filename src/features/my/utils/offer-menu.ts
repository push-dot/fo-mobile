import type { Offer } from '@push/api-client'
import type { ToastInput } from '@/shared/components/toast-store'
import { OFFER_MENU_COPY } from './my-rules'

export const otherParty = (o: Offer, viewerId: string) => (o.sender.id === viewerId ? o.recipient : o.sender)

export type OfferMenuDeps = {
  archive: (id: string) => Promise<unknown>
  unarchive: (id: string) => Promise<unknown>
  report: (id: string) => Promise<unknown>
  block: (userId: string) => Promise<unknown>
  refresh: () => Promise<unknown>
  back: () => void
  toast: (t: ToastInput) => void
}

/** The offer ⋯ menu actions; every failure shows the error toast and re-reads the offer so the screen never shows a stale state. */
export const offerMenu = (offer: Offer, viewerId: string, d: OfferMenuDeps) => {
  const failed = () => {
    d.toast({ message: OFFER_MENU_COPY.failed, tone: 'error' })
    void d.refresh()
  }
  const run = (task: Promise<unknown>, done: () => void) => task.then(done, failed)
  return {
    archive: () =>
      run(d.archive(offer.id), () => {
        d.back()
        void d.refresh()
        d.toast({
          message: OFFER_MENU_COPY.archived,
          action: { label: OFFER_MENU_COPY.undo, onPress: () => void d.unarchive(offer.id).then(d.refresh, failed) },
        })
      }),
    report: () => run(d.report(offer.id), () => d.toast({ message: OFFER_MENU_COPY.reported, tone: 'success' })),
    block: () =>
      run(d.block(otherParty(offer, viewerId).id), () => {
        d.back()
        void d.refresh()
      }),
  }
}
