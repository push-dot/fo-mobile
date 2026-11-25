import { useEffect, useId } from 'react'
import { create } from 'zustand'
import { TOAST_MS } from './constants'

export type ToastTone = 'success' | 'error'
export type ToastInput = {
  message: string
  action?: { label: string; onPress: () => void }
  tone?: ToastTone
  bottom?: number
  alert?: boolean
}
export type Toast = ToastInput & { id: number }

export const toastOffsets = (tabBar: number) => ({ tabs: tabBar + 14, docsError: tabBar + 150, cta: 92 }) as const

type OpenSheet = { id: string; height: number }
type State = { current: Toast | null; queued: Toast[]; hosts: string[]; sheets: OpenSheet[] }

export const useToastStore = create<State>(() => ({ current: null, queued: [], hosts: [], sheets: [] }))

let seq = 0

const keepsUndo = (toast: ToastInput) => !!toast.action && toast.tone !== 'error' && !toast.alert

const failureToast = (toast: ToastInput) => toast.tone === 'error' || !!toast.alert

export const showToast = (toast: ToastInput) => {
  const next = { ...toast, id: ++seq }
  useToastStore.setState((s) => {
    if (s.current && keepsUndo(s.current) && failureToast(toast)) return { queued: [...s.queued, next] }
    return { current: next, queued: s.queued }
  })
  return next.id
}

export const toastLive = (s: State, id: number) => s.current?.id === id || s.queued.some((t) => t.id === id)

export const useToastLive = (id: number | null) => useToastStore((s) => id != null && toastLive(s, id))

export const hideToast = (id: number) =>
  useToastStore.setState((s) => {
    if (s.current?.id === id) {
      const [next, ...queued] = s.queued
      return { current: next ?? null, queued }
    }
    if (!s.queued.some((item) => item.id === id)) return s
    return { queued: s.queued.filter((item) => item.id !== id) }
  })

const putSheet = (sheets: OpenSheet[], id: string, height?: number) =>
  sheets.some((x) => x.id === id) ? sheets.map((x) => (x.id === id && height !== undefined ? { id, height } : x)) : [...sheets, { id, height: height ?? 0 }]

export const mountSheet = (id: string, os: string) => {
  useToastStore.setState((s) =>
    os === 'android' ? { current: null, queued: [], sheets: putSheet(s.sheets, id) } : { sheets: putSheet(s.sheets, id) },
  )
  return () => useToastStore.setState((s) => ({ sheets: s.sheets.filter((x) => x.id !== id) }))
}

export const sizeSheet = (id: string, height: number) => useToastStore.setState((s) => ({ sheets: putSheet(s.sheets, id, height) }))

export const topSheet = (s: State) => s.sheets.at(-1)?.height ?? 0

export const toastDuration = (toast: ToastInput) => (toast.action ? TOAST_MS.action : TOAST_MS.plain)

export const activeToastHost = (s: State) => s.hosts.at(-1)

export const mountToastHost = (id: string) => {
  useToastStore.setState((s) => ({ hosts: [...s.hosts, id] }))
  return () => useToastStore.setState((s) => ({ hosts: s.hosts.filter((h) => h !== id) }))
}

export const useHostedToast = () => {
  const id = useId()
  useEffect(() => mountToastHost(id), [id])
  return useToastStore((s) => (activeToastHost(s) === id ? s.current : null))
}
