import { create } from 'zustand'
import type { MySource, PickedFile } from './types'

export const useDocImport = create<{ file: PickedFile | null }>(() => ({ file: null }))

export const useDocDelete = create<{ doc: Pick<MySource, 'id' | 'fileName'> | null }>(() => ({ doc: null }))
