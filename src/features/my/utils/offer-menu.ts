import type { Offer } from '@push/api-client'
import type { ConfirmRequest } from '@/shared/components/confirm-store'
import type { MenuSection } from '@/shared/components/menu-action'
import { toastOffsets, type ToastInput } from '@/shared/components/toast-store'
import { OFFER_MENU_COPY, offerBlockConfirm, offerBlocked } from './my-rules'

type Box = 'received' | 'sent'

export const viewerBox = (o: Offer, viewerId: string | undefined, hint: Box): Box => {
  if (viewerId === o.sender.id) return 'sent'
  if (viewerId === o.recipient.id) return 'received'
  return hint
}

export const otherParty = (o: Offer, box: Box) => (box === 'sent' ? o.recipient : o.sender)

const hasBottomBar = (o: Offer, box: Box) => o.status === 'ACCEPTED' || (box === 'received' && (o.status === 'SENT' || o.status === 'READ'))

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
export const offerMenu = (offer: Offer, box: Box, d: OfferMenuDeps) => {
  const who = otherParty(offer, box)
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
    unarchive: () => run(d.unarchive(offer.id), () => void d.refresh()),
    report: () =>
      run(d.report(offer.id), () =>
        d.toast({ message: OFFER_MENU_COPY.reported, bottom: hasBottomBar(offer, box) ? toastOffsets(0).cta : undefined }),
      ),
    block: () =>
      run(d.block(who.id), () => {
        d.back()
        void d.refresh()
        d.toast({ message: offerBlocked(who.displayName) })
      }),
  }
}

export type OfferMenuSectionDeps = OfferMenuDeps & {
  profile: (userId: string) => void
  confirm: (r: ConfirmRequest) => void
}

export const offerMenuSections = (offer: Offer, box: Box, d: OfferMenuSectionDeps): MenuSection[] => {
  const run = offerMenu(offer, box, d)
  const who = otherParty(offer, box)
  const archived = !!offer.archivedAt
  const keep: MenuSection['actions'] = [
    { key: 'profile', label: OFFER_MENU_COPY.profile, systemImage: 'person', icon: 'user', onPress: () => d.profile(who.id) },
  ]
  if (archived)
    keep.push({ key: 'unarchive', label: OFFER_MENU_COPY.unarchive, systemImage: 'tray.and.arrow.up', icon: 'archive', onPress: () => void run.unarchive() })
  else if (box === 'received')
    keep.push({ key: 'archive', label: OFFER_MENU_COPY.archive, systemImage: 'archivebox', icon: 'archive', onPress: () => void run.archive() })
  const harm: MenuSection['actions'] = [
    { key: 'report', label: OFFER_MENU_COPY.report, systemImage: 'flag', icon: 'flag', onPress: () => void run.report() },
    {
      key: 'block',
      label: OFFER_MENU_COPY.block,
      systemImage: 'nosign',
      icon: 'block',
      destructive: true,
      onPress: () => d.confirm({ ...offerBlockConfirm(who.displayName), danger: true, onConfirm: () => void run.block() }),
    },
  ]
  return [
    { key: 'keep', actions: keep },
    { key: 'harm', actions: harm },
  ]
}
