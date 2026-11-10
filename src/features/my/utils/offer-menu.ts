import { offerMenu, offerMenuKeys, OFFER_MENU_COPY, offerBlockConfirm, otherParty, type OfferBox, type OfferMenuDeps as SharedDeps, type OfferMenuToast } from '@push/shared'
import type { Offer } from '@push/api-client'
import type { ConfirmRequest } from '@/shared/components/confirm-store'
import type { MenuSection } from '@/shared/components/menu-action'
import { toastOffsets, type ToastInput } from '@/shared/components/toast-store'

export { offerMenu, otherParty, viewerBox } from '@push/shared'

const hasBottomBar = (o: Offer, box: OfferBox) => o.status === 'ACCEPTED' || (box === 'received' && (o.status === 'SENT' || o.status === 'READ'))

/** The app toast for a shared offer-menu toast; the report toast sits above the offer's bottom bar when it has one. */
export const offerToast = (offer: Offer, box: OfferBox, { kind, message, undo }: OfferMenuToast): ToastInput => ({
  message,
  ...(kind === 'failed' ? { tone: 'error' as const } : {}),
  ...(undo ? { action: { label: OFFER_MENU_COPY.undo, onPress: undo } } : {}),
  ...(kind === 'reported' && hasBottomBar(offer, box) ? { bottom: toastOffsets(0).cta } : {}),
})

export type OfferMenuDeps = Omit<SharedDeps, 'toast'> & { toast: (t: ToastInput) => void }

export type OfferMenuSectionDeps = OfferMenuDeps & {
  profile: (userId: string) => void
  confirm: (r: ConfirmRequest) => void
}

const ACTIONS = {
  profile: { label: OFFER_MENU_COPY.profile, systemImage: 'person', icon: 'user' },
  archive: { label: OFFER_MENU_COPY.archive, systemImage: 'archivebox', icon: 'archive' },
  unarchive: { label: OFFER_MENU_COPY.unarchive, systemImage: 'tray.and.arrow.up', icon: 'archive' },
  report: { label: OFFER_MENU_COPY.report, systemImage: 'flag', icon: 'flag' },
  block: { label: OFFER_MENU_COPY.block, systemImage: 'nosign', icon: 'block', destructive: true },
} as const

export const offerMenuSections = (offer: Offer, box: OfferBox, d: OfferMenuSectionDeps): MenuSection[] => {
  const run = offerMenu(offer, box, { ...d, toast: (t) => d.toast(offerToast(offer, box, t)) })
  const who = otherParty(offer, box)
  const press = {
    profile: () => d.profile(who.id),
    archive: () => void run.archive(),
    unarchive: () => void run.unarchive(),
    report: () => void run.report(),
    block: () => d.confirm({ ...offerBlockConfirm(who.displayName), danger: true, onConfirm: () => void run.block() }),
  }
  return offerMenuKeys(offer, box).map((keys, i) => ({
    key: i ? 'harm' : 'keep',
    actions: keys.map((key) => ({ key, ...ACTIONS[key], onPress: press[key] })),
  }))
}
