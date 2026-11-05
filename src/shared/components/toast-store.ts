import { useEffect, useId } from 'react'
import { create } from 'zustand'
import { TOAST_MS } from './constants'

export type ToastInput = { message: string; action?: { label: string; onPress: () => void } }
export type Toast = ToastInput & { id: number }

type State = { current: Toast | null; hosts: string[] }

export const useToastStore = create<State>(() => ({ current: null, hosts: [] }))

let seq = 0

export const showToast = (toast: ToastInput) => useToastStore.setState({ current: { ...toast, id: ++seq } })

export const hideToast = (id: number) => useToastStore.setState((s) => (s.current?.id === id ? { current: null } : s))

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
