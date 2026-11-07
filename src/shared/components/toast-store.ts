import { useEffect, useId } from 'react'
import { create } from 'zustand'
import { TOAST_MS } from './constants'

export type ToastTone = 'success' | 'error'
export type ToastInput = {
  message: string
  action?: { label: string; onPress: () => void }
  /** Leading status icon. Leave unset on undo/action toasts. */
  tone?: ToastTone
  /** Distance above the bottom safe inset, to clear a tab bar or CTA (see TOAST_ABOVE). Defaults to TOAST_BOTTOM_GAP. */
  bottom?: number
}
export type Toast = ToastInput & { id: number }

/** Artboard toast bottoms above the safe inset, given the tab bar's height above it. */
export const toastOffsets = (tabBar: number) => ({ tabs: tabBar + 14, docsCta: tabBar + 100, docsError: tabBar + 150, cta: 92 }) as const

type OpenSheet = { id: string; height: number }
type State = { current: Toast | null; hosts: string[]; sheets: OpenSheet[] }

export const useToastStore = create<State>(() => ({ current: null, hosts: [], sheets: [] }))

let seq = 0

export const showToast = (toast: ToastInput) => useToastStore.setState({ current: { ...toast, id: ++seq } })

export const hideToast = (id: number) => useToastStore.setState((s) => (s.current?.id === id ? { current: null } : s))

const putSheet = (sheets: OpenSheet[], id: string, height?: number) =>
  sheets.some((x) => x.id === id) ? sheets.map((x) => (x.id === id && height !== undefined ? { id, height } : x)) : [...sheets, { id, height: height ?? 0 }]

/** Android (ToastSheetAndroid): an opening sheet clears the toast, and a toast shown while it is open floats above its top. */
export const mountSheet = (id: string) => {
  useToastStore.setState((s) => ({ current: null, sheets: putSheet(s.sheets, id) }))
  return () => useToastStore.setState((s) => ({ sheets: s.sheets.filter((x) => x.id !== id) }))
}

export const sizeSheet = (id: string, height: number) => useToastStore.setState((s) => ({ sheets: putSheet(s.sheets, id, height) }))

/** Height of the top open sheet, 0 when none. */
export const topSheet = (s: State) => s.sheets.at(-1)?.height ?? 0

export const toastDuration = (toast: ToastInput) => (toast.action ? TOAST_MS.action : TOAST_MS.plain)

export const activeToastHost = (s: State) => s.hosts.at(-1)

export const mountToastHost = (id: string) => {
  useToastStore.setState((s) => ({ hosts: [...s.hosts, id] }))
  return () => useToastStore.setState((s) => ({ hosts: s.hosts.filter((h) => h !== id) }))
}

/** Registers the calling ToastHost; only the last mounted host shows toasts. */
export const useHostedToast = () => {
  const id = useId()
  useEffect(() => mountToastHost(id), [id])
  return useToastStore((s) => (activeToastHost(s) === id ? s.current : null))
}
