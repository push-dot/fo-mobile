import { createContext } from 'react'

export const RowMotion = createContext<{ key: string; live: boolean } | null>(null)
