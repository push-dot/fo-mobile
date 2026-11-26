import { Suspense, createElement, lazy, useEffect, type ComponentType } from 'react'
import { useFocusedOnce } from './use-focused-once'

export const lazyTab = (load: () => Promise<{ default: ComponentType }>) => {
  const Screen = lazy(load)
  const Tab = () => {
    const seen = useFocusedOnce()
    useEffect(() => {
      void load().catch(() => undefined)
    }, [])
    return seen ? createElement(Suspense, { fallback: null }, createElement(Screen)) : null
  }
  return Tab
}
