import { router } from 'expo-router'
import { create } from 'zustand'

export type ConfirmRequest = {
  title: string
  body: string
  confirm: string
  cancel?: string
  danger?: boolean
  onConfirm: () => void
}

export type ConfirmHref = '/confirm' | '/(tabs)/(my)/confirm'

type ConfirmState = { request: ConfirmRequest | null; set: (request: ConfirmRequest | null) => void }

export const useConfirmStore = create<ConfirmState>()((set) => ({
  request: null,
  set: (request) => set({ request }),
}))

export const askConfirm = (request: ConfirmRequest, href: ConfirmHref = '/confirm') => {
  useConfirmStore.getState().set(request)
  router.push(href)
}
