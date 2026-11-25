import { createContext, type ComponentRef, type RefObject } from 'react'
import type { View } from 'react-native'

export type Host = ComponentRef<typeof View>

export type Paint = { enlist: (key: string, side: 'left' | 'right', edge: RefObject<Host | null>) => void; drop: (key: string) => void }

export const FindHighlight = createContext<{ query: string; currentId?: string; currentHit?: number }>({ query: '' })
export const FindPaint = createContext<Paint | null>(null)
export const FindDrawn = createContext<ReadonlySet<string>>(new Set())
